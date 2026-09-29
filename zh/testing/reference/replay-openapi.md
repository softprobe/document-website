---
title: 回放触发 Open API
---

# 回放触发 Open API

本页列出自动回放和结果通知用到的接口、字段和错误码。在流水线中接入的方法见 [发版后自动回放](/zh/testing/webhook-and-ci)，通知的配置方法见 [回放结果通知](/zh/testing/notifications)。

::: warning 没有鉴权，仅限内网调用
这组接口没有鉴权，任何能访问后端的人都可以触发回放、修改通知渠道。请只允许内网访问，不要暴露到公网。仅私有化部署可用；All-in-One 部署需要在环境变量中设置 `SP_REPLAY_OPENAPI=true` 并重启，未开启时请求会返回 404、405 或一个网页。
:::

## 接口一览 {#endpoints}

以下路径均相对于后端地址，如 `http://sp-backend.internal:8090/openapi/v1/replay-triggers`。

| 方法 | 路径 | 用途 |
|---|---|---|
| `POST` | `/openapi/v1/replay-triggers` | [触发一次回放](#trigger) |
| `GET` | `/openapi/v1/replay-runs/{planId}` | [查询进度和结论](#run-status) |
| `GET` | `/openapi/v1/replay-runs/{planId}/diagnosis` | [读取已保存的结论和发版信息](#diagnosis) |
| `POST` | `/openapi/v1/replay-runs/{planId}/diagnosis` | 供 SoftProbe 分析服务写回分析结果，使用者无需调用 |
| `GET` | `/openapi/v1/notification-channels` | [列出通知渠道](#channels) |
| `POST` | `/openapi/v1/notification-channels` | [新建或修改通知渠道](#channels) |
| `DELETE` | `/openapi/v1/notification-channels/{id}` | [删除通知渠道](#channels) |
| `POST` | `/openapi/v1/notification-channels/{id}/test` | [向通知渠道发送样例消息](#channels) |

请求和响应均为 JSON。业务错误同样返回 HTTP 200，由 `errorCode` 和 `errorMessage` 说明原因，`errorCode` 为 `null` 表示成功。网络或网关出错时，按正常的 HTTP 状态码返回。

## 触发回放 {#trigger}

`POST /openapi/v1/replay-triggers`

接口立即返回，回放在后台执行。

| 字段 | 类型 | 必填 | 默认 | 说明 |
|---|---|---|---|---|
| `appId` | string | 是 | | 应用的 appId |
| `targetEnv` | string | 是 | | 被测服务地址，带 `http://` 或 `https://` |
| `operations` | string[] | 否 | 整个应用 | 只回放指定接口，填写接口路径（与录制列表中显示的一致），如 `/order/create`。不传或传 `[]` 表示回放整个应用 |
| `caseSource` | string | 否 | `rolling` | `rolling` 使用最近录制的流量，`pinned` 使用固化用例 |
| `caseSourceHours` | integer | 否 | 24 | 使用最近多少小时的录制，必须为正数。对 `pinned` 无效 |
| `caseCountLimit` | integer | 否 | 服务端配置 | 每个接口回放的用例数上限。服务端的其他配置可能覆盖此参数，实际条数以回放结果为准 |
| `caseTags` | object | 否 | | 按录制时的标签筛选用例，如 `{"env": "prod"}`。标签为 Agent 上报的原始值，例如 `-Dsp.tags.env=prod` 对应 `{"env": "prod"}` |
| `enableMock` | boolean | 否 | `true` | 为 `false` 时，下游调用不使用录制数据，而是真实调用 |
| `passThreshold` | number | 否 | | 通过率阈值，0 到 1 之间。只影响 [`verdict`](#verdict)，不影响 `findings.state` |
| `attributes` | object | 否 | | 本次发版的信息，原样保存，其中以下几个键会显示在通知中 |

`attributes` 的键沿用 [OpenTelemetry 语义约定](https://opentelemetry.io/docs/specs/semconv/)，通知中会用到以下几个：

| 键 | 卡片上显示为 |
|---|---|
| `service.name` | 通知标题中的应用名，不传时使用 appId |
| `deployment.environment.name` | 环境 |
| `cicd.pipeline.name`、`cicd.pipeline.run.id`、`cicd.pipeline.run.url.full` | 流水线，有链接时可点击 |
| `vcs.ref.head.name` | 分支 |
| `vcs.ref.head.revision` | 提交，显示前 7 位 |

`passThreshold` 和 `attributes` 只在触发时传入一次，之后无法修改。`attributes` 可以通过 [读取保存的结论](#diagnosis) 查到，`passThreshold` 不会在任何查询中返回。

请求示例：

```bash
curl -X POST http://sp-backend.internal:8090/openapi/v1/replay-triggers \
  -H 'Content-Type: application/json' \
  -d '{
    "appId": "order-service",
    "targetEnv": "http://order-service.test:8080",
    "operations": ["/order/create", "/order/pay"],
    "caseTags": {"env": "prod"},
    "attributes": {
      "deployment.environment.name": "test",
      "vcs.ref.head.name": "release/2026-10",
      "vcs.ref.head.revision": "9c3e1f2",
      "cicd.pipeline.run.id": "1643",
      "cicd.pipeline.run.url.full": "https://jenkins.example.com/job/order/1643/"
    }
  }'
```

成功时返回：

```json
{
  "planId": "6abb8559e5eb34767296c557",
  "statusUrl": "/openapi/v1/replay-runs/6abb8559e5eb34767296c557",
  "errorCode": null,
  "errorMessage": null
}
```

失败时返回：

```json
{
  "planId": null,
  "statusUrl": null,
  "errorCode": "UNKNOWN_OPERATION",
  "errorMessage": "these operations are not registered under appId=order-service: [/order/cancel] ..."
}
```

### 错误码 {#trigger-errors}

| `errorCode` | 原因 |
|---|---|
| `MISSING_APP_ID` | 未传入 `appId` |
| `MISSING_TARGET_ENV` | 未传入 `targetEnv` |
| `INVALID_CASE_SOURCE_HOURS` | `caseSourceHours` 不是正数 |
| `INVALID_CASE_SOURCE` | `caseSource` 不是 `rolling` 或 `pinned` |
| `APP_NOT_REGISTERED` | 传入了 `operations`，但该 appId 下没有任何接口：appId 有误，或该应用还没有录制到流量 |
| `UNKNOWN_OPERATION` | `operations` 中有未录制过的接口路径，`errorMessage` 中会列出具体是哪几个 |
| `EMPTY_OPERATIONS` | 传入了 `operations`，但其中全是空字符串。如需回放整个应用，不传该字段即可 |
| `REASON_<编号>` | 创建回放计划失败。常见编号：`1` 该应用正在创建另一个回放，请稍后重试；`101` 找不到该应用的接口；`200` 这段时间内没有录制到用例 |
| `PLAN_RUNNING_<编号>` | 创建回放计划被拒绝，原因见 `errorMessage` |
| `CREATE_PLAN_FAILED` | 创建回放计划失败，原因见 `errorMessage` |
| `INTERNAL_ERROR` | 服务端出错，请查看服务端日志 |

## 查询进度和结论 {#run-status}

`GET /openapi/v1/replay-runs/{planId}`

在页面上发起的回放也可以通过此接口查询结论，但不会推送通知。

| 字段 | 说明 |
|---|---|
| `status` | `PENDING`（尚未开始）、`RUNNING`（执行中）、`COMPLETED`（已结束）；planId 不存在时为 `UNKNOWN` |
| `progress` | 进度，0 到 1 |
| `verdict` | `PASS` 或 `FAIL`，根据通过率判断，见 [下文](#verdict) |
| `passRate` | 通过率，0 到 1 |
| `totalCases`、`successCases`、`failedCases` | 用例总数、通过数、未通过数 |
| `reportUrl` | 本次回放的报告页地址 |
| `findings` | 回放结论，流水线应根据其中的 `state` 判断，见 [下文](#findings-state) |
| `analysis` | AI 原因分析结果的汇总，见 [下文](#analysis) |
| `errorCode` | planId 不存在时为 `NOT_FOUND` |
| `errorMessage` | 错误说明；回放没有正常结束时，也可能包含原因 |

回放结束前，只有 `status` 和 `progress` 有值。回放结束后的响应示例（已删减部分字段）：

```json
{
  "status": "COMPLETED",
  "progress": 1.0,
  "verdict": "FAIL",
  "passRate": 0.82,
  "totalCases": 50,
  "successCases": 41,
  "failedCases": 9,
  "reportUrl": "http://softprobe.internal/sp/workbench/order-service/runs/6aba9d1fe5eb34767296c3f9",
  "errorCode": null,
  "errorMessage": null,
  "findings": {
    "state": "NEEDS_ACTION",
    "scope": {
      "interfacesInScope": 3,
      "interfacesReplayed": 3,
      "interfacesUnchanged": 2,
      "requests": 50,
      "requestsWithoutResult": 0
    },
    "needsActionInterfaces": 1,
    "needsAction": [
      {
        "kind": "FIELD_VALUE",
        "subjects": ["payable"],
        "interfaces": [
          {"operationName": "/order/price", "affectedRequests": 9, "totalRequests": 22}
        ],
        "affectedRequests": 9,
        "totalRequests": 22
      }
    ],
    "toReviewInterfaces": 0,
    "toReview": [],
    "coverage": {"uncoveredInterfaces": 0, "mainOperationsConfigured": false, "uncoveredMainOperations": []},
    "excludedFieldCount": 3
  },
  "analysis": {
    "state": "DONE",
    "analyzedCases": 9,
    "failedCases": 9,
    "codeChangeCases": 9,
    "undeterminedCases": 0,
    "invalidCases": 0,
    "codeChanges": [
      {
        "shortTitle": "会员价改为向下取整，应付少 1 元",
        "operations": ["/order/price"],
        "affectedCases": 9,
        "location": {"file": "src/main/java/demo/PricingService.java", "line": 12},
        "consecutive": 8
      }
    ]
  }
}
```

### `findings.state` {#findings-state}

按以下顺序依次判断，命中一条即停止：

| 顺序 | `state` | 含义 |
|---|---|---|
| 1 | `NO_CASES` | 没有可回放的请求 |
| 2 | `INTERRUPTED` | 回放被中断或取消，或有请求没有产生结果 |
| 3 | `ENVIRONMENT_FAILURE` | 超过一半的接口出现同一种失败（相同的状态码，或相同的连接失败），且出现该失败的接口至少有 3 个，通常是测试环境的问题 |
| 4 | `NEEDS_ACTION` | 存在需要处理的问题 |
| 5 | `REVIEW_ONLY` | 只有需要人工核对的差异 |
| 6 | `LOW_COVERAGE` | 未发现问题，但覆盖不足：已登记主链路接口时，有主链路接口未回放；未登记时，回放的接口少于 10 个或请求少于 30 条 |
| 7 | `CLEAN` | 已验证，未发现问题 |

回放结束前为 `RUNNING`。只有 `CLEAN` 可视为通过。

需要处理和需要核对的差异分别包括：

| 分组 | 差异 |
|---|---|
| 需要处理（`needsAction`） | 字段值、字段有无、字段类型、数组长度不一致；一条请求中大量字段不一致；没有响应内容；响应格式变化；下游调用减少；返回 5xx（504 除外）或 404；新增敏感字段 |
| 需要核对（`toReview`） | 新增字段；下游调用增加；PDF、HTML 等非结构化内容不一致；下游请求参数不一致；个别接口返回 401、403、429、504、超时或连接失败；无法归类的差异；有失败用例但没有差异明细的接口 |

每个接口只计入最严重的一组。AI 降噪建议忽略某项字段差异，且人工未撤销该建议时，这项差异会从「需要处理」降为「需要核对」，新增敏感字段除外。AI 降噪已自动忽略的差异按忽略规则处理，不计入这两组。

每次查询都会重新计算 `findings`。修改忽略规则或人工标记用例通过，都可能改变计算结果。

### `verdict` 和 `passRate` {#verdict}

`verdict` 只根据通过率判断：

- 回放没有正常结束、没有任何用例、或有用例没有产生结果时，一律为 `FAIL`。
- 触发时传入了 `passThreshold`：通过率不低于阈值时为 `PASS`。
- 未传入 `passThreshold`：没有任何失败时才为 `PASS`。

`verdict` 在回放结束时计算并保存，之后的查询直接读取。同一个 planId 重新执行后会重新计算。

通过率无法反映回放实际覆盖了什么，是否放行请以 `findings.state` 为准。

### `analysis` {#analysis}

`analysis` 汇总 AI 的原因分析结果，与报告页和通知中显示的内容一致。没有分析记录时，该字段可能不出现或为 `null`。它不影响 `verdict` 和 `findings.state`。

| 字段 | 说明 |
|---|---|
| `state` | `RUNNING` 分析中；`DONE` 已完成；`PARTIAL` 中途停止；`SKIPPED` 未开始 |
| `reason` | 状态为 `PARTIAL`、`SKIPPED` 时的原因，如 `QUOTA_EXHAUSTED`（今日自动分析次数已用完）、`NO_EXECUTOR`（分析服务未连接）、`MODEL_QUOTA`（AI 服务额度已用完）、`STALE`（分析中断） |
| `analyzedCases` | 已分析的用例数 |
| `failedCases` | 未通过的用例数 |
| `codeChangeCases`、`undeterminedCases`、`invalidCases` | 代码改动引起、原因未查明、无效三类的用例数，三者之和等于未通过的用例数 |
| `markedCases` | 其中已被人工标记通过的用例数。原始数字不会因标记而减少 |
| `codeChangeInterfaces`、`undeterminedInterfaces`、`invalidInterfaces` | 三类的接口数，每个接口只计入最严重的一类 |
| `codeChanges` | 每一处由代码改动引起的差异，字段见下表 |

`codeChanges` 中每一项的字段：

| 字段 | 说明 |
|---|---|
| `findingId` | 这处差异的编号 |
| `title`、`shortTitle` | 一句话说明，以及报告中显示的短标题（不超过 20 字）。由 AI 生成，默认为中文 |
| `operations` | 涉及的接口 |
| `affectedCases`、`replayedCases` | 受影响的用例数、这些接口回放的用例总数 |
| `markedCases`、`markedAt` | 其中人工标记通过的用例数、最近一次标记的时间（毫秒时间戳） |
| `sampleOperation` | 示例接口 |
| `location` | 代码位置：`file`、`line`、`symbol` |
| `inferred` | 为 `true` 时，表示 AI 根据返回数据推断差异原因，没有定位到代码。可能是未能读取代码仓库，也可能是读取后仍未能定位到具体代码 |
| `consecutive` | 连续出现的回放次数，`1` 表示首次出现 |

## 读取保存的结论 {#diagnosis}

`GET /openapi/v1/replay-runs/{planId}/diagnosis`

读取本次回放已保存的结论，包括 `verdict`、`passRate`、用例数、触发时传入的 `attributes`，以及写回的分析正文 `summary`。不返回 `passThreshold`。

| `errorCode` | 含义 |
|---|---|
| `null` | 有结论 |
| `NO_CONCLUSION_YET` | 已触发，回放尚未结束。此时已可读取 `attributes` |
| `NOT_FOUND` | 没有这次回放的结论，例如回放不是通过接口触发的 |

同一路径的 `POST` 供 SoftProbe 分析服务写回分析结果，调用它不会启动分析，使用者无需调用。如需在回放结束后自动分析，请在 [流程设置](/zh/testing/replay-report#flow-settings) 中开启「CI 触发的回放」。

## 通知渠道 {#channels}

### 列出渠道

`GET /openapi/v1/notification-channels`

返回渠道列表 `channels` 和后端支持的渠道类型 `supportedTypes`。出于安全考虑，不返回地址和密钥原文，只返回打码后的地址 `urlMasked` 和是否已配置密钥 `secretConfigured`。

### 新建或修改渠道

`POST /openapi/v1/notification-channels`

| 字段 | 说明 |
|---|---|
| `id` | 修改时传入，新建时不传 |
| `name` | 名称 |
| `type` | `feishu_bot`（飞书群机器人）、`dingtalk_bot`（钉钉群机器人）、`webhook` |
| `url` | 地址，只支持 http 和 https |
| `secret` | 群机器人的加签密钥；Webhook 类型时，原样放在请求头 `X-Webhook-Secret` 中 |
| `appIds` | 哪些应用的回放结果发送到该渠道，空数组表示全部应用 |
| `onlyOnFailure` | 为 `true` 时，只在结论不是 `CLEAN` 时发送 |
| `enabled` | 是否启用 |

修改时只更新传入的字段，未传入或传入 `null` 的字段保持不变。因此修改名称时，无需再次传入地址和密钥。

```bash
curl -X POST http://sp-backend.internal:8090/openapi/v1/notification-channels \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "研发群",
    "type": "feishu_bot",
    "url": "https://open.feishu.cn/open-apis/bot/v2/hook/<token>",
    "appIds": ["order-service"],
    "onlyOnFailure": true,
    "enabled": true
  }'
```

### 删除渠道和测试发送

- `DELETE /openapi/v1/notification-channels/{id}`：删除渠道。
- `POST /openapi/v1/notification-channels/{id}/test`：向该渠道发送一条包含全部内容的样例消息。失败时返回 `SEND_FAILED`，`errorMessage` 中最多包含对方的 HTTP 状态码，不包含对方返回的内容，详细原因请查看服务端日志。测试发送同样计入发送频率限制。

### 错误码

| `errorCode` | 原因 |
|---|---|
| `MISSING_TYPE` | 未传入 `type` |
| `UNKNOWN_TYPE` | `type` 不在 `supportedTypes` 中 |
| `MISSING_URL` | 未传入 `url` |
| `UNSUPPORTED_SCHEME` | 地址不是 http 或 https |
| `NOT_FOUND` | 渠道不存在 |
| `RATE_LIMITED` | 测试发送过于频繁，请稍后重试 |
| `SEND_FAILED` | 测试发送失败 |

## 通知事件 {#events}

Webhook 类型的渠道会收到 [CloudEvents 1.0](https://cloudevents.io/) 格式的 POST 请求。

| 字段 | 说明 |
|---|---|
| `specversion` | `1.0` |
| `id` | 事件编号 |
| `source` | `/softprobe/replay` |
| `type` | `ai.softprobe.replay.run.completed`（结论已产生）或 `ai.softprobe.replay.run.diagnosed`（AI 分析结果已写回） |
| `subject` | planId |
| `time` | 发送时间（UTC） |
| `datacontenttype` | `application/json` |
| `data` | 见下表 |

`data` 中的字段：

| 字段 | 说明 |
|---|---|
| `appId`、`planId` | 应用和回放计划 |
| `verdict`、`passRate`、`totalCases`、`successCases`、`failedCases` | 同 [查询接口](#run-status) |
| `reason` | `verdict` 为 `FAIL` 时的原因 |
| `summary` | AI 写回的分析正文，没有时不出现 |
| `reportUrl` | 报告页地址 |
| `attributes` | 触发时传入的发版信息 |
| `findings` | 回放结论，同 [查询接口](#findings-state) |
| `analysis` | AI 分析汇总，同 [查询接口](#analysis) |

`verdict` 为 `FAIL` 时，还会附带几项差异统计（`clusterCount`、`topClusters` 等），仅发送给 Webhook。无法获取的字段不会出现。

请求头为 `Content-Type: application/json; charset=utf-8`，渠道配置了密钥时还包含 `X-Webhook-Secret`。接收方返回 2xx 即视为送达。
