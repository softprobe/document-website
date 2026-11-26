---
title: Softprobe UI Testing
---

# Softprobe UI Testing

自动化执行 Web、iOS、Android 与 React Native UI 测试，同时验证前端界面状态与后端发往外部服务的真实 HTTP 请求。Softprobe UI Testing 基于 [`e2e`](https://www.npmjs.com/package/e2e) 与 `@playwright/test`，自动透传 W3C `traceparent` 与 `baggage` 请求头，通过 `trace.outboundHttp` 断言后端 `CLIENT` HTTP Span，并支持通过 Blackbox MCP 从录制会话直接生成确定性测试套件。

## 1. 为什么选择 Softprobe UI Testing，而不是直接使用 `e2e` 或 Playwright {#why-softprobe}

直接使用 `e2e`（`e2e-inc`）或 Playwright 时，测试止步于客户端屏幕。如果页面弹出 `"Invitation queued"`，但后端静默丢弃了邮件、Webhook 或支付请求，纯 UI 测试依然会通过。

`@softprobe/e2e` 封装并扩展了 `e2e` 与 `@playwright/test`，在保留 `agent.act`、`.e2e/cache/` 零 LLM 回放与 `screen` 断言的同时，补全了全链路后端验证：

| 能力对比 | 直接使用 `e2e` 或 Playwright | Softprobe UI Testing（`@softprobe/e2e`） |
|---|---|---|
| 自然语言 `agent.act` 与 `.e2e/cache/` 零 LLM 回放 | 支持（`e2e`） | 支持（`softprobeCachedAgent` 封装 `e2e`） |
| 断言后端邮件、Webhook 与第三方 HTTP 调用 | 不支持 | **支持**（`trace.outboundHttp` / `trace.expectNoOutboundHttp`） |
| 失败时关联后端完整 HTTP 与 LLM 请求体 | 仅客户端截图 | **支持**（`softprobeReporter` 输出 `explorerTraceUrl`） |
| 从真实录制会话自动生成确定性测试 | 不支持（需手写 Prompt） | **支持**（Blackbox MCP + 前端埋点） |
| 统一管理测试与缓存中的敏感字段脱敏 | 需自行实现 | **支持**（`SP_SECRET_<SLOT>` + `secrets-only` 采集） |

## 2. 两种编写方式与前端埋点选择 {#ways-to-test}

Softprobe 将**测试编写方式**与**是否接入前端埋点**拆分为两个正交维度：

| 编写方式 | 无前端埋点（零改动 / 代理模式） | 有前端埋点（SDK 模式） |
|---|---|---|
| **[从录制的会话生成测试](/zh/ui-testing/from-sessions)** | 不适用（需前端 SDK 采集会话） | 使用 `@softprobe/web-record`、`@softprobe/react-native`、Android 或 Swift SDK 录制用户操作，编码 Agent 通过 Blackbox MCP 生成 Playwright、`@softprobe/e2e/mobile` 或 Maestro 测试。 |
| **[用自然语言编写（`agent.act`）](/zh/ui-testing/natural-language)** | 使用 `softprobeWeb` 或 `softprobeMobile` 代理直接测试未修改构建包。本地执行一次生成 `.e2e/cache/`，CI 中零 LLM 调用回放。 | 同样支持 `agent.act` + `.e2e/cache/` 回放，同时额外获得 `softprobe.ui.action` Span、截图与免代理原生 `traceparent`。 |

完整对比、前端埋点收益与四个可运行代码示例请参阅 **[前端埋点与无埋点模式对比](/zh/ui-testing/frontend-instrumentation)**。

## 3. 支持的平台 {#platforms}

- **[Web（`/zh/ui-testing/web`）](/zh/ui-testing/web)。** `@softprobe/e2e/playwright` 确定性 Playwright 测试、`softprobeWeb` 自然语言测试与 `@softprobe/web-record` 会话录制。
- **[iOS、Android 与 React Native（`/zh/ui-testing/mobile`）](/zh/ui-testing/mobile)。** 面向未修改 `.app`/`.apk` 包的 `softprobeMobile` 零代码代理模式，以及 React Native / Expo（`@softprobe/react-native`）、原生 Android（`ai.softprobe:softprobe-otel-android`）与原生 iOS（`SoftprobeOtelSwift`）OpenTelemetry SDK。

## 快速开始 {#start-here}

- **[教程：构建第一个自动生成 UI 与后端联调测试](/zh/ui-testing/tutorial)。** 一键启动预埋点的 `docker.io/softprobe/demo-ota:classic-blackbox` 容器，录制一次订票会话，让编码 Agent 通过 Blackbox MCP 生成测试并拦截后端漏发确认邮件的缺陷。
- **[前端埋点与无埋点模式对比](/zh/ui-testing/frontend-instrumentation)。** 详细对比无代码代理模式与前端 SDK 模式，附带 Web 与移动端真实例子。
- **[从录制的会话生成测试](/zh/ui-testing/from-sessions)。** 开启语义动作采集，通过 Blackbox MCP 调用 `get_session_semantic_actions` 与 `get_trace` 生成测试。
- **[用自然语言编写 UI 测试](/zh/ui-testing/natural-language)。** 从零编写 `agent.act` 测试，缓存至 `.e2e/cache/` 并在 CI 中零 LLM 回放。
- **[Web 测试指南](/zh/ui-testing/web) · [移动端测试指南](/zh/ui-testing/mobile)。** 平台配置、跨域 CORS、模拟器运行与演示视频。

## Softprobe 各产品定位 {#products}

| 产品 | 适用场景 |
|---------|----------|
| **UI Testing** | 在 Web、iOS、Android 与 React Native 上运行可重复的 `@playwright/test`、零 LLM `e2e` 或 Maestro 测试，同时校验界面与后端外呼。 |
| **[Blackbox](/zh/blackbox/)** | 跨浏览器、移动端、后端与 AI Agent 的全载荷会话链路追踪，支持 Explorer 与编码 Agent 排查。 |
| **[Lisa](/zh/lisa/)** | 由 AI QA 工程师依据团队策略自动评审 Agent 会话并在 Slack 告警。 |
| **[Arex](/zh/arex/)** | 通过录制真实入站流量并在回放时自动 Mock 数据库与上游依赖，进行后端服务回归测试。 |
