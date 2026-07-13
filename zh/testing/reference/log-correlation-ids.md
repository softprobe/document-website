# 日志关联 ID

> 本页翻译可能滞后于英文版，如有出入以[英文版](/en/testing/reference/log-correlation-ids)为准。

当回放失败时，你需要一个 **`trace_id`** 和一个有界的时间窗口，才能在一次查询中，同时拉取被测应用、Java agent 和 sp-backend 三方的关联日志。本页说明每个 id 的含义、**在哪里找到它**，以及**如何分诊**统一日志的查询结果。

需要在你的部署环境或本地 compose 栈中启用统一日志管道（Vector → Parquet）。如果该管道被禁用，日志查询会快速失败并给出明确的错误——它们不会回退到其他日志存储。

**命令参考：** [sp logs](/zh/testing/commands/logs) · **API：** `GET /api/recorder/logs?trace_id=…&since=…&until=…`

---

## ID 速查

| ID | 支持 v1 日志查询？ | 它标识什么 | 用于日志检索 |
|----|----------------|--------------------|--------------------|
| **`traceId`** | **是**（`--trace-id`） | 一次请求流的 W3C OpenTelemetry trace | **唯一的 v1 查询键**——`[since, until)` 内该 trace 上所有 agent/app/backend 日志行 |
| **`replayId`** | 否 | 某个已录制 case 的一次回放**尝试** | 定位失败的 case 及 diff；从同一行复制 **`traceId`** 用于查日志 |
| **`planId`** | 否 | 一个回放**计划**（`sp replay run` 产生的批次） | 限定诊断 / case 列表范围；复制每个 case 的 **`traceId`** 用于查日志 |
| **`planItemId`** | 否 | 计划内的一个 **case/操作** | 同上——与 case 列表配合使用，不能作为日志查询键 |
| **`diffId`** | 否 | 一行 compare/diff 结果 | 与 `sp replay diff get` 配合使用，不用于查日志 |

每一行日志都带有 **`source`**：`agent`（Java agent 诊断日志）、`app`（由 agent 采集的被测应用日志）或 `backend`（sp-backend 诊断日志）。API/Parquet 使用不带前缀的列名（`source`、`replay_id`、……）。在 Vector 归一化之前，OTLP 线路格式可能使用 `sp.*` 键。

**不在 v1 日志查询结果中的字段：** `sessionId` / `sp.session_id`。

**在 v1 中被拒绝的项：** `--replay-id`、`--plan-id`、`--plan-item-id`、`--include-recording-log`、`GET /api/record-logs/*`、`GET /api/replay-logs/*`。

---

## 在哪里找到 `traceId`（查日志的主键）

| 来源 | 方法 |
|--------|-----|
| 失败回放 case 列表 | `sp replay case list --plan <planId> --failed --json` → `data.items[].traceId` |
| 回放元数据 | `sp replay metadata <replayId> --json` → `traceId` |
| 诊断工作流 | `sp diagnose replay <planId> --failed-only --json` → 再看 case 列表取 `traceId` |
| CI / `make e2e` | pytest 失败信息下的 **Softprobe correlation** 区块 → 每个 case 的 `trace_id` 字段 |
| 已录制 case | `sp record case list --app <appId> --since -24h --json` → 入口 case 的 trace id |

**重要：** 对于回放失败，请使用**回放 case 上的 `traceId`**（与录制时的 trace 相同——schedule 会把它放在 `traceparent` 上）。**不要**从最新的录制列表页或健康检查流量（`/index.html`、`/`）里去猜——那些 trace 是不相关的噪声。

pytest 输出中的 `replayId`、`planId` 和 `planItemId` 仅供人工参考以及 diff/diagnose 命令使用——它们**不是** v1 日志查询键。

---

## 查询关联日志

每次查询都需要 **`trace_id`** 外加 **`since`** 和 **`until`**。使用 **ISO-8601 UTC**（例如 `2026-06-27T10:00:00Z`）。`since` 为**闭区间**，`until` 为**开区间**（`[since, until)`）。

### CLI（主要方式）

```bash
sp logs --trace-id <traceId> --since <start> --until <end> [--json]
```

给脚本和 AI agent 使用时加上 **`--json`**。默认输出是人类可读的文本。

### HTTP API（当 `sp` 不在 PATH 中时）

```bash
export SP_API_URL="${SP_API_URL:-http://127.0.0.1:18090}"
TRACE_ID="2057ad46a7ce03d3955385f2a4142d29"
SINCE="2026-06-27T10:00:00Z"
UNTIL="2026-06-27T10:05:00Z"

curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&since=${SINCE}&until=${UNTIL}" \
  -H "Accept: application/json" -o /tmp/trace-logs.json
```

### 选择 `since` / `until`

