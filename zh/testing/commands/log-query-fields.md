---
title: 日志查询字段
---

# 日志查询字段

[`sp logs`](./logs) 和 `GET /api/recorder/logs` 返回的每行日志有哪些字段，以及有些字段为什么会缺。

**查询条件：** `trace_id` 必填。通过 HTTP 接口查询时，还可以加 `replay_id`、`plan_id`、`plan_item_id`、`mode`（`record` 或 `replay`）和 `source` 过滤，见 [sp logs — HTTP 接口](./logs#http-api)。

**字段名：** 返回结果里的字段名不带前缀（`source`、`replay_id` 等）。日志在上报途中（OTLP）可能写成 `sp.source`、`sp.replay_id`，存储时会去掉前缀。

## 日志行怎么排列 {#where-rows-appear}

每次查询返回一组按时间排好的日志行，`sp logs --json` 放在 `data.rows` 里，接口放在 `rows` 里，按 `timestamp` 从早到晚排列。不带 `--json` 时，`sp logs` 输出的也是这些字段。

查询参数和结果解读见 [sp logs](./logs)。

## 字段说明 {#field-reference}

下面的基础字段每行都有。关联字段只在打日志的那一刻程序知道对应上下文时才有，否则会缺（见 [关联字段为什么会缺](#absent-correlation-fields)）。

| 字段 | 是否一定有 | 说明 |
|------|-----------|------|
| `timestamp` | 有 | 日志的发生时间，JSON 中为 ISO-8601 UTC，如 `2026-06-27T10:00:10.123Z`。用于排序和按 `[since, until)` 过滤 |
| `severity` | 有 | 日志级别，如 `DEBUG`、`INFO`、`WARN`、`ERROR`。每个组件打哪些级别由它自己的日志配置决定，SoftProbe 不统一过滤 |
| `body` | 有 | 完整的日志内容，不截断 |
| `service_name` | 有 | 打这行日志的服务，如 `travel-ota`、`sp-backend` |
| `source` | 有 | 日志来自哪个组件：`agent`、`app` 或 `backend`（见 [source 的取值](#source-values)） |
| `trace_id` | 已知时有 | 打日志时正在处理的请求的 W3C trace ID，也是查询条件 |
| `span_id` | 已知时有 | 打日志时所在 span 的 ID |
| `replay_id` | 已知时有 | 打日志时所属那一次回放的 ID。也可作为查询过滤条件（`&replay_id=`） |
| `plan_id` | 已知时有 | 打日志时所属回放计划的 ID。也可作为查询过滤条件（`&plan_id=`） |
| `plan_item_id` | 已知时有 | 回放计划中某个接口的 ID。也可作为查询过滤条件（`&plan_item_id=`） |
| `mode` | 已知时有 | Agent 标注的阶段：`record`（录制）或 `replay`（回放）。旧版 Agent 写的日志没有这个字段，请看 `effective_mode`。也可作为查询过滤条件（`&mode=record` / `&mode=replay`） |
| `effective_mode` | 有（由后端算出） | 后端给每行算出的阶段：有 `mode` 就用 `mode`；没有时看 `replay_id`，没有 `replay_id` 算 `record`，有则算 `replay`。**判断阶段以它为准**，不要自己去看 `replay_id`。这个字段只出现在返回结果里，不存储 |

结果里不包含 `session_id` / `sp.session_id`。

## source 的取值 {#source-values}

| 取值 | 含义 | 常见的 `service_name` |
|------|------|----------------------|
| `agent` | Java Agent 自身的诊断日志（织入、上报、Agent 内部日志） | 挂 Agent 的应用的服务名 |
| `app` | Agent 采集的被测应用日志（Logback、Log4j2、JUL） | `travel-ota`、客户的应用 ID |
| `backend` | sp-backend 通过 OpenTelemetry 上报的诊断日志 | `sp-backend` |

同一次查询里只想看应用日志、Agent 日志或后端日志时，按 `source` 过滤：

```bash
jq '[.rows[].source] | group_by(.) | map({source: .[0], n: length})' /tmp/sp-logs.json
jq -r '.rows[] | select(.source=="backend") | .body' /tmp/sp-logs.json | head -20
```

## 关联字段为什么会缺 {#absent-correlation-fields}

打日志时如果程序确实不在处理任何请求或回放，关联字段（`trace_id`、`span_id`、`replay_id`、`plan_id`、`plan_item_id`）就会缺失或为空。这是正常情况，不是查询出了问题。

常见情形：

| 情形 | 通常缺哪些字段 | 原因 |
|------|---------------|------|
| 进程**启动**或**停止**时 | 部分或全部关联字段 | 还没有请求或回放在处理，或上下文已经清掉 |
| **后台任务、定时任务** | `trace_id`、`span_id`、回放和计划相关 ID | 这些工作不属于录制或回放的请求 |
| **Agent 或后端空闲时**的诊断日志 | `replay_id`、`plan_id`、`plan_item_id` | 只有 trace 上下文，或请求没有带 W3C 上下文 |
| 日志不在**回放计划的执行过程中**打出 | `plan_id`、`plan_item_id` | 即使在回放期间，这行日志也不属于某个计划中的接口 |

排查回放失败时，用失败回放用例的 `trace_id` 查询。只想看某一次回放的日志，在接口查询中加上 `&replay_id=`（再加 `&mode=replay`）。

同一个用例的录制和回放往往相隔很久。通过 HTTP 接口查询时不传 `since`/`until`，后端会分别扫描录制前后和每次回放前后的时间；不要传一个从录制时间一直跨到回放时间的时间窗。见 [sp logs — HTTP 接口](./logs#http-api)。

## 各组件的日志由谁控制 {#per-component-logging-ownership}

| `source` | 日志级别和内容由谁控制 |
|----------|----------------------|
| `agent` | Agent / JVM 的日志配置（`sp.log.path`、`sp.log.console`、`sp.enable.debug` 等） |
| `app` | 应用自己的 Logback、Log4j2 或 JUL 配置 |
| `backend` | sp-backend 的日志配置和 OpenTelemetry 日志上报配置 |

SoftProbe 只给各组件已经打出的日志加上关联 ID 并转发，不改应用的日志级别，也不统一过滤级别。

## 示例（JSON） {#example-row-json}

[`sp logs --json`](./logs) 或 `GET /api/recorder/logs` 返回的一行：

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
  "plan_item_id": "6a3f2aad59f0c4655b0f99da:1",
  "mode": "replay",
  "effective_mode": "replay"
}
```

同一服务启动时打的一行可能完全没有关联字段：

```json
{
  "timestamp": "2026-06-27T09:59:55.000Z",
  "severity": "INFO",
  "body": "Started SpBootApplication in 4.2 seconds",
  "service_name": "sp-backend",
  "source": "backend",
  "effective_mode": "record"
}
```

注意这个例子：这类不属于任何请求的平台日志，既没有 `mode` 也没有 `replay_id`，`effective_mode` 会算成 `record`，但它并不是录制流量。只有带请求或回放上下文的日志，`effective_mode` 才可信；看平台诊断日志时要结合 `source` 判断。

## 相关文档 {#related}

- [sp logs](./logs)
- [概念与编号](/zh/testing/agents/concepts#ids)
- [排查回放失败](/zh/testing/examples/agent-diagnose-replay)
