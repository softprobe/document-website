# 回放发送日志标记

> 本页翻译可能滞后于英文版，如有出入以[英文版](/en/testing/reference/replay-send-log-markers)为准。

**agent 何时使用：** 解读每次回放 HTTP 分发前后 sp-backend 的 schedule 日志——这是回放调度与你的应用之间关键的进入和退出边界。

这些结构化日志行由 **sp-schedule**（`DefaultHttpReplaySender`）在每次入口 HTTP 调用之前和之后立即输出。当 `sp.source` 为 **`backend`** 且 `service_name` 通常为 **`sp-backend`** 时，它们会出现在关联日志查询（`sp recorder logs`、统一 trace 日志下载）的结果中。

用 case 的 **`traceId`** 查询日志（当关联成功时，该值与消息中的 `recordedTraceId` 相同）。参见 [recorder 命令](../commands/recorder.md)。

---

## 消息前缀

| 前缀 | 级别 | 含义 |
|--------|----------|------|
| `Replay send start:` | INFO | schedule 即将发起已录制的入口 HTTP 请求 |
| `Replay send done:` | INFO | HTTP 交互完成；已记录响应状态和耗时 |
| `Replay send failed:` | WARN | HTTP 交互在正常完成之前失败 |

每个前缀后面跟着以逗号分隔的 **`key=value`** 对（SLF4J 结构化消息，而非 JSON）。

---

## 结构化字段

| 字段 | 出现于 | 说明 |
|-------|-----|------|
| `planId` | start、done、failed | 该批次运行的回放**计划** id |
| `targetEnv` | start、done、failed | 当发往配置的回放测试 URL（`--env` / `targetEnv`）时为 `true`；录制侧发送时为 `false` |
| `method` | start、done、failed | HTTP 方法（`GET`、`POST`、……） |
| `url` | start、done、failed | schedule 调用的完整 URL（包含路径和查询字符串） |
| `recordedTraceId` | start、done、failed | 来自**录制**的 W3C trace id；关联成功时应与日志行上的 `trace_id` 匹配 |
| `spanId` | start、done、failed | 发送路径上处于活动状态的 OpenTelemetry span id |
| `httpStatus` | done、failed | 响应的 HTTP 状态码，或在未收到响应（连接错误、超时、DNS 失败）时为 **`-1`** |
| `durationMs` | done、failed | HTTP 交互的墙钟毫秒数 |
| `error` | 仅 failed | 发送未成功完成时的异常或错误消息 |

---

## 示例日志行

```text
Replay send start: planId=6a3f2aad59f0c4655b0f99da, targetEnv=true, method=POST, url=http://order-service.test:8080/api/orders, recordedTraceId=2057ad46a7ce03d3955385f2a4142d29, spanId=8d10c94a2a6f4e11

Replay send done: planId=6a3f2aad59f0c4655b0f99da, targetEnv=true, method=POST, url=http://order-service.test:8080/api/orders, recordedTraceId=2057ad46a7ce03d3955385f2a4142d29, spanId=8d10c94a2a6f4e11, httpStatus=200, durationMs=142

Replay send failed: planId=6a3f2aad59f0c4655b0f99da, targetEnv=true, method=POST, url=http://order-service.test:8080/api/orders, recordedTraceId=2057ad46a7ce03d3955385f2a4142d29, spanId=8d10c94a2a6f4e11, httpStatus=-1, durationMs=30001, error=Connection refused
```

---

## 如何使用

1. 从 `sp replay case list --plan <planId> --failed --json` 或回放元数据获取 **`traceId`**。
2. 拉取失败点附近时间窗口的关联日志（参见[诊断回放失败示例](../examples/agent-diagnose-replay.md)）。
3. 过滤 **`sp.source=backend`** 且 **`body`** 中包含 `Replay send start`、`Replay send done` 或 `Replay send failed` 的行。

| 观察到的现象 | 可能原因 |
|-------------|--------------|
| 窗口内没有 `Replay send start` | case 可能尚未到达 HTTP 发送阶段（预加载、调度或计划被取消）——先检查计划状态 |
| 有 `start` 但没有匹配的 `done` 或 `failed` | 发送可能仍在进行中，或日志被截断——加宽时间窗口 |
| `failed` 且 `httpStatus=-1` | 到达 **`targetEnv`** 时出现网络问题或超时——核查 `--env` URL、DNS、防火墙，以及应用是否在运行 |
| `failed` 且为 4xx/5xx | 应用返回了错误的 HTTP 状态码——检查 `start` 时间戳之后的 agent 和应用日志 |
| `done` 且为 2xx 但 compare 仍然失败 | 入口请求已到达应用；检查 `done` 日志行之后的 agent mock/compare 行为 |

---

## 相关的 ERROR 日志行（同一次发送尝试）

以下**不是**进入/退出标记，但常常出现在同一次失败的发送中：

| 消息前缀 | 级别 | 含义 |
|----------------|----------|------|
| `Replay send error:` | ERROR | 发送失败后的堆栈跟踪（紧随 `Replay send failed`） |
| `Replay send result invalid:` | ERROR | 收到了响应，但缺少用于提取结果所需的 trace/replay 头 |

---

## 相关

- [② 回放与对比](/zh/testing/replay-and-diff)
- [诊断回放失败示例](../examples/agent-diagnose-replay.md)
- [Recorder 命令](../commands/recorder.md)
