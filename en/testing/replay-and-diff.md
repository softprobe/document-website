---
title: Replay and diff
---

# Replay and diff

Replay turns the cases you collected in [Record](/en/testing/recording) into a **regression run**: the original entry requests are sent to your **test instance** as-is, dependency calls (database, external HTTP, …) are automatically mocked from recorded data, and when the run finishes each case gets an automatic pass/fail from comparing recorded vs replayed responses.

Continuing the `order-service` example: production traffic has built a corpus of cases, and now you want to verify a new build in the test environment for regressions.

## Step 1 · Prepare the test instance

Run the **new build** in the test environment, same agent, same `appId`:

```bash
java -javaagent:sp-agent.jar \
     -Dsp.app.id=<your appId> \
     -Dsp.api.url=http://<backend-host>:8090 \
     -jar order-service-new.jar
```

Note its base URL, e.g. `http://order-service.test:8080` — this is **`targetEnv`**, the destination for replayed traffic.

::: warning Record in prod, replay in test
Replay sends **real HTTP requests** to `targetEnv` (only downstream dependencies are mocked), so the replay target should be a non-production instance unless you explicitly accept the risk. Also turn recording off (or near zero) on the replay host so the run doesn't capture a second corpus on top of the replay.
:::

## Step 2 · Start the replay

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

1. Open the application's Workbench and navigate to **Replay** in the left sidebar.
2. Click **+ New Plan**, and enter the test service URL in **Target Environment (targetEnv)** (e.g. `http://order-service.test:8080`).
3. Choose the replay scope (All endpoints, Select endpoints, or Pinned cases), then click **Create Plan** to monitor real-time execution progress.

![Starting a replay run in the Workbench](/img/docs/testing/en/replay-recordings.gif)

</Interface>
<Interface id="cli">

```bash
sp replay run --app <your appId> --env http://order-service.test:8080 --json
```

The command returns a `planId`. Watch it to completion:

```bash
sp replay status <planId> --watch
```

</Interface>
</InterfaceTabs>

::: tip Don't mix up the two URLs
`--env` (`targetEnv`) is the address of the **service under test**; `SP_API_URL` is the address of the **sp-backend service**. Confusing them is the most common integration mistake — see [CLI concepts](/en/testing/agents/concepts#replay-target-url-targetenv).
:::

What happens during the run: the schedule service preloads the cases' mocks into Redis, then re-sends each recorded entry request to `targetEnv`; your service executes its real business code, but on every dependency call the agent returns the **recorded** response — no real database or external system is touched; replay-side traffic is stored and automatically compared against the recorded side.

sp-backend logs **`Replay send start`** before each dispatched entry call and **`Replay send done`** / **`Replay send failed`** after — the entry/exit boundary for replay HTTP dispatch. See [Replay send log markers](/en/testing/reference/replay-send-log-markers).

## Step 3 · Read the results

A case **passes** when compare finds no material differences. **Failed** cases show a diff scene:

- **Value diff** — the dependency was called, but the response body differs
- **Missing call** — a dependency called during record was not called during replay
- **Main response diff** — the entry response differs from the recording

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

1. Click into the plan details from the replay list to inspect the overall pass rate and per-endpoint test statistics.
2. Select a failed case on the left to reveal the side-by-side Diff comparison drawer (recorded vs. replayed response).
3. Hover over differences to ignore dynamic noise fields or use **Recompare** in the header to re-evaluate immediately.

![Reviewing replay results and diffs in the Workbench](/img/docs/testing/en/review-diffs.gif)

</Interface>
<Interface id="cli">

Quick triage from the command line:

```bash
sp replay case list --plan <planId> --json     # which cases failed
sp diagnose replay <planId> --failed-only --out-dir .sp-work --json   # failure detail + diff artifacts on disk
```

Once you have a difference's `diffId`, inspect the full single diff: `sp replay diff get <diffId> --out-dir .sp-work --json`.

</Interface>
</InterfaceTabs>

## Failures? Don't call them bugs yet

**Most failures are not bugs.** Timestamps, random IDs, pod IPs, and session tokens change on every run — they will always "differ" without anything being wrong. The last two workflow steps exist for exactly this:

- **[Review diffs](/en/testing/review-diffs-in-the-web-ui)** — read each diff in the workbench, accept the ones that aren't real bugs, and let true failures stand out
- **[Configure compare rules](/en/testing/compare-rules-web-ui)** — turn always-changing fields into rules so future replays stop false-alarming

Rules can also be declared in YAML (`sp policy compare`) for CI and GitOps — see [Policy YAML guide · CompareRulePolicy](/en/testing/policy-yaml-guide#comparerulepolicy).

## Terminology

| Concept | Meaning |
|---------|---------|
| `targetEnv` / `--env` | Base URL of the service receiving replayed entry traffic |
| `planId` | Container for the whole run |
| `planItemId` | One operation (API path) within the plan |
| `replayId` | One replay execution of a single case |
| Case | One recorded entry request + its dependency mockers |

## Replay scope

For a normal replay, the plan's time range and operation filters determine which cases replay, together with the recording policy's `operations` include/exclude. Rolling replay uses this time-window-based selection by default.

Replay has two case-selection modes:

| Mode | Selection | Time range |
|------|-----------|------------|
| Rolling (default) | Recorded cases matching the plan's time range and operation filters | Applied; omitted flags use the normal rolling window |
| `--suite Pinned` | Cases manually saved in the application's `Pinned` collection | Not applied; `--from` and `--to` are ignored |

`Pinned` is intended for a stable regression suite. It includes manual pinned cases only and excludes automatically managed `AutoPinned` cases. A pinned case can therefore be replayed even when its recording is older than the normal rolling window.

To run the pinned suite:

```bash
sp replay run \
  --app <your appId> \
  --env http://order-service.test:8080 \
  --suite Pinned \
  --watch \
  --json
```

An empty manual collection fails with `NO_PINNED_CASES`; it does not create a misleading empty passing run. To expand a Rolling corpus, go back to [Record](/en/testing/recording) and record more traffic. To change a Pinned suite, pin or unpin cases in the Workbench.

To replay recordings after their normal retention window in Workbench, use the **Pinned cases** scope when creating a plan and select the saved cases that should make up that test set. See [Pin cases & test sets](/en/testing/pinned-cases).

If a pinned case's API has been deleted or renamed, Workbench marks it **API gone** and skips it. Update the application configuration or remove that case from the test set.

## Automation

Humans review diffs in the workbench; CI and AI agents should use `sp diagnose replay <planId> --json` and the `--out-dir` artifacts from the [output contract](/en/testing/agents/output-contract). For deploy-triggered replays and pipeline gates, see [Webhook and CI/CD](/en/testing/webhook-and-ci).

## Next

The run finished with failing cases → **[Review diffs](/en/testing/review-diffs-in-the-web-ui)**: understand them and clear the noise.
