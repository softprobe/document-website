> 本页翻译可能滞后于英文版，如有出入以[英文版](/en/testing/commands/log-query-fields)为准。

# 日志查询字段

**代理何时使用本页：** 用于解读 [`sp logs`](./logs) 或 `GET /api/recorder/logs` 返回的行——包括字段名称、含义，以及关联 id 何时可能缺失。

本参考仅描述 **CLI 与 API 的查询输出**。它不涉及 Parquet 文件路径、分区布局，也不说明如何直接查询存储。所有查询请使用 [`sp logs`](./logs) 或规范的 HTTP API。

**查询键：** v1 **只接受 `trace_id`**。可选的关联标签在数据被采集时可能出现在行中——它们不是过滤键。

**命名：** API 与 Parquet 的行使用**无前缀**的列名（`source`、`replay_id`……）。在传输链路上，OTLP 在 Vector 将它们映射进存储之前可能使用 `sp.source`、`sp.replay_id` 等带前缀的名称。

---

## 行出现在哪里

每次成功查询都会在 `data.rows`（CLI `--json`）或 API 的 `rows` 数组中返回一条**按时间顺序排列的行流**。行按事件 `timestamp` 升序排列。

CLI 的人类可读输出打印的逻辑字段与 API JSON 相同。

关于 `--trace-id` 查询键、排障流程和必需的时间范围，请参见 [sp logs](./logs)。

---

## 字段参考

