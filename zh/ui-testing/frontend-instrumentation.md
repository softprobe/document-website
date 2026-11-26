---
title: 前端埋点与无埋点模式对比
---

# 前端埋点与无埋点模式对比

Softprobe UI Testing 在 Web 与移动端均支持两种采集模式：

- **无前端埋点（代理或浏览器拦截模式）。** `@softprobe/e2e` 在浏览器网络层或移动端代理层注入 W3C `traceparent` 与 `baggage` 请求头，无需修改任何应用代码。
- **有前端埋点（SDK 模式）。** 在应用中接入 [`@softprobe/web-record`](/zh/blackbox/reference/softprobe-js#softprobe-web-record)、[`@softprobe/react-native`](/zh/blackbox/reference/softprobe-js#softprobe-react-native)、`ai.softprobe:softprobe-otel-android` 或 `SoftprobeOtelSwift`，由客户端直接上报语义化 UI 动作 Span（`softprobe.ui.action`）、截图与原生链路上下文。

这两种模式均可搭配两种测试编写方式：[从录制的会话生成测试](/zh/ui-testing/from-sessions) 或 [用自然语言 `agent.act` 编写测试](/zh/ui-testing/natural-language)。

## 能力对比 {#comparison}

| 能力维度 | 无前端埋点 | 有前端埋点 |
|---|---|---|
| 应用代码改动 | **无需改动**（直接测试未修改构建包） | 在应用入口初始化一次 SDK |
| 后端 `trace.outboundHttp` 与 `trace.expectNoOutboundHttp` 断言 | 支持（测试运行期间） | 支持（测试与真实用户会话均可） |
| `agent.act` 零 LLM `.e2e/cache/` CI 回放 | 支持 | 支持 |
| 测试失败时输出 `explorerTraceUrl` | 支持 | 支持 |
| Explorer 中展示 `softprobe.ui.action` 语义动作 Span | 不支持 | **支持** |
| 通过 Blackbox MCP 从录制会话自动生成测试 | 不支持（改用 `agent.act` 编写） | **支持**（`get_session_semantic_actions` + `get_trace`） |
| Explorer 中展示操作截图与路由页面名称 | 不支持 | **支持** |
| 源码级 `SP_SECRET_<SLOT>` 密码与卡号脱敏 | 仅支持运行时 `secrets.get()` | **支持**（SDK 与生成测试自动映射） |
| 移动端免 MITM 代理与 CA 证书注入 `traceparent` | 不支持（需 `softprobeMobile` HTTP 代理） | **支持**（进程内 OkHttp / `URLProtocol` / `fetch`） |

## 前端埋点带来的核心收益 {#benefits}

1. **从真实用户会话直接生成确定性测试。** 接入 Softprobe 前端 SDK 后，每次点击、输入与页面跳转都会记录为 `softprobe.ui.action` OpenTelemetry Span。编码 Agent 可通过 [Blackbox MCP](/zh/blackbox/coding-agent-skills) 调用 `get_session_semantic_actions` 与 `get_trace`，无需手动查找选择器即可生成 `@playwright/test`、`@softprobe/e2e/mobile` 或 Maestro 测试。
2. **在 Explorer 中完整串联端到端因果链。** Softprobe Explorer 将后端 `CLIENT` HTTP 调用与触发它的前端操作、CSS/无障碍选择器、页面名称及 `ui_action` 截图关联展示。
3. **在客户端源头完成敏感字段脱敏。** 开启 `inputCapture: "secrets-only"` 并配置 `secretSlots` 后，密码、银行卡与验证码在离开设备前即被替换为 `{ kind: "secret", slot }`，生成的测试自动从 `SP_SECRET_<SLOT>` 读取。
4. **消除移动端代理与证书配置摩擦。** 原生 Android（`SoftprobeHttpInterceptor`）、原生 iOS（`SoftprobeURLProtocol`）与 React Native（`@softprobe/react-native`）在应用进程内直接透传 `traceparent`，可在预发与生产包中直接追踪，无需本地 MITM 代理。

## 可运行示例 {#examples}

### 1. Web 无前端埋点（`agent.act` + `trace.outboundHttp`）{#example-web-uninstrumented}

无需修改前端代码，使用 `softprobeWeb` 即可拦截浏览器请求、注入 `traceparent` 与 `baggage` 并断言后端出站请求：

```ts
// e2e.config.ts
import { openai } from "@ai-sdk/openai";
import type { E2EConfig } from "e2e";
import {
  softprobeCachedAgent,
  softprobeReporter,
  softprobeWeb,
} from "@softprobe/e2e";

const isCi = Boolean(process.env.CI);

export default {
  projectId: "web-uninstrumented-demo",
  tests: "tests/**/*.e2e.ts",
  cache: { dir: ".e2e/cache", mode: isCi ? "read-only" : "read-write" },
  agents: {
    default: softprobeCachedAgent({
      model: isCi ? undefined : openai("gpt-5.4-mini"),
    }),
  },
  targets: [
    {
      name: "web",
      engine: softprobeWeb({
        sink: {
          kind: "blackbox",
          endpoint: "https://explorer.softprobe.ai/api/thelake",
          token: process.env.SOFTPROBE_TOKEN,
          workspaceId: process.env.SOFTPROBE_WORKSPACE_ID,
        },
      }),
      app: { url: "http://127.0.0.1:3000", identity: "my-web" },
    },
  ],
  reporters: ["list", softprobeReporter()],
} satisfies E2EConfig;
```

```ts
// tests/invite.e2e.ts
import { expect, test } from "@softprobe/e2e";

test("无前端 SDK 邀请成员", async ({ agent, app, screen, trace }) => {
  await app.open("/");
  await agent.act('Fill "ada@example.com" into Email and click Send invite');
  await expect(screen.getByRole("status")).toContainText("Invitation sent");

  const emailCall = await trace.outboundHttp({
    triggeredBy: { method: "POST", path: "/api/invites" },
    method: "POST",
    url: /\/v1\/email\/send$/,
    status: 200,
  });
  expect(emailCall.status).toBe(200);
});
```

### 2. Web 接入 `@softprobe/web-record`（会话采集 + 生成 Playwright 测试）{#example-web-instrumented}

在前端入口初始化 `@softprobe/web-record` 后，用户操作会自动产生 `softprobe.ui.action` Span 与 `traceparent` 请求头：

```ts
// src/main.tsx
import { RecordSdk } from "@softprobe/web-record";

RecordSdk.init({
  ingestionKey: import.meta.env.VITE_INGESTION_KEY,
  serviceName: "my-web",
  captureSemanticActions: true,
  inputCapture: "secrets-only",
  secretSlots: {
    'input[name="apiKey"]': "API_KEY",
  },
});
```

在浏览器操作一次后，通过 Blackbox MCP 提示编码 Agent 生成测试：

```text
使用 Blackbox get_session_semantic_actions 读取会话 ses_01J...，
结合 get_trace 检查后端链路并生成 @playwright/test + @softprobe/e2e 测试。
```

生成的确定性 Playwright 测试在 CI 中零 LLM 调用即可运行：

```ts
// tests/invite.spec.ts
import { expect, test } from "@softprobe/e2e/playwright";

test("从录制会话生成的测试", async ({ page, trace }) => {
  await page.goto("/");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByRole("button", { name: "Send invite" }).click();
  await expect(page.getByRole("status")).toContainText("Invitation sent");

  await trace.outboundHttp({
    triggeredBy: { method: "POST", path: "/api/invites" },
    method: "POST",
    url: /\/v1\/email\/send$/,
    status: 200,
  });
});
```

### 3. 移动端无前端埋点（`softprobeMobile` 代理模式）{#example-mobile-uninstrumented}

直接测试未修改的 `.apk` 或 `.app` 安装包。`softprobeMobile` 默认启动本地 HTTP 代理（`mode: "proxy"`），配置模拟器代理并注入 `traceparent` 与 `baggage`：

```ts
// e2e.config.ts
import { openai } from "@ai-sdk/openai";
import type { E2EConfig } from "e2e";
import { softprobeCachedAgent, softprobeReporter } from "@softprobe/e2e";
import { softprobeMobile } from "@softprobe/e2e/mobile";

const isCi = Boolean(process.env.CI);

export default {
  projectId: "mobile-proxy-demo",
  tests: "tests/**/*.e2e.ts",
  cache: { dir: ".e2e/cache", mode: isCi ? "read-only" : "read-write" },
  agents: {
    default: softprobeCachedAgent({
      model: isCi ? undefined : openai("gpt-5.4-mini"),
    }),
  },
  targets: [
    {
      name: "android",
      engine: softprobeMobile({
        platform: "android",
        sink: {
          kind: "blackbox",
          endpoint: "https://explorer.softprobe.ai/api/thelake",
          token: process.env.SOFTPROBE_TOKEN,
          workspaceId: process.env.SOFTPROBE_WORKSPACE_ID,
        },
      }),
      app: { appId: "ai.softprobe.demo", identity: "demo-android" },
    },
  ],
  reporters: ["list", softprobeReporter()],
} satisfies E2EConfig;
```

### 4. 移动端接入 OpenTelemetry SDK（React Native、Android、iOS）{#example-mobile-instrumented}

接入各平台 SDK 后即可采集 `softprobe.ui.action`、截图与进程内 `traceparent`，并以 `mode: "session"` 运行或通过 Blackbox MCP 生成测试：

- **React Native：** 调用 `initSoftprobeReactNative({ ingestionKey: process.env.INGESTION_KEY, serviceName: "my-rn-app", captureSemanticActions: true })`，自动插桩 `fetch`、`XMLHttpRequest`、React Navigation 与触摸/输入控件。
- **原生 Android：** 接入 `ai.softprobe:softprobe-otel-android`，为 `OkHttpClient` 添加 `SoftprobeHttpInterceptor` 并调用 `SoftprobeUiAction.install(application)`。
- **原生 iOS：** 接入 `SoftprobeOtelSwift`，在 `URLSessionConfiguration` 注册 `SoftprobeURLProtocol` 并调用 `SoftprobeUIAction.install()`。

完整安装代码与会话模式配置请参阅 [测试 iOS、Android 与 React Native 应用](/zh/ui-testing/mobile)。

## 相关文档 {#related}

- [Softprobe UI Testing 概览](/zh/ui-testing/)
- [从录制的会话生成 UI 测试](/zh/ui-testing/from-sessions)
- [用自然语言编写 UI 测试](/zh/ui-testing/natural-language)
- [测试 Web 应用](/zh/ui-testing/web)
- [测试 iOS、Android 与 React Native 应用](/zh/ui-testing/mobile)
