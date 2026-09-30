---
title: 回放结果通知
---

# 回放结果通知

流水线触发的回放结束后，Softprobe 可以把回放结论推送到飞书群、钉钉群，或你自己的系统。

::: warning 仅推送通过接口触发的回放
只有通过 [发版后自动回放](/zh/testing/webhook-and-ci) 中的接口（`POST /openapi/v1/replay-triggers`）发起的回放才会推送通知。在页面上手动发起的回放、定时回放，以及通过 `GET /api/createPlan` 或 `sp` 命令发起的回放，都不会推送。
:::

## 添加通知渠道 {#add}

1. 打开设置页的「通知」，在「通知渠道」中点击「新增渠道」。
2. 填写以下字段并保存。
3. 在该渠道所在行点击「测试发送」，发送一条样例消息，然后到群里确认是否收到。

![新增通知渠道](/img/docs/testing/zh/notify-channel-form.png)

| 字段 | 说明 |
|---|---|
| 名称 | 便于识别的名称，如「研发群」 |
| 类型 | 飞书群机器人、钉钉群机器人、Webhook |
| 地址 | 群机器人的 Webhook 地址，或你自己系统的接收地址，仅支持 http 和 https |
| 加签密钥 | 群机器人开启了签名校验时必填。Webhook 类型的用法见 [下文](#webhook) |
| 生效应用 | 哪些应用的回放结果发送到该渠道，不选表示全部应用 |
| 只在失败时发 | 开启后，只在结论不是 `CLEAN`（已验证且未发现问题）时发送 |
| 启用 | 关闭后暂停发送，配置保留 |

已添加的渠道显示在列表中，可以看到每个渠道的生效应用和发送条件：

![通知渠道列表](/img/docs/testing/zh/notify-channels.png)

注意事项：

- **飞书群请选择「飞书群机器人」，不要选择 Webhook。** Webhook 类型发送的是原始 JSON，飞书无法识别。
- **渠道按后端分别保存。** 有多个环境时，页面上会注明当前环境，每个环境需要分别配置。
- **地址和密钥不会完整显示。** 群机器人的地址本身就包含凭据，页面上只显示打码后的内容。编辑时，地址和密钥留空表示不修改；修改类型后，需要重新填写地址。
- **测试发送有频率限制。** 连续点击时会提示「稍候再试」。

## 发送时机 {#when}

- 回放结束后，先等待 AI 降噪完成、结论确定，再发送。
- CI 触发、且在 [流程设置](/zh/testing/replay-report#flow-settings) 中开启了自动分析的回放：结论为 `NEEDS_ACTION` 或 `REVIEW_ONLY` 时，会等分析出结果再发送，最多等 20 分钟，超时照常发送，并在通知中说明分析进度；其他结论不等分析。
- 每次回放，飞书、钉钉只收到一条通知。之后在报告中重新比对、撤销忽略等操作不会再发通知；同一个回放计划重新执行时，按新一轮回放重新发送。
- 「只在失败时发」按回放结论判断是否发送，不按通过率判断。即使通过率为 100%，只要回放的接口太少、覆盖不足，仍会发送通知。
- 钉钉机器人每分钟最多接收 20 条消息，超出部分会被丢弃。
- 通知发送失败不影响回放和结论。失败信息只记录在服务端日志中，页面上没有发送记录。收不到通知时，先用「测试发送」检查渠道配置。

## 通知内容 {#card}

飞书和钉钉收到的内容相同，形式不同：飞书为卡片，带表格和按钮；钉钉为 Markdown 消息，表格内容逐行列出，按钮显示为链接。通知依次包含：

| 部分 | 内容 |
|---|---|
| 标题 | 即回放结论。AI 分析完成时说明差异原因，如「order-service 发版回放：1 处差异由代码改动引起」；没有分析结果时说明待处理、待核对的接口数，如「order-service 发版回放：2 个接口待处理，1 个接口待核对」 |
| 发版信息 | 环境、流水线（可点击）、分支、提交，来自触发回放时传入的 `attributes`，未传入的项不显示 |
| 回放统计 | 回放的接口数和请求数、结果一致的接口数、未回放到的接口数 |
| AI 分析 | 结论为待处理或待核对时显示：由代码改动引起的差异，并注明是首次出现还是已连续出现几次；分析未完成时显示进度 |
| 待处理、待核对的问题 | 每类问题一行，包括涉及的接口数、受影响的请求数和一个示例接口 |
| 说明 | 录制时段、回放时间（北京时间），以及按忽略规则排除的字段 |
| 报告入口 | 有待处理问题时显示「查看待处理问题」，只有待核对内容时显示「查看待核对内容」，另有「查看回放结果」，均打开本次回放的 [回放报告](/zh/testing/replay-report) |

飞书卡片的颜色与结论对应：有待处理问题为红色，只需核对为橙色，已验证且未发现问题为绿色；没有可回放的请求、回放未完成、环境异常导致无法验证，或覆盖不足时为灰色。AI 分析完成且没有发现代码改动引起的差异时，红色会改为橙色，但 `findings.state` 不变。

通知中不包含字段的具体取值和报错原文，只包含字段名和状态码，避免业务数据被发到群里。AI 生成的问题描述除外，会原样显示。

## 接收 Webhook 事件 {#webhook}

类型选择「Webhook」时，Softprobe 会向填写的地址发送 POST 请求，请求体为 [CloudEvents 1.0](https://cloudevents.io/) 格式的 JSON。

- 事件有两种：`ai.softprobe.replay.run.completed` 表示结论已产生；`ai.softprobe.replay.run.diagnosed` 表示 AI 分析结果已写回。后者只发送给 Webhook，群机器人不会收到。
- 填写了「加签密钥」时，密钥会原样放在请求头 `X-Webhook-Secret` 中，由接收方自行比对，不做签名。

以下是一次「测试发送」收到的请求（已删减部分字段）：

```http
POST /softprobe HTTP/1.1
Content-Type: application/json; charset=utf-8
X-Webhook-Secret: demo-shared-secret
```

```json
{
  "specversion": "1.0",
  "id": "c207be62-c923-496b-8bd9-37c84ed4c8fa",
  "source": "/softprobe/replay",
  "type": "ai.softprobe.replay.run.completed",
  "subject": "test-plan",
  "time": "2026-09-29T09:36:36.640195Z",
  "datacontenttype": "application/json",
  "data": {
    "appId": "sample-app",
    "planId": "test-plan",
    "verdict": "FAIL",
    "passRate": 0.9,
    "totalCases": 180,
    "successCases": 162,
    "failedCases": 18,
    "attributes": {
      "deployment.environment.name": "staging",
      "vcs.ref.head.name": "feature/sample",
      "cicd.pipeline.run.id": "1024"
    },
    "findings": {
      "state": "NEEDS_ACTION",
      "needsActionInterfaces": 3
    }
  }
}
```

`data` 中的 `verdict`、`findings`、`analysis` 等字段，含义与 [查询接口](/zh/testing/reference/replay-openapi#run-status) 返回的相同；无法获取的字段不会出现。完整字段见 [通知事件](/zh/testing/reference/replay-openapi#events)。

流水线是否继续，应以查询接口返回的 `findings.state` 为准。通知可能因网络故障或发送频率限制而丢失。

## 相关文档

- [发版后自动回放](/zh/testing/webhook-and-ci)：由流水线触发回放。
- [回放触发 Open API](/zh/testing/reference/replay-openapi#channels)：通过接口管理通知渠道。
