# Concepts

Java 录制回放产品说明（Agent、策略、回放语义）见 [Softprobe 测试](/zh/testing/)。

Istio/Envoy 网格采集与 SESSIFY 会话上下文（与 Java Agent 不同）见[平台核心概念](/zh/platform/advanced-guides/concepts)。

## Application (`appId`)

A registered service under test. Recording, replay, policies, and extraction rules are all scoped by **`appId`**.

| Field | Role |
|-------|------|
| `appName` | Unique label supplied at registration (`sp app create <appName>`). |
| `appId` | System-generated id (16-character hex). Configure the Java agent and CLI with this value. |

After registration, save `data.appId` from the create response. Attach the SoftProbe Java agent to your JVM with that id and your sp-backend URL, then confirm connectivity with `sp app status <appId>` or `sp app list --json`.

**Agent status** (`online`, `offline`, `never`) is derived from instance heartbeats, not from the app document alone. The server marks an app `offline` when the freshest heartbeat is older than the configured threshold (default 60 seconds).

**CLI reference:** [sp app](/zh/testing/commands/app)

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
  -Dsp.api.url=http://<sp-backend-host>:8090 \
  -jar app.jar
```

Pin `sp.app.id` for every production-like deployment. If the id changes between recording and replay, SoftProbe cannot reliably find the original cases or mock data.

## Replay target URL (`targetEnv`)

Replay does not use a symbolic environment label such as `staging` or `prod`. The schedule service field **`targetEnv`** is the **base URL of the running service** that will receive replayed HTTP traffic.

When you run `sp replay run --env <url>`, the CLI sends that value as `targetEnv` on `POST /api/createPlan`. The schedule module parses it as a URI (`DefaultDeploymentEnvironmentProviderImpl`) and builds a `ServiceInstance` whose `url` is that string. Replay senders then issue requests to that URL (for example `DefaultHttpReplaySender` uses `instanceRunner.getUrl()`).

Requirements:

- Use a reachable base URL for the app under test, including scheme and host (and port when not default), for example `http://travel-ota:8080` or `https://order-service.internal:8443`.
- The URL must parse as a URI with a non-empty host; otherwise plan validation fails with *requested target env unable load active instance*.
- This is independent of **`SP_API_URL`** / `api_url` in CLI config, which points at sp-backend (storage, report, schedule APIs), not at the service being replayed.

Optional **`sourceEnv`** on the same request is a separate URI used only when you need a non-default source deployment; the demo stack often leaves it as `pro`.

**CLI reference:** [sp replay](/zh/testing/commands/replay) (`--env` → `targetEnv`)

## Recording policy

Declarative YAML (`kind: RecordingPolicy`) controlling what the agent records: sampling, operation include/exclude, time windows, sensitive-field scrubbing.

- Managed via `sp policy recording`
- Schema: [策略 YAML 指南](/zh/testing/policy-yaml-guide)

## Mock policy

Declarative YAML (`kind: MockPolicy`) controlling replay-time mocking: skip/force mock, tolerance, dependencies.

- `sp policy mock`

## Compare rules

Declarative YAML (`kind: CompareRulePolicy`) controlling diff behavior during replay comparison.

- `sp policy compare`

Policies merge by `metadata.priority`; global defaults ship in `sp-policy-rules` JAR resources.

## Replay plan

A batch replay job with a `planId`. Created by `sp replay run`, tracked with `sp replay status`. Replay plans consume cases already recorded by an instrumented app; a fresh app with no recorded traffic has nothing meaningful to replay.

Schedule service endpoints: `/api/createPlan`, `/api/progress`, `/api/stopPlan`.

## Trace、replay 与 plan ID {#trace-replay-and-plan-ids}

平台 ID 把录制、回放、diff 与**关联日志检索**串联起来。完整参考——每个 ID 的含义、在哪里获取、以及如何分诊统一日志——见 **[日志关联 ID](/zh/testing/reference/log-correlation-ids)**。

| ID | 含义 | 日志查询（v1） |
|----|------|----------------|
| `traceId` | 一次录制或回放请求流的 W3C trace id | **`sp logs --trace-id …`** 或 `GET /api/recorder/logs?trace_id=…` —— **唯一的 v1 键** |
| `replayId` | 一个 case 的一次回放**尝试** | 仅用于 diff/diagnose —— 查日志请从同一 case 行复制 **`traceId`** |
| `planId` | `sp replay run` 产生的回放计划容器 | case 列表 / diagnose —— 查日志用每个 case 的 **`traceId`** |
| `planItemId` | 计划内的操作级条目 | 同上 —— 不是日志查询键 |
| `diffId` | 用于深度 diff 拉取的比对结果行 | 用 `sp replay diff get` —— 不是日志查询键 |

**ID 在 CLI 输出中的位置**

| 命令 | 字段 |
|------|------|
| `sp replay run --json` | `planId` |
| `sp replay case list --plan … --json` | `replayId`、`traceId`、plan item id |
| `sp replay metadata <replayId> --json` | `traceId`、关联的录制元数据 |
| `sp trace find … --json` | 解析业务属性时的 `traceId` |
| `sp diagnose replay <planId> --json` | 带 id 的失败 case，供后续跟进 |

当用户提供业务属性（orderId、caseId）而非 trace id 时，Agent 应通过 `sp trace find` 获取 `traceId`。回放失败后做日志诊断时，使用失败回放 case 中的 **`traceId`** 或 e2e **Softprobe correlation** 块（`trace_id` 字段）——而不是把 `replayId` 当作日志查询键。

## Historical coupling: schedule ↔ recording

Replay operation include/exclude lists on schedule configuration are **populated from recording policy at read time**, not stored independently on the schedule document.

Implications:

- Changing recording policy can change which operations appear in replay scope without editing schedule config.
- Diagnosis skills must not assume schedule Mongo documents are the sole source of operation filters.

See server comments on `ScheduleConfigurableHandler` in sp-tr-api.

Test cases are created only via **recording** (instrumented app traffic). Manual case authoring is not part of the CLI workflow.

## Related

- [For agents](./overview)
- [Commands](/zh/testing/commands/)
