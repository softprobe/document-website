---
title: How to record
---

# How to record

Recording is **phase 1** before replay: the agent captures entry traffic and dependency calls while real requests flow through your application. Without recorded cases, `sp replay run` has nothing to execute.

This page covers the **operational workflow**. Sampling, time windows, and operation include/exclude live in [recording policy](/en/testing/policies#recording-policy); field reference is in the [Policy YAML guide](/en/testing/policy-yaml-guide#recordingpolicy).

## What recording produces

Each captured request becomes a **case**: an entry (e.g. `Servlet`) plus dependency mockers on the call path (`HttpClient`, `Database`, `Redis`, …). See [How it works · Recording](/en/testing/how-it-works#recording-phase) for mechanics.

::: tip
Cases come **only** from agent-instrumented traffic. The CLI cannot author cases manually — send business or load-test traffic while recording is active.
:::

## Prerequisites

| Item | Detail |
|------|--------|
| App registered | `sp app create` → save `appId` |
| Recording policy applied | `sp policy recording apply` — [Recording policy](/en/testing/policies#recording-policy) |
| Agent attached | `-javaagent:…/sp-agent.jar` and `-Dsp.app.id` — [Java agent](/en/testing/java-agent) |
| Network | Agent can reach sp-boot (`SP_API_URL`, usually port `8090`) |

## Steps

### 1. Apply recording policy

Apply **before** traffic:

```bash
sp policy recording validate -f recording.yaml --json
sp policy recording apply -f recording.yaml --json
```

Global defaults (priority 0) already exclude `/health` and similar probes; use `priority > 0` on app policies to override sampling and scope.

### 2. Start the app with the agent

Follow [Java agent](/en/testing/java-agent) to attach `sp-agent.jar`:

```text
-Dsp.app.id=<your appId>
```

For multi-environment selectors, align agent tags with `envTags` in policy, e.g.:

```text
-Dsp.mocker.tags=env=prod
```

### 3. Generate traffic

Exercise APIs with real requests, load tests, or synthetic traffic. Probes excluded by policy will not create cases.

### 4. Verify cases exist

```bash
sp app status --app <appId> --json
sp record case list --app <appId> --since -1h --json
```

Optional: `sp record completeness --trace-id <id> --json`.

## Record vs replay environments

| Environment | Agent recording | Role |
|-------------|-----------------|------|
| Production / staging | On (per policy) | Build the case corpus |
| Test / CI replay host | Off or minimal | Avoid polluting the corpus during replay |

Use consistent `sp.mocker.tags` (e.g. `env=prod`) when filtering cases by source environment.

## Tuning what gets recorded

Configure these in **RecordingPolicy**, not as ad-hoc JVM flags:

- `ratePerHundredSeconds`, `machineCountLimit`
- `timeWindow`, `operations.include` / `exclude`
- `timeMock`, `serializeSkip`

See [Policy YAML guide · RecordingPolicy](/en/testing/policy-yaml-guide#recordingpolicy).

::: warning Avoid `machineCountLimit: 1` in production
This caps how many agent instances may record concurrently in an env group. With `1`, the first instance can hold the slot after it goes away, leaving others in “not recording”. Prefer omitting the field (unlimited) or setting it ≥ your instance count.
:::

## Troubleshooting: no cases

| Symptom | Check first |
|---------|-------------|
| Empty `sp record case list` | `ratePerHundredSeconds` is 0; outside `timeWindow`; operations `exclude`d |
| Agent shows not recording | `machineCountLimit` too low; another instance holding the quota |
| Few cases | Sampling cap; narrow `include` whitelist |
| No upload at all | `appId` matches policy `selector`; `SP_API_URL` reachable; agent online |

`spec.sensitiveData` on the record path is **not** applied by the agent yet; see [Policy YAML guide · Related configuration](/en/testing/policy-yaml-guide#related-configuration).

## Next (replay phase)

::: warning Cases before replay
Do not run `sp replay run` until `sp record case list` shows cases.
:::

1. Configure [mock and compare policies](/en/testing/policies#mock-policy) (before replay)
2. Run [Replay and diff](/en/testing/replay-and-diff)

Full lifecycle: [Getting started](/en/testing/getting-started)

## Related

- [Recording policy](/en/testing/policies#recording-policy)
- [Policy YAML guide](/en/testing/policy-yaml-guide)
- [CLI quickstart](/en/testing/getting-started)
