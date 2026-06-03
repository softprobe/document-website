::: warning CLI reference (English)
The `sp` CLI documentation is available in English. [Switch to English CLI docs](/en/cli/guide/overview).
:::

# Concepts

## Application (`appId`)

A registered service under test. Recording, replay, policies, and extraction rules are all scoped by **`appId`**.

| Field | Role |
|-------|------|
| `appName` | Unique label supplied at registration (`sp app create <appName>`). |
| `appId` | System-generated id (16-character hex). Configure the Java agent and CLI with this value. |

After registration, save `data.appId` from the create response. Attach the SoftProbe Java agent to your JVM with that id and your sp-boot URL, then confirm connectivity with `sp app status <appId>` or `sp app list --json`.

**Agent status** (`online`, `offline`, `never`) is derived from instance heartbeats, not from the app document alone. The server marks an app `offline` when the freshest heartbeat is older than the configured threshold (default 60 seconds).

**CLI reference:** [sp app](/en/cli/commands/app.md)

## Java agent

The SoftProbe Java agent is attached to the service under test with `-javaagent:/path/to/sp-agent.jar`. It operates like an observability agent operationally, but its purpose is test data capture and replay:

- During **recording**, it observes real requests and dependency interactions and uploads mocker data keyed by `appId` and trace/case ids.
- During **replay**, it restores recorded dependency behavior according to mock policy and emits replay data for comparison.
- It reports heartbeat/status so `sp app status <appId>` can tell whether an app is `online`, `offline`, or `never`.

Minimum startup flags:

```bash
java \
  -javaagent:/opt/softprobe/sp-agent.jar \
  -Dsp.app.id=<appId> \
  -Dsp.storage.service.host=<sp-boot-host:port> \
  -Dsp.config.service.host=<sp-boot-host:port> \
  -jar app.jar
```

Pin `sp.app.id` for every production-like deployment. If the id changes between recording and replay, SoftProbe cannot reliably find the original cases or mock data.

## Replay target URL (`targetEnv`)

Replay does not use a symbolic environment label such as `staging` or `prod`. The schedule service field **`targetEnv`** is the **base URL of the running service** that will receive replayed HTTP traffic.

When you run `sp replay run --env <url>`, the CLI sends that value as `targetEnv` on `POST /api/createPlan`. The schedule module parses it as a URI (`DefaultDeploymentEnvironmentProviderImpl`) and builds a `ServiceInstance` whose `url` is that string. Replay senders then issue requests to that URL (for example `DefaultHttpReplaySender` uses `instanceRunner.getUrl()`).

Requirements:

- Use a reachable base URL for the app under test, including scheme and host (and port when not default), for example `http://travel-ota:8080` or `https://order-service.internal:8443`.
- The URL must parse as a URI with a non-empty host; otherwise plan validation fails with *requested target env unable load active instance*.
- This is independent of **`SP_API_URL`** / `api_url` in CLI config, which points at sp-boot (storage, report, schedule APIs), not at the service being replayed.

Optional **`sourceEnv`** on the same request is a separate URI used only when you need a non-default source deployment; the demo stack often leaves it as `pro`.

**CLI reference:** [sp replay](/en/cli/commands/replay.md) (`--env` → `targetEnv`)

## Recording policy

Declarative YAML (`kind: RecordingPolicy`) controlling what the agent records: sampling, operation include/exclude, time windows, sensitive-field scrubbing.

- Managed via `sp policy recording`
- Schema: [Policy YAML guide](../../docs/policy-yaml-guide.md)

## Mock policy

Declarative YAML (`kind: MockPolicy`) controlling replay-time mocking: skip/force mock, tolerance, dependencies.

- `sp policy mock`

## Compare rules

Declarative YAML (`kind: CompareRulePolicy`) controlling diff behavior during replay comparison.

- `sp policy compare`

Policies merge by `metadata.priority`; global defaults ship in `sp-policy-rules` JAR resources.

## Replay plan

A batch replay job with a `planId`. Created by `sp replay run`, tracked with `sp replay status`. Replay plans consume cases already recorded by an instrumented app; a fresh app with no recorded traffic has nothing meaningful to replay.

Schedule service endpoints: `/api/createPlan`, `/progress`, `/api/stopPlan`.

## Trace and replay IDs

| ID | Meaning |
|----|---------|
| `traceId` | W3C trace id for a recorded request |
| `replayId` | Identifier for one replay execution of a case |
| `planId` | Replay plan container |
| `planItemId` | Operation-level item within a plan |
| `diffId` | Comparison result row for deep diff fetch |

Agents should obtain `traceId` via `sp trace find` when users supply business attributes (orderId, caseId) instead of trace IDs.

## Historical coupling: schedule ↔ recording

Replay operation include/exclude lists on schedule configuration are **populated from recording policy at read time**, not stored independently on the schedule document.

Implications:

- Changing recording policy can change which operations appear in replay scope without editing schedule config.
- Diagnosis skills must not assume schedule Mongo documents are the sole source of operation filters.

See server comments on `ScheduleConfigurableHandler` in sp-tr-api.

Test cases are created only via **recording** (instrumented app traffic). Manual case authoring is not part of the CLI workflow.

## Related

- [For agents](./overview.md)
- [Commands](/en/cli/commands/)
