---
title: 回放发送日志标记
---

# 回放发送日志标记

后端回放一个用例时，在把录制下来的入口请求发给你的服务之前打一行日志，拿到结果后再打一行。看这两行，就知道失败的用例到底有没有打到你的应用。

这些标记只在后端直接通过 HTTP 发送请求时出现。应用开着 [`sp tunnel`](/zh/testing/commands/tunnel) 时，请求走隧道，后端打的是 `[TUNNEL] …` 日志，没有这些标记。

按用例的 `traceId` 查日志时（见 [sp logs](/zh/testing/commands/logs)），它们是 `source` 为 `backend` 的行，`service_name` 一般是 `sp-backend`。关联正常时，日志内容里的 `recordedTraceId` 与这行的 `trace_id` 相同。

## 日志开头 {#message-prefixes}

| 开头 | 级别 | 含义 |
|------|------|------|
| `Replay send start:` | INFO | 马上要发送录制的入口请求 |
| `Replay send done:` | INFO | 收到了响应，带状态码和耗时 |
| `Replay send failed:` | WARN | 没有拿到成功的响应：连接失败、超时，或服务返回了 4xx/5xx |
| `Replay send slow:` | WARN | 请求耗时超过 10 秒（在 `done` 之后打出） |

开头后面是用逗号分隔的 `键=值`（普通文本，不是 JSON）。

## 字段 {#structured-fields}

| 字段 | 出现在 | 说明 |
|------|--------|------|
| `planId` | start、done、failed、slow | 回放计划 ID |
| `targetEnv` | start、done、failed | 请求发往回放目标地址（`--env` / `targetEnv`）时为 `true` |
| `method` | 全部 | HTTP 方法（`GET`、`POST` 等） |
| `url` | 全部 | 实际调用的完整地址，含查询参数 |
| `recordedTraceId` | start、done、failed | 录制时的 trace ID |
| `spanId` | start、done、failed | 发送时所在的 span ID |
| `httpStatus` | done、failed | `done` 时为响应状态码；`failed` 时一律为 `-1` |
| `durationMs` | done、failed、slow | 请求耗时，单位毫秒 |
| `error` | failed | 错误信息。服务返回 4xx/5xx 时，状态码写在这里（如 `500 Internal Server Error`） |

## 示例 {#example-lines}

```text
Replay send start: planId=6a3f2aad59f0c4655b0f99da, targetEnv=true, method=POST, url=http://order-service.test:8080/api/orders, recordedTraceId=2057ad46a7ce03d3955385f2a4142d29, spanId=8d10c94a2a6f4e11

Replay send done: planId=6a3f2aad59f0c4655b0f99da, targetEnv=true, method=POST, url=http://order-service.test:8080/api/orders, recordedTraceId=2057ad46a7ce03d3955385f2a4142d29, spanId=8d10c94a2a6f4e11, httpStatus=200, durationMs=142

Replay send failed: planId=6a3f2aad59f0c4655b0f99da, targetEnv=true, method=POST, url=http://order-service.test:8080/api/orders, recordedTraceId=2057ad46a7ce03d3955385f2a4142d29, spanId=8d10c94a2a6f4e11, httpStatus=-1, durationMs=30001, error=Connection refused
```

## 怎么用 {#how-to-use-them}

1. 从 `sp replay case list --plan <planId> --failed --json` 取失败用例的 `traceId`。
2. 查它的日志（见 [排查回放失败 — 查看日志](/zh/testing/examples/agent-diagnose-replay#logs)）。
3. 留下 `source=backend`、`body` 以 `Replay send` 开头的行。

| 看到的情况 | 可能的原因 |
|-----------|-----------|
| 没有 `Replay send start` | 请求走了 `sp tunnel`（看有没有 `[TUNNEL]` 日志），或者用例还没走到发送这一步：看回放计划的状态（可能被停止了，或在准备阶段就失败了） |
| 有 `start`，没有 `done` 或 `failed` | 请求可能还在进行，或时间窗太窄，放宽时间窗再查 |
| `failed`，`error` 是连接失败或超时 | 后端连不上目标服务。检查 `--env` 地址、域名解析、防火墙，以及服务是否在运行 |
| `failed`，`error` 以 4xx/5xx 状态码开头 | 服务返回了错误。看 `start` 之后 Agent 和应用的日志 |
| `done` 且状态码为 2xx，但用例仍然失败 | 请求已经打到服务，问题在响应内容或 Mock 上，去看差异 |

## 同一次发送的其他错误日志 {#related-error-lines-same-send-attempt}

同一个请求出问题时，经常还能看到下面几行：

| 开头 | 级别 | 含义 |
|------|------|------|
| `Replay send error:` | ERROR | 发送失败时的异常堆栈（跟在 `Replay send failed` 之后） |
| `Replay send result invalid:` | ERROR | 收到了响应，但缺少读取回放结果所需的响应头 |

## 相关文档 {#related}

- [回放与对比](/zh/testing/replay-and-diff)
- [排查回放失败](/zh/testing/examples/agent-diagnose-replay)
- [sp logs](/zh/testing/commands/logs)
