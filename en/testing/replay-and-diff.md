---
title: Replay and diff
---

# Replay plans and comparison

Replay is **phase 2**: turn recorded cases into a **regression run** (same entry requests, mocked dependencies, automatic pass/fail from diffs).

::: tip Record before replay
1. Complete [How to record](/en/testing/recording) and confirm `sp record case list` shows cases  
2. Apply [mock and compare policies](/en/testing/policies#mock-policy)  
3. Then run `sp replay run` on this page
:::

## Prerequisites

- **Recorded cases** exist for the `appId` — see [How to record](/en/testing/recording)
- App under test running in the **test environment** with the agent attached
- Mock and compare policies applied
- Reachable **`targetEnv`** — base URL of that test instance

::: warning Record in prod, replay in test
Record against production or staging traffic when appropriate, but **run replay against a non-production instance** unless you explicitly accept the risk. The replay driver sends real HTTP to `targetEnv`; only downstream calls are mocked.
:::

On the replay host, turn **recording frequency down or off** so the run does not capture a second corpus on top of the replay.

## Replay plan

A **plan** is a batch job with a `planId`:

```bash
sp replay run --app <appId> --env http://order-service.test:8080 --json
sp replay status --plan <planId> --json
```

| Concept | Meaning |
|---------|---------|
| `targetEnv` / `--env` | Base URL of the service receiving replayed entry traffic (scheme + host + port) |
| `planId` | Container for the whole run |
| `planItemId` | One operation (API path) within the plan |
| `replayId` | One replay execution of a single case |
| Case | One recorded entry request + its dependency mockers |

`SP_API_URL` points at **sp-boot**, not at `targetEnv`. Mixing them up is a common integration mistake — see [CLI concepts](/en/cli/guide/concepts#replay-target-url-targetenv).

## What happens during replay

1. Schedule loads selected cases and **preloads** mocks into Redis.
2. For each case, schedule issues the recorded entry HTTP call to `targetEnv`. sp-backend logs **`Replay send start`** before the call and **`Replay send done`** or **`Replay send failed`** after — the entry/exit boundary for replay HTTP dispatch. See [Replay send log markers](/en/cli/reference/replay-send-log-markers).
3. Your service handles the request; on each dependency, the agent queries storage and returns the **recorded** response.
4. Storage logs replay-side mockers for comparison.
5. Compare engine runs; results land in replay reports and diff APIs.

**Entry traffic is real; dependencies are not.** The main API executes on the test JVM; databases and external HTTP clients receive mocked bodies when mock policy applies.

## Pass, fail, and invalid

A case **passes** when compare finds no material differences between recorded and replay traffic for configured scopes. **Failed** cases show diff scenes — for example:

- **Missing dependency call** — e.g. `HttpClient` did not call `/api/foo` during replay but did during record
- **Value diff** — call happened but response body differs
- **Main response diff** — entry `Servlet` response unlike recording

Investigate with:

```bash
sp replay case list --plan <planId> --json
sp replay diff --plan <planId> --json
sp diagnose replay --plan <planId> --json
```

## Reducing noise

Fields that legitimately differ across environments — timestamps, random IDs, pod IPs, session tokens — cause false failures unless ignored.

Approaches:

1. **CompareRulePolicy** — declare ignored JSON paths or categories before re-running replay
2. **Repeat replay** — some teams run twice in the same environment to detect unstable fields (legacy “intelligent recommendation” flows suggested ignore lists from paired runs)
3. **Time and random** — default mock policy force-mocks `DynamicClass` time/random sources

Configure via `sp policy compare` rather than one-off UI toggles where possible so CI and agents share the same rules.

### Common ignore patterns

| Noise source | Mitigation |
|--------------|------------|
| `createdAt`, `updatedAt` | Ignore node in compare policy |
| UUID / trace ids | Ignore or regex transform |
| Base64-wrapped payloads | Decompress / decode in compare policy when configured |
| DB `SELECT` metadata | Global defaults often exclude low-signal operations |

## Case selection

Replay scope comes from:

- Time range and operation filters on the plan request
- Recording policy operation include/exclude (coupled at read time in schedule config)

There is no CLI workflow to manually author cases; expand coverage by recording more traffic or adjusting recording policy.

## Dashboard and CLI

Humans often review diff trees in the workbench or dashboard; agents and CI should use **`sp replay diff`** and artifact `--out-dir` paths from [output contract](/en/cli/guide/output-contract).

For deploy webhooks and GitHub Actions / Jenkins gates, see [Webhook and CI/CD](/en/testing/webhook-and-ci).

## Related

- [How it works](/en/testing/how-it-works)
- [Policies](/en/testing/policies)
- [CLI: replay command](/en/cli/commands/replay)
- [Webhook and CI/CD](/en/testing/webhook-and-ci)
- [Example: diagnose replay failure](/en/cli/examples/agent-diagnose-replay)
