---
title: JavaScript 与 TypeScript SDK (softprobe-js)
---

# JavaScript 与 TypeScript SDK (`softprobe-js`)

`@softprobe/*` npm 包（版本 `0.2.8`）的 API 参考。各包需要 Node.js 20 及以上环境，其中 `@softprobe/e2e` 需要 Node.js 22.13 及以上环境。

| 包名 | 用途 | 源码目录 |
|------|------|----------|
| `@softprobe/tracing` | 核心 OpenTelemetry Tracer、Observation、Generation、OpenAI 包装器与评分上报 | [`softprobe-js/packages/tracing`](https://github.com/softprobe/softprobe-js/tree/main/packages/tracing) |
| `@softprobe/web-record` | 浏览器 rrweb DOM 录制、实时语义 UI 动作 span、同源 HTTP 链路透传与 JSON 消息体采集 | [`softprobe-js/packages/web-record`](https://github.com/softprobe/softprobe-js/tree/main/packages/web-record) |
| `@softprobe/react-native` | 面向 React Native 与 Expo 的 OpenTelemetry JS 扩展，提供语义动作采集与 W3C 会话透传 | [`softprobe-js/packages/react-native`](https://github.com/softprobe/softprobe-js/tree/main/packages/react-native) |
| `@softprobe/vercel-ai-sdk` | Vercel AI SDK 遥测接入与 HTTP 上下文透传 | [`softprobe-js/packages/vercel-ai-sdk`](https://github.com/softprobe/softprobe-js/tree/main/packages/vercel-ai-sdk) |
| `@softprobe/langchain` | LangChain 与 LangGraph 自动插桩及 `CallbackHandler` | [`softprobe-js/packages/langchain`](https://github.com/softprobe/softprobe-js/tree/main/packages/langchain) |
| `@softprobe/opencode-plugin` | OpenCode 编码 Agent 插件 | [`softprobe-js/packages/opencode-plugin`](https://github.com/softprobe/softprobe-js/tree/main/packages/opencode-plugin) |
| `@softprobe/e2e` | 面向 Node.js 22.13+ 的 `@playwright/test`、Web `e2e` 与移动端 `@softprobe/e2e/mobile` 测试夹具及 W3C 分布式链路断言 | [`softprobe-js/packages/e2e`](https://github.com/softprobe/softprobe-js/tree/main/packages/e2e) |

## `@softprobe/tracing` {#softprobe-tracing}

安装核心包：

```bash
npm install @softprobe/tracing
```

### `SoftprobeClient`

`SoftprobeClient` 配置 OpenTelemetry `NodeTracerProvider`，通过带自动重试的 OTLP HTTP/protobuf 导出 span，并向 Softprobe API 发送评分。

#### `SoftprobeClient.fromEnv(overrides?)`

从标准 OpenTelemetry 与 Softprobe 环境变量构建客户端，并合并可选的 `overrides`（`Partial<SoftprobeClientOptions>`）。若在 `overrides.ingestionKey`、`INGESTION_KEY`、`OTEL_EXPORTER_OTLP_TRACES_HEADERS` 或 `OTEL_EXPORTER_OTLP_HEADERS` 中均未找到 Ingestion Key，则抛出 `MissingSoftprobeCredentialsError`。

```ts
import { SoftprobeClient } from "@softprobe/tracing";

const client = SoftprobeClient.fromEnv({ serviceName: "my-agent" });
```

#### `new SoftprobeClient(options)`

根据显式 `SoftprobeClientOptions` 对象创建客户端。

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `ingestionKey` | `string` | 必填 | Agent Ingestion Key（`spk_...`） |
| `baseUrl` | `string` | `https://explorer.softprobe.ai/api/thelake` | 评分 API 基础地址，不会改变 OTLP trace 导出地址 |
| `otlp` | `OtlpExportOptions` | `{}` | `{ endpoint?, tracesEndpoint?, protocol?, headers? }` |
| `otlpEndpoint` | `string` | 生产环境 traces URL | `otlp.tracesEndpoint` 的兼容别名 |
| `resourceAttributes` | `Record<string, ResourceAttributeValue>` | `{}` | 附加的 OpenTelemetry 资源属性 |
| `serviceName` | `string` | `"softprobe-app"` | 设置 OpenTelemetry `service.name` |
| `serviceVersion` | `string` | `undefined` | 设置 OpenTelemetry `service.version` |
| `environment` | `string` | `undefined` | 设置 `deployment.environment.name` |
| `release` | `string` | `undefined` | Observation 默认发布版本标签 |
| `sessionId` | `string` | `undefined` | 默认 `gen_ai.conversation.id` 与 `session.id` |
| `userId` | `string` | `undefined` | 默认 `user.id` |
| `tags` | `string[]` | `undefined` | Observation 默认标签列表 |
| `redactKeys` | `string[]` | `defaultRedactKeys()` | 在采集消息体时替换为 `[REDACTED]` 的键名列表 |
| `timeoutMs` | `number` | `10000` | HTTP 请求超时时间（毫秒） |
| `headers` | `Record<string, string>` | `{}` | 合并到 OTLP 与评分请求中的附加请求头 |
| `useSimpleProcessor` | `boolean` | `false` | 使用 `SimpleSpanProcessor` 替代 `BatchSpanProcessor` |
| `retryExport` | `boolean` | `true` | 使用 `RetryingSpanExporter` 包装 OTLP 导出器 |

---

## `@softprobe/web-record` {#softprobe-web-record}

浏览器录制 SDK，采集 rrweb DOM 事件，将实时浏览器语义交互导出为 `softprobe.ui.action` OTLP span，为 `fetch` 与 `XMLHttpRequest` 注入 W3C `traceparent` 请求头，并采集脱敏后的 JSON 请求与响应体。

```bash
npm install @softprobe/web-record
```

### `RecordSdk.init(options)` {#recordsdk-init-options}

初始化浏览器采集并返回 `WebRecordController`。

```ts
import { RecordSdk } from "@softprobe/web-record";

const recorder = RecordSdk.init({
	ingestionKey: "spk_REPLACE_WITH_INGESTION_KEY",
	serviceName: "my-web",
	captureSemanticActions: true,
	inputCapture: "secrets-only",
});
```

#### `WebRecordInitOptions`

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `ingestionKey` | `string` | 必填 | 仅限写入的 Ingestion Key（`spk_...`），请勿在前端代码中放入用户密码或账户令牌 |
| `serviceName` | `string` | `"softprobe-web"` | 浏览器 span 的 OpenTelemetry `service.name` |
| `otlp` | `OtlpExportOptions` | 生产环境 traces URL | 配置 `otlp.tracesEndpoint` 或 `otlp.endpoint` 以及 `protocol: "http/protobuf"` |
| `resourceAttributes` | `ResourceAttributes` | `{}` | 附加资源属性（例如 `deployment.environment.name`） |
| `environment` | `string` | `undefined` | `deployment.environment.name` 简写配置 |
| `sessionId` | `string` | 自动识别 | 显式会话 ID；省略时自动从 `sessionStorage`、`/sessions/:id` 路径或 `/sessions` 响应提取 |
| `userId` | `string` | `undefined` | 写入 span 的终端用户标识 |
| `apiOrigins` | `string[]` | `window.location.origin` | 需要追踪并注入 `traceparent` 请求头的完整源地址列表 |
| `httpBodyCapture` | `boolean \| HttpBodyCaptureOptions` | `true` | 在 `softprobe.http.body.capture` 子 span 上记录同源 JSON 请求与响应体；传入 `false` 关闭 |
| `captureSemanticActions` | `boolean` | `false` | 将 `navigate`、`click`、`dblclick`、`contextmenu`、`hover`、`fill`、`select`、`check`、`press`、`upload`、`drag`、`scroll`、`dialog` 与 `resize` 实时导出为 `softprobe.ui.action` span（`sp-ui-action-1`） |
| `inputCapture` | `"masked" \| "secrets-only" \| "unmasked"` | `"masked"`（启用语义动作时默认 `"secrets-only"`） | 在 `"secrets-only"` 下将密码框、银行卡号、验证码、令牌与 `secretSlots` 字段导出为 `{ kind: "secret", slot }` |
| `secretSlots` | `Readonly<Record<string, string>>` | `undefined` | 将 CSS 选择器（如 `'input[name="apiKey"]'`）映射为敏感槽位名（如 `"API_KEY"`），在测试中通过 `SP_SECRET_<SLOT>` 读取 |

#### `HttpBodyCaptureOptions` 与 `HttpBodyCaptureRoute` {#httpbodycaptureoptions-and-httpbodycaptureroute}

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxBodyBytes` | `number` | `65536` | 超过该字节上限的消息体会被省略 |
| `routes` | `HttpBodyCaptureRoute[]` | `undefined` | 可选路由白名单，每个条目支持 `method`、`path`、可选 `origin` 与可选 `redactJsonPaths` |

---

## `@softprobe/vercel-ai-sdk` {#softprobe-vercel-ai-sdk}

将 Vercel AI SDK 的 `generateText`、`streamText` 与工具调用接入 Softprobe，并在 Node.js 入站与出站 HTTP 请求之间自动透传 W3C `traceparent` 与会话 ID。

```bash
npm install @softprobe/vercel-ai-sdk @softprobe/tracing
```

### `initVercelAiTelemetry(options?)` {#initvercelaitelemetry-options}

创建 `SoftprobeVercelAiSdkIntegration`，挂载 HTTP 上下文透传，并向 `ai` 包注册遥测集成。支持 `ingestionKey`、`serviceName`、`otlp`、`resourceAttributes`、`environment`、`baseUrl`、`tracer` 与 `useSimpleProcessor`。

---

## `@softprobe/langchain` {#softprobe-langchain}

面向 TypeScript 与 Node.js 的 LangChain 及 LangGraph 追踪包，详见 [LangChain 集成指南](/zh/blackbox/langchain)。导出 `instrument(params?)`、`uninstrument()`、`isInstrumented()`、`getHandler()`、`autoInstrumentFromEnv()` 与 `CallbackHandler`。

---

## `@softprobe/opencode-plugin` {#softprobe-opencode-plugin}

将 OpenCode 编码 Agent 的对话轮次、模型生成、工具调用与子任务上报至 Softprobe，详见 [OpenCode 集成指南](/zh/blackbox/opencode)。

---

## `@softprobe/react-native` {#softprobe-react-native}

基于 `@opentelemetry/api` 与 `@opentelemetry/sdk-trace-base` 的 React Native 及 Expo 扩展包。自动在 span 上写入 `sp.session.id` 与 `session.id`，在 `fetch` 请求上透传 W3C `traceparent` 与 `baggage`（`sp.session.id`），并导出带敏感槽位脱敏的 `softprobe.ui.action`（`sp-ui-action-1`，`captureSource: "otel_sdk"`）span。接入步骤见[如何测试 iOS 与 Android 应用](/zh/ui-testing/mobile#path-2-react-native)。

```bash
npm install @softprobe/react-native @opentelemetry/api @opentelemetry/sdk-trace-base
```

### `installSoftprobeReactNative(options)` 与 `initSoftprobeReactNative(options)`

- `installSoftprobeReactNative(options: InstallSoftprobeReactNativeOptions): SoftprobeReactNativeHandle` 将 `SoftprobeMobileSpanProcessor`、`fetch` 链路透传与 `ReactNativeActionRecorder` 挂载到现有的 `MutableTracerProvider`（如 `BasicTracerProvider`）。
- `initSoftprobeReactNative(options: InitSoftprobeReactNativeOptions): SoftprobeReactNativeHandle` 在未传入 `options.tracerProvider` 时自动创建带 `SoftprobeMobileSpanProcessor` 与 `FetchOtlpJsonSpanExporter` 的 `BasicTracerProvider`，随后调用 `installSoftprobeReactNative`。

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `platform` | `"ios" \| "android"` | 必填 | 写入 `sp.platform` 与 `sp.ui.action.platform` 的移动平台标识 |
| `tracerProvider` | `MutableTracerProvider` | `installSoftprobeReactNative` 必填；`initSoftprobeReactNative` 自动创建 | 挂载 `SoftprobeMobileSpanProcessor` 的 OpenTelemetry `TracerProvider` |
| `endpoint` | `string` | `undefined` | `initSoftprobeReactNative` 的 OTLP HTTP 基础地址；省略 `tracesEndpoint` 时自动追加 `/v1/traces` |
| `tracesEndpoint` | `string` | 生产环境 traces URL | `initSoftprobeReactNative` 使用的完整 OTLP HTTP JSON traces 地址 |
| `ingestionKey` | `string` | `undefined` | 由 `FetchOtlpJsonSpanExporter` 作为 `Authorization: Bearer <ingestionKey>` 发送 |
| `headers` | `Readonly<Record<string, string>>` | `{}` | `initSoftprobeReactNative` 导出 OTLP 请求时附加的 HTTP 请求头 |
| `exportTimeoutMillis` | `number` | `10000` | OTLP HTTP 导出超时时间（毫秒） |
| `batchExport` | `boolean` | `false` | 为 `true` 时使用 `BatchSpanProcessor`，为 `false` 时使用 `SimpleSpanProcessor` |
| `registerGlobalTracerProvider` | `boolean` | `false` | 在 `initSoftprobeReactNative` 创建 Provider 后调用 `provider.register()` |
| `serviceName` | `string` | `undefined` | OpenTelemetry `service.name` 资源与 span 属性 |
| `sessionId` | `string` | 从 `launchArguments` 解析或自动生成 | 显式指定的可打印 ASCII `MobileSessionId`（长度 `1..128`） |
| `launchArguments` | `Readonly<Record<string, unknown>> \| readonly string[]` | `undefined` | 自动从 `sp_session_id`、`spSessionId`、`-spSessionId` 或 `--sp-session-id` 提取测试会话 ID |
| `resourceAttributes` | `Readonly<Record<string, string \| number \| boolean>>` | `{}` | 附加的 OpenTelemetry 资源属性 |
| `apiOrigins` | `readonly string[]` | 全部 HTTP 与 HTTPS 源 | 允许注入 `traceparent` 与 `baggage` 请求头的目标源列表 |
| `baseOrigin` | `string` | `undefined` | 解析相对路径 `fetch` 请求时使用的基础源地址 |
| `ignoreUrls` | `readonly (string \| RegExp)[]` | `[tracesUrl]` | 排除在 `fetch` 追踪之外的 URL 列表 |
| `httpBodyCapture` | `boolean \| HttpBodyCaptureOptions` | `false` | 采集不超过 `maxBodyBytes` 的脱敏 JSON 请求与响应体 |
| `redactJsonPaths` | `readonly string[]` | `undefined` | 在采集到的 HTTP JSON 消息体中替换为 `[REDACTED]` 的 JSONPath 列表 |
| `initialRoute` | `string` | `"/"` | `softprobe.ui.action` span 记录的初始路由路径 |
| `inputCapture` | `"masked" \| "secrets-only" \| "unmasked"` | `"secrets-only"` | 在 `"secrets-only"` 模式下将密码框与 `secretSlots` 脱敏为 `{ kind: "secret", slot }` |
| `secretSlots` | `Readonly<Record<string, string>>` | `undefined` | 将 `testId`、`accessibilityId`、`name` 或 `label` 映射为敏感槽位名称 |
| `quietMs` | `number` | `40` | 在途 HTTP 请求结束后判定动作稳定的静默等待毫秒数 |
| `maxSettleMs` | `number` | `15000` | 单个动作等待稳定的最大毫秒数 |
| `instrumentGlobalFetch` | `boolean` | `true` | 为 `true` 时自动包装 `globalThis.fetch`（或 `fetchTarget.fetch`） |

### `SoftprobeReactNativeHandle` 与底层导出项

`installSoftprobeReactNative` 与 `initSoftprobeReactNative` 返回 `SoftprobeReactNativeHandle`：

- `sessionId`、`getSessionId()` 与 `setSessionId(nextSessionId)` 读取或轮换当前活动的 `MobileSessionId`。
- `actions`（`ReactNativeActionRecorder`）提供 `onNavigationRouteChange(routeNameOrPath, paramsOrOptions?)`、`recordTap(target, pointOrOptions?)`、`recordFill(target, rawValue, options?)`、`recordLongPress(target, options?)`、`recordSwipe(direction, target?, distanceRatio?, options?)`、`recordBack(options?)`、`recordDismissKeyboard(options?)`、`recordEndAnchors(anchors)`、`recordGoneAnchors(anchors)`、`flush()`、`waitForIdle()` 与 `shutdown()`。
- `fetch` 暴露已插桩的 `fetch` 函数；`flush()`、`shutdown()` 与 `uninstall()` 管理生命周期清理。
- 同时导出 `SoftprobeMobileSpanProcessor`、`FetchOtlpJsonSpanExporter`、`instrumentReactNativeFetch`、`createReactNativeActionRecorder`、`resolveMobileSessionId` 与 `extractLaunchArgumentSessionId`。

---

## `@softprobe/e2e` {#softprobe-e2e}

面向 Node.js 22.13 及以上环境的 `@playwright/test`、Web `e2e` 与移动端 `@softprobe/e2e/mobile` 全栈 UI 测试 SDK。通过 W3C `traceparent` 与 `baggage` 请求头关联客户端请求，并借助 `BlackboxSink` 断言后端发出的下游 `CLIENT` HTTP 调用。完整用法见 [Softprobe UI 测试](/zh/ui-testing/)、[如何从录制的会话生成 UI 测试](/zh/ui-testing/from-sessions)与[如何测试 iOS 与 Android 应用](/zh/ui-testing/mobile)。

```bash
npm install -D @softprobe/e2e @playwright/test
```

运行 Web `e2e` 套件时需同时安装 `e2e@0.24.0`、`@e2e-dev/web@0.16.1` 与 `zod`。运行 iOS 与 Android 套件时需安装 `e2e@0.24.0`、`@e2e-dev/mobile@0.12.8` 与 `zod`。

### 核心导出项

- `softprobeWeb(options?)` 包装 `@e2e-dev/web`，通过 Playwright `browser.route` 注入或保留 W3C `traceparent` 请求头，并绑定 `trace` 测试夹具。
- `softprobeReporter()` 将通过校验的链路摘要写入 `.e2e/softprobe-traces.json`（`schemaVersion: "softprobe-traces-1"`）。
- `softprobeCachedAgent(options?)` 返回 `AgentConfig`（`{ model?, judge?, context?, cacheDir? }`），在 CI 中回放录制的 `.e2e/cache/` `trace-1` 缓存条目时实现零模型调用，并在传入 `options.model` 时将未命中缓存的 `agent.act` 步骤转发给模型。
- 重新导出 `e2e` 的 `test`、`describe`、`beforeEach`、`afterEach`、`beforeAll`、`afterAll`、`expect`、`credentials`、`secrets`、`unique`、`AgentError` 与 `isAgentError`。

#### `SoftprobeWebOptions`

继承自 `@e2e-dev/web` 的 `WebOptions`：

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `sink` | `SoftprobeSinkConfig` | 从选项与环境变量解析 | 显式 Blackbox 配置 `{ kind: "blackbox", endpoint, token?, workspaceId?, explorerUrl? }` |
| `endpoint` | `string` | `SOFTPROBE_SINK_ENDPOINT`、`SOFTPROBE_TRACE_ENDPOINT`、`SOFTPROBE_URL` 或 `https://explorer.softprobe.ai/api/thelake` | Blackbox 链路查询基础地址 |
| `token` | `string` | `SOFTPROBE_API_KEY`、`SOFTPROBE_TOKEN` 或 `INGESTION_KEY` | Blackbox 链路查询 Bearer 令牌 |
| `workspaceId` | `string` | `SOFTPROBE_WORKSPACE_ID` | 查询 Blackbox 时发送的 `X-Workspace-Id` 请求头 |
| `explorerUrl` | `string` | `SOFTPROBE_EXPLORER_URL` 或从 `endpoint` 推导 | 生成报错信息中 `explorerTraceUrl` 的基础地址 |
| `apiOrigins` | `readonly (string \| RegExp)[]` | `[app.url]` | 由 `browser.route` 拦截并关联 `traceparent` 的目标源列表 |
| `pollTimeoutMs` | `number` | `30000` | 轮询后端 `SERVER` span 与下游 `CLIENT` 调用的最大毫秒数（兼容别名 `traceTimeoutMs`） |
| `pollIntervalMs` | `number` | `250` | 两次 Blackbox 链路轮询之间的间隔毫秒数 |
| `settleMs` | `number` | `150` | `trace.expectNoOutboundHttp` 在收到后端 `SERVER` span 后的额外观察窗口毫秒数 |

### `TraceScope` 夹具与错误类型

- `trace.outboundHttp(query)` 等待匹配 `query.triggeredBy` 的最新客户端请求对应的后端入口 `SERVER` span，随后轮询直到下游 `CLIENT` HTTP span 匹配 `url` 及可选的 `method`、`status`、`serviceName`。
- `trace.expectNoOutboundHttp(query?)` 验证匹配的客户端请求均已到达后端 `SERVER` span，且在等待 `settleMs` 后未产生任何匹配的下游 `CLIENT` HTTP 调用。
- `trace.window(fn)` 执行 `fn` 并返回仅包含 `fn` 运行期间产生的客户端请求的子 `TraceScope`。
- `TraceInstrumentationError` 与 `isTraceInstrumentationError(value)` 在后端 `SERVER` span 超出 `pollTimeoutMs` 仍未到达时报告 `code: "TRACE_INSTRUMENTATION_MISSING"`。
- `TraceAssertionError` 与 `isTraceAssertionError(value)` 在后端 `SERVER` span 已到达但出站断言不匹配时报告 `code: "TRACE_ASSERTION_FAILED"`，并通过 `observedCalls` 暴露实际观测到的调用。

### `@softprobe/e2e/playwright` 导出项 {#softprobe-e2e-playwright}

从 `@softprobe/e2e/playwright` 导入可在 `@playwright/test` 套件中通过 `context.route` 挂载 `trace` 夹具，且不与 Playwright 内置的 `use.trace` 选项冲突。导出 `test`、`expect`、`extendPlaywrightTest`、`createPlaywrightTraceScope`、`SoftprobePlaywrightOptions` 与 `SoftprobePlaywrightFixtures`。

### `@softprobe/e2e/mobile` 导出项 {#softprobe-e2e-mobile}

从 `@softprobe/e2e/mobile` 导入可通过 `@e2e-dev/mobile` 驱动 iOS 模拟器与 Android 设备，从宿主机导出 `softprobe.ui.action` OTLP span（`captureSource: "host_agent"`），并在 `"proxy"` 或 `"session"` 关联模式下校验后端出站 HTTP 链路：

- `softprobeMobile(options: SoftprobeMobileOptions)` 包装 `@e2e-dev/mobile` 的 `mobile(options)`，提供宿主机 OTLP 语义动作导出、启动参数自动注入、Android `adb reverse` 端口转发以及 `trace` 夹具关联。
- `mobileTools(...engines)` 解包 `softprobeMobile(...)` 引擎句柄并返回供内置 `e2e` Agent（`agents.<name>.tools`）录制新步骤时使用的 `@e2e-dev/mobile/tools` 工具表。
- `test`、`describe`、`beforeEach`、`afterEach`、`beforeAll`、`afterAll`、`expect`、`credentials`、`secrets`、`unique`、`softprobeCachedAgent` 与 `softprobeReporter` 提供带 `{ device, app, screen, agent, trace }` 夹具类型的移动端测试绑定。
- `wrapMobileEngine(baseEngine, options)` 与 `buildMobileCorrelationLaunchArguments(input)` 提供底层引擎包装与启动参数构造函数。

#### `SoftprobeMobileOptions`

继承自 `@e2e-dev/mobile` 的 `MobileOptions`（`platform`、`device`、`session`、`snapshot`、`settle`、`transition`、`videoTouches`）：

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `platform` | `"ios" \| "android"` | 必填 | 目标移动操作系统 |
| `device` | `string \| readonly string[] \| DeviceProvider` | 当前已启动的同平台设备 | 模拟器名称或 UDID、Android 序列号（如 `emulator-5554`）、设备池数组或云端 `DeviceProvider` |
| `correlation` | `SoftprobeMobileCorrelationConfig` | `{ mode: "session" }` | 选择 `"proxy"` 模式（路径 1 零 SDK 本地反向代理）或 `"session"` 模式（路径 2 OpenTelemetry SDK 会话关联） |
| `captureActions` | `boolean` | `true` | 从宿主机导出 `softprobe.ui.action` OTLP span（`captureSource: "host_agent"`）。当路径 2 客户端 SDK 已在应用内导出 `otel_sdk` 动作 span 时请设为 `false`。 |
| `secretSlots` | `Readonly<Record<string, string>>` | `undefined` | 将移动端控件 `testId`、资源 ID 名称、`name` 或 `placeholder` 映射为敏感槽位名 |
| `serviceName` | `string` | `"softprobe-e2e-mobile"` | 宿主机导出的 `softprobe.ui.action` span 上的 `service.name` 资源属性 |
| `sink` | `SoftprobeSinkConfig` | 从选项与环境变量解析 | 显式 Blackbox 或 Arex 后端存储配置 |
| `endpoint` | `string` | 环境变量或 `https://explorer.softprobe.ai/api/thelake` | OTLP 动作导出与 `trace` 查询共用的基础地址 |
| `token` | `string` | `SOFTPROBE_API_KEY`、`SOFTPROBE_TOKEN`、`SP_TOKEN` 或 `INGESTION_KEY` | 查询与导出的 Bearer 令牌 |
| `workspaceId` | `string` | `SOFTPROBE_WORKSPACE_ID` | 查询 Blackbox 时附带的 Workspace ID 请求头 |
| `explorerUrl` | `string` | `SOFTPROBE_EXPLORER_URL` | 生成 `explorerTraceUrl` 排障链接的基础地址 |
| `pollTimeoutMs` | `number` | `30000` | 轮询后端 `SERVER` 与 `CLIENT` span 的最大毫秒数（支持别名 `traceTimeoutMs`） |
| `pollIntervalMs` | `number` | `250` | 两次轮询之间的间隔毫秒数 |
| `settleMs` | `number` | `150` | `trace.expectNoOutboundHttp` 在收到后端 `SERVER` span 后的观察窗口毫秒数 |

#### `SoftprobeMobileCorrelationConfig`

| 模式 | 字段 | 注入的启动参数 |
|------|------|----------------|
| `"proxy"` | `{ mode: "proxy", upstreamOrigin: string, launchArgKey?: string, adbReverse?: boolean }` | 在宿主机 `127.0.0.1` 启动临时 HTTP 反向代理，在 Android 上默认执行 `adb reverse`（除非 `adbReverse` 为 `false`），并在 Android 启动参数中追加 `--es <launchArgKey> <proxyOrigin>`（默认键名 `"api_base_url"`），在 iOS 启动参数中追加 `-<launchArgKey> <proxyOrigin>`（默认参数 `"-API_BASE_URL"`）。 |
| `"session"` | `{ mode: "session", sessionId?: string, launchArgKey?: string }` | 在 Android 启动参数中追加 `--es <launchArgKey> <sessionId>`（默认键名 `"sp_session_id"`），在 iOS 启动参数中追加 `-<launchArgKey> <sessionId>`（默认参数 `"-spSessionId"`），并直接从 Blackbox 会话 span 解析 `trace.outboundHttp`。 |

---

## 环境变量 {#environment-variables}

所有 Node.js 服务端包（`@softprobe/tracing`、`@softprobe/vercel-ai-sdk`、`@softprobe/langchain`、`@softprobe/opencode-plugin`）共用以下环境变量：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `INGESTION_KEY` | OTLP trace 导出与评分 API 使用的 Bearer 令牌 | 省略时尝试从 `Authorization` 请求头解析 |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | 完整 OTLP HTTP traces 地址，按原样使用 | `https://explorer.softprobe.ai/api/thelake/v1/traces` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | 基础 OTLP 地址，SDK 自动追加 `/v1/traces` | 无 |
| `OTEL_EXPORTER_OTLP_TRACES_HEADERS` | 逗号分隔的 `key=value` 请求头（如 `Authorization=Bearer spk_...`） | 优先级高于 `OTEL_EXPORTER_OTLP_HEADERS` |
| `OTEL_EXPORTER_OTLP_TRACES_PROTOCOL` | OTLP 协议（`http/protobuf`） | `http/protobuf` |
| `OTEL_SERVICE_NAME` | OpenTelemetry `service.name`（同时兼容 `SOFTPROBE_SERVICE_NAME`） | `"softprobe-app"` |
| `OTEL_RESOURCE_ATTRIBUTES` | 逗号分隔的资源属性（如 `deployment.environment.name=staging`） | 无 |
| `SOFTPROBE_BASE_URL` | 仅用于 `createScore` 的 REST API 基础地址，不改变 trace 导出路由 | `https://explorer.softprobe.ai/api/thelake` |
| `SOFTPROBE_ENVIRONMENT` | 设置 `deployment.environment.name` | 无 |
| `SOFTPROBE_SESSION_ID` | 未指定会话 ID 时的回退会话 ID | 无 |
| `SOFTPROBE_USER_ID` | 回退用户 ID | 无 |
| `SOFTPROBE_LANGCHAIN` | 设为 `0`、`false`、`off` 或 `no` 可禁用 `@softprobe/langchain` 自动插桩 | 存在凭据时默认开启 |
