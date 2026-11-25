---
title: Softprobe UI 测试
---

# Softprobe UI 测试

自动化运行浏览器、iOS 与 Android UI 测试，同时验证后端向外部服务发出的真实请求。Softprobe UI 测试支持从录制的会话或自然语言提示生成 `@playwright/test`、预缓存 `e2e`、`@softprobe/e2e/mobile` 与 Maestro 测试套件，在 CI 中以零次大模型调用稳定回放，并断言邀请邮件、支付扣款与 Webhook 等真实后端出站 HTTP 请求。

传统 UI 测试只检查客户端界面状态，只要界面弹出成功提示就会判定通过，即使后端静默漏发了邮件或下游请求也无法察觉。Softprobe UI 测试会为 Web 与移动端请求自动透传 W3C `traceparent` 与 `baggage` 请求头，并通过 `trace.outboundHttp` 在 [Softprobe Explorer](https://explorer.softprobe.ai) 中校验后端发出的下游 `CLIENT` HTTP 调用。

## 两种测试创建方式

1. **[从录制的会话生成测试](/zh/ui-testing/from-sessions)。** 使用 [`@softprobe/web-record`](/zh/blackbox/reference/softprobe-js#softprobe-web-record) 操作 Web 应用，或使用 [`@softprobe/react-native`](/zh/blackbox/reference/softprobe-js#softprobe-react-native)、`ai.softprobe:softprobe-otel-android`、`SoftprobeOtelSwift` 操作移动应用，随后在 Explorer 一键导出、在编码 Agent 中调用 `compile_session_test`，或在终端运行 `softprobe-compile-session` 生成 `@playwright/test`、`@softprobe/e2e`、`@softprobe/e2e/mobile` 或 Maestro 套件。
2. **[直接用自然语言编写测试](/zh/ui-testing/natural-language)。** 无需提前录制会话，直接使用 [`@softprobe/e2e`](/zh/blackbox/reference/softprobe-js#softprobe-e2e) 编写浏览器测试，或使用 [`@softprobe/e2e/mobile`](/zh/ui-testing/mobile) 驱动未改动的 iOS 与 Android 安装包。在本地运行一次生成 `.e2e/cache/` 缓存并提交到 Git，即可在 CI 中无需模型密钥、零次模型调用地确定性回放。

## 从这里开始

- **[教程：构建第一个自动生成 UI 与后端联调测试](/zh/ui-testing/tutorial)。** 一键启动预埋点的 `docker.io/softprobe/demo-ota:classic-blackbox` 机票预订容器，录制一次浏览器订票会话，生成并运行 Playwright 与零 LLM `e2e` 测试，并验证 `trace.outboundHttp` 拦截后端漏发确认邮件的隐蔽缺陷。
- **[从录制的会话生成测试](/zh/ui-testing/from-sessions)。** 开启语义动作采集，通过 Explorer、MCP 或 CLI 导出测试，注入 `SP_SECRET_<SLOT>` 敏感变量并在 CI 中运行。
- **[用自然语言编写 UI 测试](/zh/ui-testing/natural-language)。** 无需预先录制浏览器会话，从零编写自然语言驱动的 `e2e` 测试与后端出站断言。
- **[测试 iOS 与 Android 应用](/zh/ui-testing/mobile)。** 通过 `softprobeMobile` 代理模式直接测试未改动的 `.apk` 与 `.app` 包，或接入 React Native、Android 与 Swift OpenTelemetry 扩展并在会话模式下运行。
- **[SDK 与 CLI 参考](/zh/blackbox/reference/softprobe-js#softprobe-e2e)。** 查阅 `@softprobe/e2e`、`@softprobe/e2e/playwright`、`@softprobe/e2e/mobile`、`@softprobe/react-native`、`@softprobe/web-record` 与 `softprobe-compile-session` 的完整参数表。

## Softprobe 产品分工

| 产品 | 适用场景 |
|------|----------|
| **UI 测试** | 需要跨 Web、iOS 与 Android 可重复运行的 `@playwright/test`、零 LLM `e2e` 或 Maestro 测试，并同时校验客户端状态与后端出站 HTTP 调用。 |
| **[Blackbox](/zh/blackbox/)** | 需要跨浏览器、后端与 AI Agent 捕获带完整消息体的全链路会话，并在 Explorer 或编码 Agent 中排查问题。 |
| **[Lisa](/zh/lisa/)** | 需要独立运行的 AI QA 工程师按已批准策略评估 Agent 会话并发送 Slack 告警。 |
| **[Arex](/zh/arex/)** | 需要为后端服务录制真实入站流量并自动 Mock 数据库与上游依赖，执行接口回归对比。 |
