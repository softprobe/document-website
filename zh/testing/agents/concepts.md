---
title: 概念与编号
---

# 概念与编号

用脚本操作 SoftProbe 时会碰到的几类对象，以及把录制、回放、差异和日志串起来的各种编号。录制回放的整体原理见 [工作原理](/zh/testing/how-it-works)。

## 应用（`appId`） {#application-appid}

一个被测服务就是一个应用。录制、回放、策略和提取规则都归属于某个 `appId`。

| 字段 | 说明 |
|------|------|
| `appName` | 用 `sp app create <appName>` 注册时起的名字 |
| `appId` | 应用 ID。Java Agent 和命令行都用它 |

`sp app create` 会生成一个 16 位十六进制的 `appId`，但并不要求一定是这种格式：Agent 也可以用任何固定、非空的名字，比如 `order-service`。后端没见过的 `appId`，会在 Agent 第一次拉取配置时自动注册，应用名与 ID 相同。同一个服务的所有实例必须用同一个 `appId`；录制和回放时 `appId` 不一致，就找不到原来的用例。

**Agent 状态** 根据 Agent 的心跳得出：

| 状态 | 含义 |
|------|------|
| `online` | 至少有一个实例在阈值内（默认 60 秒）发过心跳 |
| `degraded` | 在线，但至少有一个心跳正常的实例处于限流或降级状态 |
| `offline` | 以前有过心跳，但阈值内没有 |
| `never` | 从来没有实例上报过 |

用 `sp app status <appId>` 或 `sp app list --json` 查看。命令说明见 [sp app](/zh/testing/commands/app)。

## Java Agent {#java-agent}

用 `-javaagent:/path/to/sp-agent.jar` 挂到被测服务上。

- **录制**时，记录真实请求，以及请求过程中对数据库、缓存和其他服务的调用。
- **回放**时，按 Mock 策略用录制下来的结果代替这些真实调用。
- 定期发送心跳，`sp app status` 靠它判断应用是否在线。

接入方法见 [接入 Java Agent](/zh/testing/java-agent)。

## 回放目标地址（`targetEnv`） {#replay-target-url-targetenv}

回放不认 `staging`、`prod` 这类环境名。`targetEnv` 是接收回放请求的那个**正在运行的服务的根地址**，比如 `http://order-service:8080` 或 `https://order-service.internal:8443`。

- `sp replay run --env <地址>` 会把它作为 `targetEnv` 传给后端。
- 必须带协议和主机名（端口不是默认端口时也要带）。没有主机名时，创建回放计划会报错 *requested target env unable load active instance*。
- 它和 `SP_API_URL` 无关，后者指向 sp-backend。

命令说明见 [sp replay](/zh/testing/commands/replay)。

## 策略 {#policies}

三类声明式 YAML 策略：

| 类型 | 控制什么 | 命令 |
|------|---------|------|
| `RecordingPolicy` | Agent 录什么：采样速率、录哪些接口、录制时段、序列化时跳过的内容 | `sp policy recording` |
| `MockPolicy` | 回放时 Mock 哪些调用，以及 Mock 匹配的宽松程度 | `sp policy mock` |
| `CompareRulePolicy` | 怎么对比响应：忽略哪些字段、数组怎么对齐、怎么解码 | `sp policy compare` |

一个应用可以匹配多条策略，按 `metadata.priority` 合并。内置的默认策略优先级为 `0`。字段说明见 [策略 YAML 参考](/zh/testing/policy-yaml-guide)。

## 回放计划 {#replay-plan}

一次回放就是一个回放计划，用 `planId` 标识。可以用 `sp replay run` 创建，也可以在控制台、定时任务或 [Open API](/zh/testing/reference/replay-openapi) 中发起；用 `sp replay status` 查看进度。回放计划回放的是已经录下的用例，所以挂上 Agent 后从没收到过流量的应用，没有东西可回放。用例只能通过录制产生，不能手工编写。

## 编号 {#ids}

<a id="trace-replay-and-plan-ids"></a>

| 编号 | 标识什么 | 用在哪里 |
|------|---------|---------|
| `traceId` | 一次请求的调用链（W3C trace ID）。回放时沿用录制时的 `traceId` | **查日志**（[sp logs](/zh/testing/commands/logs)），查链路和录制数据 |
| `replayId` | 某个用例的一次回放 | 看差异、诊断；查日志时可用来只看这一次回放 |
| `planId` | 一个回放计划 | 用例列表、报告、诊断 |
| `planItemId` | 回放计划中的一个接口 | 用例列表 |
| `diffId` | 一条对比结果 | `sp replay diff get` |

### 编号出现在哪里 {#where-ids-appear}

| 命令 | 字段 |
|------|------|
| `sp replay run --json` | `planId` |
| `sp replay case list --plan <planId> --failed --json` | 每个用例的 `replayId`、`traceId`、`diffId` 和计划中的接口 ID |
| `sp replay metadata <replayId> --json` | `traceId` 和对应的录制 |
| `sp record case list --app <appId> --since -24h --json` | 每个录制入口请求的 `traceId` |
| `sp trace find --app <appId> --attr-name <规则名> --attr-value <值> --json` | 按订单号等业务编号查到的 `traceId` |
| `sp diagnose replay <planId> --json` | 失败用例及其编号 |

### 查日志用哪个 `traceId` {#which-traceid}

回放失败时，用**失败回放用例**上的 `traceId`。这个用例的录制和回放共用它，一次就能查到两边的日志。不要从最新的录制记录或健康检查请求（`/`、`/index.html`）里随便拿一个 trace，那些是不相干的请求。

用户只给了订单号、保单号这类业务编号、没有 trace ID 时，先用业务编号查出 trace，见 [从业务编号开始排查](/zh/testing/examples/agent-diagnose-replay#business-id)。

`replayId`、`planId`、`planItemId` 不能单独用来查日志；在 HTTP 接口里，它们是在 `trace_id` 之外追加的过滤条件（见 [sp logs — HTTP 接口](/zh/testing/commands/logs#http-api)）。

## 相关文档 {#related}

- [选择接入方式](./overview)
- [命令参考](/zh/testing/commands/)
