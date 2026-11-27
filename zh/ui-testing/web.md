---
title: 如何测试 Web 应用
---

# 如何测试 Web 应用

刚开始做 UI 测试？[为旅行网站编写第一个测试](/zh/ui-testing/classic-web-first-test)。这个教程只检查页面，无需后端跟踪。

你可以从录制的浏览器会话生成 Playwright 测试，也可以用自然语言编写 `agent.act` 测试。你可以只检查页面，也可以使用 Softprobe 增加后端请求检查。

<video controls playsinline muted preload="metadata" style="width: 100%; max-width: 820px; border-radius: 8px; margin: 16px 0;" src="/videos/web-ui-testing.mp4"></video>

## 选择 Web 测试路径 {#choose-workflow}

| 目标 | 是否需要前端 SDK？ | 编写工具 | 参考文档 |
|---|---|---|---|
| 录制真实操作并自动生成 Playwright 测试 | 需要（`@softprobe/web-record`） | Blackbox MCP + 编码 Agent | [从录制的会话生成测试](/zh/ui-testing/from-sessions) |
| 对未改动的前端应用编写自然语言 `agent.act` 测试 | 不需要（`softprobeWeb`） | `e2e` + `.e2e/cache/` | [用自然语言编写测试](/zh/ui-testing/natural-language) |
| 为已有 Playwright 套件增加 `trace.outboundHttp` 断言 | 不需要（`@softprobe/e2e/playwright`） | `@playwright/test` | [Playwright Fixture 配置](#playwright-fixture) |

关于两种采集模式的完整对比与代码示例，请参阅 [前端埋点与无埋点模式对比](/zh/ui-testing/frontend-instrumentation)。

## 方案 A：使用 `@softprobe/e2e/playwright` {#playwright-fixture}

若你已有 Playwright 套件或刚从录制会话生成了测试，在 `playwright.config.ts` 中配置 `use.softprobe`：

```ts
import { defineConfig } from "@playwright/test";
import type { SoftprobePlaywrightFixtures } from "@softprobe/e2e/playwright";

export default defineConfig<SoftprobePlaywrightFixtures>({
  testDir: "./tests",
  use: {
    baseURL: process.env.APP_URL ?? "http://127.0.0.1:3000",
    softprobe: {
      sink: {
        kind: "blackbox",
        endpoint:
          process.env.SOFTPROBE_SINK_ENDPOINT ??
          "https://explorer.softprobe.ai/api/thelake",
        token: process.env.SOFTPROBE_TOKEN,
        workspaceId: process.env.SOFTPROBE_WORKSPACE_ID,
      },
    },
  },
});
```

在测试文件中从 `@softprobe/e2e/playwright` 导入 `{ expect, test }`，即可使用 `trace.outboundHttp` 与 `trace.expectNoOutboundHttp` 校验后端外呼。

## 方案 B：使用 `softprobeWeb` 编写自然语言测试 {#e2e-web}

在 `e2e.config.ts` 中配置 `softprobeWeb`，对未修改的 Web 应用运行 `agent.act(...)`，本地生成 `.e2e/cache/` 后在 CI 中以 `CI=true` 零 LLM 成本回放。完整配置请参阅 [如何用 `e2e` 编写自然语言 UI 测试](/zh/ui-testing/natural-language)。

## 跨域 API 与 CORS 配置 {#cors}

当 Web 前端请求不同源的后端 API 时（例如 `http://localhost:5173` 请求 `http://localhost:8080`），`@softprobe/web-record`、`softprobeWeb` 与 `@softprobe/e2e/playwright` 会附带 W3C `traceparent` 与 `baggage` 请求头。请在后端 CORS 响应头中放行：

```text
Access-Control-Allow-Headers: Content-Type, Authorization, traceparent, baggage
```

## 相关文档 {#related}

- [教程：构建第一个自动生成 UI 与后端联调测试](/zh/ui-testing/tutorial)
- [前端埋点与无埋点模式对比](/zh/ui-testing/frontend-instrumentation)
- [从录制的会话生成 UI 测试](/zh/ui-testing/from-sessions)
- [用自然语言编写 UI 测试](/zh/ui-testing/natural-language)
