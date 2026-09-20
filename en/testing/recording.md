---
title: Record traffic
---

# Record traffic

Recording means letting your agent-attached application **handle real requests as usual** — every request that flows through, together with the dependency calls it triggers (database, HTTP, Redis, …), is automatically stored as a **case**: the raw material for replay.

This page follows `order-service` as the running example: the agent is attached per [Attach the Java agent](/en/testing/java-agent), and the app is registered (you have its `appId`) as in the quick start. All four workflow steps use this same application.

::: tip Records out of the box — no policy needed first
The built-in global default policy (priority 0) makes recording work out of the box, and already excludes `/health` and similar probes. You only need to write an app-level policy when you want to tune sampling, time windows, or operation scope — see [Tune what gets recorded](#tune-what-gets-recorded) at the end of this page.
:::

## Step 1 · Confirm the agent is online

Start the application in the **environment whose traffic you want to capture** (usually production or staging):

```bash
java -javaagent:sp-agent.jar \
     -Dsp.app.id=<your appId> \
     -Dsp.api.url=http://<backend-host>:8090 \
     -jar order-service.jar
```

Confirm the agent has reported in:

```bash
sp app status <your appId> --json
```

In multi-environment deployments, tag instances (e.g. `-Dsp.mocker.tags=env=prod`) — you will use the same tags later to filter cases and match policies.

## Step 2 · Let real traffic flow

Nothing to do — user requests, business calls, and load-test traffic passing through the app are captured automatically. In environments without natural traffic (e.g. staging), send a few business requests to the APIs yourself.

::: tip Cases are recorded, never hand-written
The CLI cannot author cases manually. Want more cases? Send more traffic through the app.
:::

## Step 3 · Confirm cases exist

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

1. Open the application's **Workbench** in the Softprobe console.
2. Expand **Rolling recordings** in the left sidebar, select an API operation, and inspect the captured case list.
3. Click any case to open trace details, verifying the entry request payload and mocked downstream calls (DB, Redis, HTTP).

![Reviewing recorded cases in the Workbench](/img/docs/testing/en/view-recorded-data.gif)

</Interface>
<Interface id="cli">

```bash
sp record case list --app <your appId> --since -1h --json
```

To check completeness per trace, use:

```bash
sp record completeness <traceId> --json
```

</Interface>
</InterfaceTabs>

Cases showing up in the list means step 1 of the workflow is done. If a case should survive the default retention window, [pin it and add it to a test set](/en/testing/pinned-cases) before moving on to [Replay](/en/testing/replay-and-diff).

## No cases? Check this table

| Symptom | Check first |
|---------|-------------|
| Empty `sp record case list` | An app-level policy set `ratePerHundredSeconds` to 0; outside `timeWindow`; operation `exclude`d |
| Agent shows not recording | `machineCountLimit` too low; another instance holding the quota |
| Few cases | Sampling cap; narrow `include` whitelist |
| No upload at all | `appId` doesn't match the policy `selector`; `SP_API_URL` unreachable; agent offline |

## Keep record and replay environments separate

| Environment | Agent recording | Role |
|-------------|-----------------|------|
| Production / staging | On | Build the case corpus from real traffic |
| Test / CI replay host | Off or minimal | Avoid recording a second corpus during replay |

Use consistent `sp.mocker.tags` (e.g. `env=prod`) when filtering cases by source environment.

## Tune what gets recorded {#tune-what-gets-recorded}

When the defaults don't fit — you want to control the sampling rate, record only some APIs, or restrict recording hours — write an app-level `RecordingPolicy` (`priority > 0` overrides the global default):

```bash
sp policy recording validate -f recording.yaml --json
sp policy recording apply -f recording.yaml --json
```

Tunables: `ratePerHundredSeconds` (sampling), `timeWindow` (hours), `operations.include/exclude` (API scope), `serializeSkip`, `timeMock`. Field-by-field reference and full examples: [Policy YAML guide · RecordingPolicy](/en/testing/policy-yaml-guide#recordingpolicy).

::: warning Avoid `machineCountLimit: 1` in production
This caps how many instances may record concurrently in an env group. With `1`, the first instance can hold the slot after it goes away, leaving others in "not recording". Prefer omitting the field (unlimited) or setting it ≥ your instance count.
:::

::: info Two known boundaries
- `spec.sensitiveData` on the record path does **not** change what is stored yet; for masking at view time see [SensitivePolicy](/en/testing/policy-yaml-guide#related-configuration).
- Changing `operations` include/exclude also affects the **replay schedule's** operation scope.
:::

## Next

Your cases are in the corpus → **[Pin cases & test sets](/en/testing/pinned-cases)** to keep selected cases, or continue to **[Replay & diff](/en/testing/replay-and-diff)** for a time-window replay.