**当你有 case 时间戳（`recordTime` 和 `replayTime`）时：** 分别做**两次** ±2 分钟的查询——每个锚点各查一次——然后合并结果行。绝不要在一次查询中把录制时间跨到回放时间。参见 [sp logs — 按 case 范围查询](/zh/testing/commands/logs#case-scoped-lookup-dual-windows)。

**否则：**

1. 从失败点附近的窗口开始（例如从计划完成前五分钟到完成后一分钟）。
2. 如果你预期的某个 `source`（`agent`、`app`、`backend`）行数为零，则加宽窗口。
3. 执行 `make compose-parquet-clean` 后的 E2E：重跑会话，然后轮询最多约 180 秒等待 Vector 摄取。
4. v1 会返回窗口内**所有**匹配的行——输出量大时请在本地重定向或用管道处理：

```bash
sp logs --trace-id <id> --since … --until … > /tmp/trace.log
grep ERROR /tmp/trace.log | head -20
```

v1 日志查询没有 `--limit` 参数。

---

## 分诊统一日志结果

拉取日志后，按以下顺序处理。

**`sp --json logs`** 会把 API body 包裹在 `.data` 里——请使用 `jq '.data.rows'`、`jq '.data.warnings'`。**`curl`** 直接保存 API JSON——请使用 `jq '.rows'`、`jq '.warnings'`。

```bash
# 使用 sp --json logs 之后（CLI 信封结构）
jq '.data.rows | length' /tmp/trace-logs.json
jq '[.data.rows[].source] | group_by(.) | map({source: .[0], n: length})' /tmp/trace-logs.json
jq '.data.warnings' /tmp/trace-logs.json
jq -r '.data.rows[] | select(.source=="backend" and .severity=="ERROR") | "\(.timestamp) \(.body)"' /tmp/trace-logs.json | head -20

# 使用 curl GET /api/recorder/logs 之后（API body 位于顶层）
jq '.rows | length' /tmp/trace-logs.json
jq '[.rows[].source] | group_by(.) | map({source: .[0], n: length})' /tmp/trace-logs.json
jq '.warnings' /tmp/trace-logs.json
jq -r '.rows[] | select(.source=="backend" and .severity=="ERROR") | "\(.timestamp) \(.body)"' /tmp/trace-logs.json | head -20
```

### 症状对照表

| 你看到的现象 | 可能含义 | 下一步 |
|--------------|----------------|--------|
| `rows` 为空 + `warnings` 非空 | Parquet 读取器/schema 不匹配（例如 backend 镜像过旧） | 重新构建 sp-backend；确认 API 行使用的是 `source` 而非 `sp.source` |
| `rows` 为空 + `warnings` 为空 | `trace_id` 错误、窗口过窄，或摄取有延迟 | 使用回放 case 的 `traceId`；加宽 `[since, until)`；重跑回放 |
| 同时有 `agent`、`app` 和 `backend` 的行 | 该 trace 的管道健康 | 阅读 `body` 中的 ERROR/WARN；compare 失败时用 `sp diagnose` 的 diff |
| 只有 `backend`，没有 `app`/`agent` | agent 未导出或应用日志沉默 | 检查 agent 挂载、`sp.enable.debug`、应用 logger 级别 |

**同一个业务请求**的录制阶段与回放阶段日志行，在回放时共享一个 **`trace_id`**（录制的 trace 在 `traceparent` 上被复用）。一次 trace 查询即可同时包含两者，无需 `--include-recording-log`（在 v1 中已移除）。

---

## 读取响应

**HTTP API** 顶层字段：

- `lookup` —— 类型 `trace`、其值，以及调用方给的 `[since, until)` 边界
- `rows[]` —— 每一行：`timestamp`、`severity`、`body`、`service_name`、`source`，以及可选的 `trace_id`、`span_id`、`replay_id`、`plan_id`、`plan_item_id`
- `warnings` —— 非致命的 schema 跳过或类似情况（可能为空）

**`sp --json logs`** 返回一个 CLI 信封：`{"ok":true,"command":"logs","data":{...}}` —— 在脚本中请使用 `.data.rows` 和 `.data.warnings`。

v1 响应**不**包含 `source_summary`。请用 `jq` 在本地计算每个 source 的计数（见上文）。

完整字段参考见 [日志查询字段](/zh/testing/commands/log-query-fields)。

---

## Pytest / `make e2e` 失败

当出现回放相关的测试失败时，pytest 会打印：

1. **Softprobe correlation** —— `trace_id`（用于日志查询），以及供参考的 `replay_id`、`plan_id`、`plan_item_id`。
2. **Unified logs** —— 可选摘要：当 hook 执行了 curl 时，给出行数以及每个 `source` 的计数。

从该区块复制 `trace_id` 以及建议的 `since`/`until`，然后先运行上面的分诊命令，再深入应用代码。

---

## 典型失败排查流程

```text
1. sp replay case list --plan <planId> --failed --json
      → 复制 traceId（以及用于 diff/diagnose 的 replayId）

2. sp logs --trace-id <traceId> --since … --until … [--json]
      → 分诊：计数 → 来源 → warnings → 阅读 backend/agent/app 的 body
      （仅当 sp 不可用时才用 curl GET /api/recorder/logs）

3. sp diagnose replay <planId> --failed-only --out-dir .sp-work --json
      → 阅读 diff 产物，查看字段级 compare 失败

4. 若清空 Parquet 后日志为空：重跑 replay/e2e 并轮询摄取
```

---

## 等效 API

```http
GET /api/recorder/logs?trace_id=<id>&since=<ts>&until=<ts>
```

不支持的查询参数（`replay_id`、`plan_id`、`plan_item_id`、`include_recording_log`、……）会在读取 Parquet 之前就被拒绝。

验证规则和 JSON 结构见 [sp logs](/zh/testing/commands/logs)。

---

## 相关

- [概念 — 回放计划与各类 id](/zh/testing/agents/concepts#trace-replay-and-plan-ids)
- [诊断回放失败示例](/zh/testing/examples/agent-diagnose-replay)
- [sp replay case](/zh/testing/commands/replay-case)
- [sp trace](/zh/testing/commands/trace)