每一行都包含下面的核心字段。关联字段**仅在发出方运行时于打日志时知晓其值**时才包含——在缺乏上下文的行上它们可能不存在（参见[缺失的关联字段](#缺失的关联字段)）。

| Field | Always present | Description |
|-------|----------------|-------------|
| `timestamp` | yes | 日志行的事件时间。JSON 中为 ISO-8601 UTC（例如 `2026-06-27T10:00:10.123Z`）。用于按时间顺序排序以及调用方的 `[since, until)` 过滤。 |
| `severity` | yes | 发出方 logger 归一化后的严重级别文本（例如 `DEBUG`、`INFO`、`WARN`、`ERROR`）。每个组件通过**其自身原生的日志配置**控制发出哪些级别——Softprobe 不施加产品级的严重级别过滤。 |
| `body` | yes | 完整的日志消息文本。v1 返回完整的 `body`；查询结果不会截断消息内容。 |
| `service_name` | yes | 该行的运行时服务标识（例如 `travel-ota`、`sp-backend`）。标识产生该行的是哪个进程。 |
| `source` | yes | 产生该行的 v1 流水线来源。固定取值：`agent`、`app` 或 `backend`（参见 [source 取值](#source-取值)）。 |
| `trace_id` | when known | 打出该行时处于活动状态的请求或工作单元的 W3C OpenTelemetry trace id。**v1 唯一的查询键。** |
| `span_id` | when known | 打出该行时活动 span 的 OpenTelemetry span id。 |
| `replay_id` | when known | 打日志时回放上下文处于活动状态的那一次回放**尝试**的 id。可选标签——不是查询键。 |
| `plan_id` | when known | 打日志时计划上下文处于活动状态的回放**计划** id。可选标签——不是查询键。 |
| `plan_item_id` | when known | 回放计划内的某个 case 或操作。可选标签——不是查询键。 |

**不在 v1 查询结果中：** `session_id` / `sp.session_id`。

---

## `source` 取值

| Value | Meaning | Typical `service_name` examples |
|-------|---------|--------------------------------|
| `agent` | Java agent 自诊断（插桩、导出、agent 内部日志） | 插桩下的应用服务名 |
| `app` | 由 agent 捕获的被测应用日志（Logback、Log4j2、JUL） | `travel-ota`、客户应用 id |
| `backend` | 通过 OpenTelemetry 导出的 sp-backend 诊断日志 | `sp-backend` |

当你在同一次 trace 查询中只想要应用行、agent 诊断行或 backend 行时，可按 `source` 过滤或扫描。

```bash
jq '[.rows[].source] | group_by(.) | map({source: .[0], n: length})' /tmp/sp-logs.json
jq -r '.rows[] | select(.source=="backend") | .body' /tmp/sp-logs.json | head -20
```

---

## 缺失的关联字段

当运行时在打日志时**确实没有请求或回放上下文**时，关联字段（`trace_id`、`span_id`、`replay_id`、`plan_id`、`plan_item_id`）会被**省略或为空**。这是预期行为——并非查询缺陷。

常见情形：

| Situation | Typical absent fields | Why |
|-----------|----------------------|-----|
| 进程**启动**或**关闭** | 部分或全部关联字段 | 尚无活动的 HTTP/RPC 请求或回放派发，或上下文已被清除 |
| **后台 / 内务处理**行 | `trace_id`、`span_id`、replay/plan id | 录制/回放流量之外的线程或定时器工作 |
| **agent 或 backend 空闲**诊断 | `replay_id`、`plan_id`、`plan_item_id` | 仅带 trace 上下文的诊断行，或没有入站 W3C 上下文 |
| 行上**未设置计划上下文** | `plan_id`、`plan_item_id` | 即便在回放期间，该行也是在计划项派发之外打出的 |

诊断失败的回放时，请按回放 case 或 pytest 关联块中的 **`trace_id`** 查询。当你需要限定在回放范围内的行时，在本地输出中按可选的 `replay_id` 过滤。

**限定 case 的诊断：** 当 case 行包含 **`recordTime`**（API 中为 `requestDateTime`）和 **`replayTime`** 时，请使用两个各 ±2 分钟的窗口（每个锚点一个），而不是从录制到回放的单一跨度。回放窗口通常包含相关行；录制窗口往往为空。参见 [sp logs — 限定 case 的查询](./logs#case-scoped-lookup-dual-windows)。

---

## 各组件的日志归属

| `source` | 谁控制 `severity` 以及发出什么 |
|----------|-----------------------------------------------|
| `agent` | Agent / JVM 日志配置（`sp.log.path`、`sp.log.console`、`sp.enable.debug` 等） |
| `app` | 应用的 Logback、Log4j2 或 JUL 设置 |
| `backend` | sp-backend 日志与 OpenTelemetry 日志导出配置 |

Softprobe 附加关联 id 并转发各 logger 已经发出的行。它不会更改应用的日志级别，也不会在产品层面过滤严重级别。

---

## 示例行（JSON）

来自 [`sp logs --json`](./logs) 或 `GET /api/recorder/logs`：

```json
{
  "timestamp": "2026-06-27T10:00:10.123Z",
  "severity": "WARN",
  "body": "Replay comparison mismatch",
  "service_name": "sp-backend",
  "source": "backend",
  "trace_id": "2057ad46a7ce03d3955385f2a4142d29",
  "span_id": "8d10c94a2a6f4e11",
  "replay_id": "6891fd300c676b31",
  "plan_id": "6a3f2aad59f0c4655b0f99da",
  "plan_item_id": "6a3f2aad59f0c4655b0f99da:1"
}
```

同一服务的一条启动行可能完全省略关联字段：

```json
{
  "timestamp": "2026-06-27T09:59:55.000Z",
  "severity": "INFO",
  "body": "Started SpBootApplication in 4.2 seconds",
  "service_name": "sp-backend",
  "source": "backend"
}
```

---

## 范围之外（v1）

本参考仅涵盖统一流水线的**查询输出**。除非另行说明，以下内容不属于 v1：

- 录制 trace 表、指标表、回放读迁移、历史回填
- 非回放路径的服务日志（dashboard、auth 及其他 Helm/workspace 服务）
- 直接访问 Parquet 文件、对象存储凭证或独立查询工具

---

## 相关内容

- [sp logs](./logs) — 命令参考、flag、排障与 API 映射
- [日志关联 ID — 查找与使用 id](/zh/testing/reference/log-correlation-ids)
- [诊断回放失败示例](/zh/testing/examples/agent-diagnose-replay)
