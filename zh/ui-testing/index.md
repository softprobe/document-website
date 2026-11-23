---
title: Softprobe UI 测试
---

# Softprobe UI 测试

自动化运行浏览器测试，同时验证后端向外部服务发出的真实请求。Softprobe UI 测试支持从录制的浏览器会话或自然语言提示生成 `@playwright/test` 与预缓存 `e2e` 测试套件，在 CI 中以零次大模型调用稳定回放，并断言邀请邮件、支付扣款与 Webhook 等真实后端出站 HTTP 请求。

传统 UI 测试只检查浏览器 DOM，只要页面弹出成功提示就会判定通过，即使后端静默漏发了邮件或下游请求也无法察觉。Softprobe UI 测试会为每次浏览器请求自动附加 W3C `traceparent` 请求头，并通过 `trace.outboundHttp` 在 [Softprobe Explorer](https://explorer.softprobe.ai) 中校验后端发出的下游 `CLIENT` HTTP 调用。

## 两种测试创建方式

1. **[从录制的会话生成测试](/zh/ui-testing/from-sessions)。** 使用 [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record) 在浏览器中走通一次业务流程，随后在 Explorer 页面一键导出、在编码 Agent 中调用 `compile_session_test`，或在终端运行 `softprobe-compile-session` 生成 `@playwright/test` 或预置缓存的 `e2e` 套件。
2. **[直接用自然语言编写测试](/zh/ui-testing/natural-language)。** 无需提前录制会话，直接使用 `e2e` 与 [`@softprobe/e2e`](/en/blackbox/reference/softprobe-js#softprobe-e2e) 编写 `await agent.act(...)` 步骤。在本地运行一次生成 `.e2e/cache/` 缓存并提交到 Git，即可在 CI 中无需模型密钥、零次模型调用地确定性回放。

## 从这里开始

- **[教程：构建第一个自动生成 UI 与后端联调测试](/zh/ui-testing/tutorial)。** 搭建一个单文件 Node.js 团队邀请示例应用，录制自动脱敏密码的浏览器会话，生成并运行 Playwright 与零 LLM `e2e` 测试，并亲眼验证 `trace.outboundHttp` 拦截后端漏发邮件的隐蔽缺陷。
- **[从录制的会话生成测试](/zh/ui-testing/from-sessions)。** 开启语义动作采集，通过 Explorer、MCP 或 CLI 导出测试，注入 `SP_SECRET_<SLOT>` 敏感变量并在 CI 中运行。
- **[用自然语言编写 UI 测试](/zh/ui-testing/natural-language)。** 无需预先录制浏览器会话，从零编写自然语言驱动的 `e2e` 测试与后端出站断言。
- **[SDK 与 CLI 参考](/en/blackbox/reference/softprobe-js#softprobe-e2e)。** 查阅 `@softprobe/e2e`、`@softprobe/e2e/playwright`、`@softprobe/web-record` 与 `softprobe-compile-session` 的完整参数表。

## Softprobe 产品分工

| 产品 | 适用场景 |
|------|----------|
| **UI 测试** | 需要可重复运行的 `@playwright/test` 或零 LLM `e2e` 浏览器测试，并同时校验前端状态与后端出站 HTTP 调用。 |
| **[Blackbox](/zh/blackbox/)** | 需要跨浏览器、后端与 AI Agent 捕获带完整消息体的全链路会话，并在 Explorer 或编码 Agent 中排查问题。 |
| **[Lisa](/zh/lisa/)** | 需要独立运行的 AI QA 工程师按已批准策略评估 Agent 会话并发送 Slack 告警。 |
| **[Arex](/zh/arex/)** | 需要为后端服务录制真实入站流量并自动 Mock 数据库与上游依赖，执行接口回归对比。 |
