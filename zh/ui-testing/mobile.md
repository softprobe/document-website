---
title: 如何测试 iOS 与 Android 应用
---

# 如何测试 iOS 与 Android 应用

自动化运行 iOS 与 Android 移动端 UI 测试，并同步校验后端向外部服务发出的真实 HTTP 请求。Softprobe UI 测试将移动设备自动化与 [Softprobe Explorer](https://explorer.softprobe.ai) 中的 W3C 分布式链路校验结合起来，在 CI 中以零次大模型调用回放 `.e2e/cache/` 中的 `agent.act` 步骤，并支持让编码 Agent 通过 Blackbox MCP 从录制的移动端会话生成 `@softprobe/e2e/mobile` 或 Maestro 测试套件。

两条移动端采集路径都会输出统一的 `softprobe.ui.action` OpenTelemetry span（`sp-ui-action-1`），在导出前将密码与一次性验证码脱敏为 `{ kind: "secret", slot }` 占位引用，并驱动 `trace.outboundHttp` 与 `trace.expectNoOutboundHttp` 断言。

## 选择采集路径 {#choose-path}

根据移动应用的构建方式与运行环境选择采集路径：

| 对比维度 | 路径 1，零 SDK `agent.act` + 代理模式 | 路径 2，OpenTelemetry SDK 扩展 + 会话模式 |
|----------|---------------------------------------|-------------------------------------------|
| **客户端代码改动** | 无需改动，直接测试未插桩的 `.apk` 与 `.app` 安装包。 | 在应用现有的 OpenTelemetry SDK 上注册 Softprobe `SpanProcessor` 以及 UI 与 HTTP 扩展。 |
| **`softprobeMobile` 关联配置** | `correlation: { mode: "proxy", upstreamOrigin }` | `correlation: { mode: "session" }` |
| **链路与会话透传方式** | 宿主机本地 HTTP 反向代理为每次请求自动生成并注入 W3C `traceparent` 与 `baggage` 请求头。 | 应用内的 `fetch`、`OkHttp` 或 `URLSession` 拦截器直接注入 W3C `traceparent` 与 `baggage` 请求头。 |
| **支持的设备与网络环境** | 通过 `adb reverse` 连接的本地 Android 模拟器、USB 真机，以及访问未开启证书绑定的 HTTP 接口的本地 iOS 模拟器。 | 模拟器、连接 Wi-Fi 或蜂窝网络的真机、启用 TLS 证书绑定的接口、云真机平台、手动测试会话与生产环境会话。 |
| **UI 动作采集精度** | 通过 ADB UiAutomator 与 XCTest 对比系统无障碍树，导出 `sp.ui.action.capture_source: "host_agent"`。 | 在应用进程内直接读取 React Native、Android `View` 与 iOS 控件信息，导出 `sp.ui.action.capture_source: "otel_sdk"`。 |

如果希望在不修改客户端源码的前提下立即为现有安装包接入 CI 回归测试，请优先选择路径 1。如果应用已经接入 OpenTelemetry、启用了 TLS 证书绑定、运行在蜂窝网络真机或云真机上，或者需要在 Explorer 中录制手动 QA 会话，请选择路径 2。

## 使用路径 1 测试未改动的应用 {#path-1}

### 安装宿主机依赖 {#path-1-install}

在 Node.js 22.13 及以上环境中，安装 `@softprobe/e2e`、`e2e`、`@e2e-dev/mobile`、`zod`，以及首次录制步骤所需的 AI SDK 模型包（例如 `@ai-sdk/openai`）：

```bash
npm install -D @softprobe/e2e e2e@0.24.0 @e2e-dev/mobile@0.12.8 @ai-sdk/openai zod
```

启动一台可通过 `adb devices` 识别的 Android 模拟器，或在 macOS 上启动可通过 `xcrun simctl list devices booted` 识别的 iOS 模拟器。使用工作区 Ingestion Key 在后端导出 OpenTelemetry HTTP span 或挂载官方 OpenTelemetry OBI，具体配置见[快速开始](/zh/blackbox/getting-started)。

### 以代理模式配置 `softprobeMobile` {#path-1-config}

创建 `e2e.config.ts`。将 `correlation.mode` 设为 `"proxy"` 并填写后端地址 `upstreamOrigin`。本地录制时将模型与 `mobileTools(androidEngine)` 一并传入以生成 `.e2e/cache/`。CI 运行时切换为 `softprobeCachedAgent()` 与 `"read-only"` 缓存模式，实现零模型调用：

```ts
import { openai } from "@ai-sdk/openai";
import type { E2EConfig } from "e2e";
import {
	mobileTools,
	softprobeCachedAgent,
	softprobeMobile,
	softprobeReporter,
} from "@softprobe/e2e/mobile";

function requireSecretEnv(primaryEnv: string, fallbackEnv: string): string {
	const value = process.env[primaryEnv] ?? process.env[fallbackEnv];
	if (!value || value.trim() === "") {
		throw new Error(
			`Missing required secret environment variable: ${primaryEnv}`,
		);
	}
	return value;
}

const isCi = Boolean(process.env.CI);

const androidEngine = softprobeMobile({
	platform: "android",
	device: process.env.SP_ANDROID_ADB_TARGET ?? process.env.ANDROID_SERIAL,
	sink: {
		kind: "blackbox",
		endpoint:
			process.env.SOFTPROBE_SINK_ENDPOINT ??
			"https://explorer.softprobe.ai/api/thelake",
		token: process.env.SOFTPROBE_TOKEN,
		workspaceId: process.env.SOFTPROBE_WORKSPACE_ID,
	},
	correlation: {
		mode: "proxy",
		upstreamOrigin:
			process.env.API_UPSTREAM_ORIGIN ?? "http://127.0.0.1:8080",
	},
});

export default {
	projectId: "acme-mobile-ui-tests",
	workers: 1,
	retries: 0,
	tests: "tests/**/*.e2e.ts",
	cache: {
		dir: ".e2e/cache",
		mode: isCi ? "read-only" : "read-write",
	},
	secrets: {
		ADMIN_PASSWORD: () =>
			requireSecretEnv(
				"SP_SECRET_ADMIN_PASSWORD",
				"E2E_SECRET_ADMIN_PASSWORD",
			),
	},
	agents: {
		default: isCi
			? softprobeCachedAgent()
			: {
					model: openai("gpt-5.4-mini"),
					tools: mobileTools(androidEngine),
				},
	},
	targets: [
		{
			name: "android",
			engine: androidEngine,
			app: {
				bundleId: "com.acme.invite",
				appPath: process.env.ANDROID_APK_PATH,
			},
		},
	],
	reporters: ["list", softprobeReporter()],
} satisfies E2EConfig;
```

每次执行测试时，`softprobeMobile` 都会在宿主机 `127.0.0.1` 上启动临时 HTTP 反向代理，并通过 `app.launchArguments` 将代理地址传入客户端：

- 在 Android 上，只要未设置 `correlation.adbReverse: false`，`softprobeMobile` 就会自动执行 `adb reverse tcp:<port> tcp:<port>`，并在启动参数中追加 `--es api_base_url http://127.0.0.1:<port>`。如果客户端 `Activity` 读取其他 Intent Extra 键名，可设置 `correlation.launchArgKey`。
- 在 iOS 模拟器上，`softprobeMobile` 会向进程启动参数追加 `-API_BASE_URL http://127.0.0.1:<port>`，客户端可通过 `UserDefaults.standard.string(forKey: "API_BASE_URL")` 直接读取。如需自定义启动参数名，可设置 `correlation.launchArgKey`。

### 编写带后端链路断言的 `agent.act` 测试 {#path-1-test}

创建 `tests/invite-mobile.e2e.ts`。从 `@softprobe/e2e/mobile` 导入 `{ describe, expect, secrets, test }`，在每个 `agent.act` 步骤后校验可见界面文本，并通过 `trace.outboundHttp` 与 `trace.expectNoOutboundHttp` 断言后端出站请求：

```ts
import { z } from "zod";
import { describe, expect, secrets, test } from "@softprobe/e2e/mobile";

const EmailPayloadSchema = z.object({
	to: z.string().email(),
});

describe("Mobile team invitations", () => {
	test("queues an invite and sends one downstream email request", async ({
		app,
		agent,
		screen,
		trace,
	}) => {
		await app.open();

		await agent.act(
			"fill {email} into Teammate email, fill {password} into Admin password, and tap Send invite",
			{
				params: {
					email: "ada@example.com",
					password: secrets.get("ADMIN_PASSWORD"),
				},
			},
		);

		await expect(
			screen.getByText("Invitation queued for ada@example.com"),
		).toBeVisible();

		const outbound = await trace.outboundHttp({
			triggeredBy: { method: "POST", path: "/api/invites" },
			method: "POST",
			url: /\/v1\/email\/send$/,
			status: 200,
		});

		expect(EmailPayloadSchema.parse(outbound.request.json)).toEqual({
			to: "ada@example.com",
		});
	});

	test("sends no downstream email when POST /api/invites returns 409", async ({
		app,
		agent,
		screen,
		trace,
	}) => {
		await app.open();

		await agent.act(
			"fill {email} into Teammate email, fill {password} into Admin password, and tap Send invite",
			{
				params: {
					email: "existing@example.com",
					password: secrets.get("ADMIN_PASSWORD"),
				},
			},
		);

		await expect(
			screen.getByText("Error: Already a member"),
		).toBeVisible();

		await trace.expectNoOutboundHttp({
			triggeredBy: { method: "POST", path: "/api/invites" },
		});
	});
});
```

传入 `secrets.get("ADMIN_PASSWORD")` 仅在执行瞬间注入真实密码。磁盘上的 `.e2e/cache/*.json` 与上报到 Blackbox 的 `softprobe.ui.action` span 只保存 `{ kind: "secret", slot: "ADMIN_PASSWORD" }`，不会落盘或上传明文凭据。

### 本地录制一次并在 CI 零 LLM 回放 {#path-1-replay}

1. 在本地携带模型 API Key 运行一次，生成 `.e2e/cache/<sha256>.json` 并将 `softprobe.ui.action` span 导出到 Blackbox：

	```bash
	E2E_TELEMETRY_DISABLED=1 \
	OPENAI_API_KEY="sk-..." \
	SOFTPROBE_TOKEN="YOUR_BLACKBOX_TOKEN" \
	SOFTPROBE_WORKSPACE_ID="YOUR_WORKSPACE_ID" \
	SP_SECRET_ADMIN_PASSWORD="YOUR_TEST_PASSWORD" \
	npx e2e run
	```

2. 设置 `CI=true` 并移除 `OPENAI_API_KEY` 再次运行，验证确定性的零 LLM 回放：

	```bash
	CI=true \
	E2E_TELEMETRY_DISABLED=1 \
	SOFTPROBE_TOKEN="YOUR_BLACKBOX_TOKEN" \
	SOFTPROBE_WORKSPACE_ID="YOUR_WORKSPACE_ID" \
	SP_SECRET_ADMIN_PASSWORD="YOUR_TEST_PASSWORD" \
	npx e2e run
	```

3. 检查 `.e2e/report.json` 中的 `"modelTokens": 0`，随后将 `tests/` 与 `.e2e/cache/` 一并提交到 Git。

## 在路径 2 中通过 OpenTelemetry 插桩移动应用 {#path-2}

路径 2 为 React Native、原生 Android 与原生 iOS 提供基于官方 CNCF OpenTelemetry SDK 的轻量扩展。所有扩展都会自动为 span 写入 `sp.session.id` 与 `session.id`，在出站 HTTP 请求上注入 W3C `traceparent` 与 `baggage`（`sp.session.id`），并导出带 `sp.ui.action.capture_source: "otel_sdk"` 标记的 `softprobe.ui.action` span。

### React Native 与 Expo {#path-2-react-native}

安装 `@softprobe/react-native`、`@opentelemetry/api` 与 `@opentelemetry/sdk-trace-base`：

```bash
npm install @softprobe/react-native @opentelemetry/api @opentelemetry/sdk-trace-base
```

如果应用已经初始化了 `BasicTracerProvider` 或 `WebTracerProvider`，调用 `installSoftprobeReactNative` 即可复用现有 Provider 与导出器：

```ts
import { BasicTracerProvider } from "@opentelemetry/sdk-trace-base";
import { installSoftprobeReactNative } from "@softprobe/react-native";

const tracerProvider = new BasicTracerProvider({
	spanProcessors: [yourExistingSpanProcessor],
});

export const softprobe = installSoftprobeReactNative({
	tracerProvider,
	platform: "android",
	serviceName: "acme-mobile",
	launchArguments: initialProps,
	apiOrigins: ["https://api.acme.com"],
	inputCapture: "secrets-only",
	secretSlots: {
		admin_password: "ADMIN_PASSWORD",
	},
});
```

如果应用尚未配置 OpenTelemetry Provider，可调用 `initSoftprobeReactNative` 自动创建带内置 OTLP HTTP JSON 导出器的 `BasicTracerProvider`：

```ts
import { initSoftprobeReactNative } from "@softprobe/react-native";

export const softprobe = initSoftprobeReactNative({
	endpoint: "https://explorer.softprobe.ai/api/thelake",
	ingestionKey: process.env.EXPO_PUBLIC_SOFTPROBE_KEY,
	platform: "ios",
	serviceName: "acme-mobile",
	launchArguments: initialProps,
	apiOrigins: ["https://api.acme.com"],
	inputCapture: "secrets-only",
});
```

通过 `softprobe.actions` 记录路由切换、文本输入与点击事件：

```ts
softprobe.actions.onNavigationRouteChange("TeamInvite");

softprobe.actions.recordFill(
	{ testId: "email_input", role: "textbox", label: "Teammate email" },
	email,
);

softprobe.actions.recordFill(
	{ testId: "admin_password", role: "textbox", label: "Admin password" },
	password,
	{ secureTextEntry: true },
);

softprobe.actions.recordTap({
	testId: "send_invite_button",
	role: "button",
	name: "Send invite",
});
```

当 `secureTextEntry` 为 `true`、`target.inputPurpose` 为 `"password"` 或 `"one-time-code"`，或者目标控件命中 `secretSlots` 映射时，`recordFill` 只会导出 `{ kind: "secret", slot }`，明文内容不会离开设备。

### 原生 Android 与 OpenTelemetry Java {#path-2-android}

在工程中引入 `ai.softprobe:softprobe-otel-android:0.1.0`，配合 `io.opentelemetry:opentelemetry-sdk`（或 `io.opentelemetry.android:android-agent`）与 `com.squareup.okhttp3:okhttp` 使用。

在 `SdkTracerProvider` 上注册 `SoftprobeAndroidSpanProcessor`，初始化 `SoftprobeUiActionRecorder`，并将 `SoftprobeOkHttpInterceptor` 挂载到 `OkHttpClient`：

```kotlin
import ai.softprobe.otel.android.SoftprobeAndroidSpanProcessor
import ai.softprobe.otel.android.SoftprobeOkHttpInterceptor
import ai.softprobe.otel.android.SoftprobeOtlpHttpJsonSpanExporter
import ai.softprobe.otel.android.SoftprobeUiActionRecorder
import io.opentelemetry.sdk.OpenTelemetrySdk
import io.opentelemetry.sdk.trace.SdkTracerProvider
import io.opentelemetry.sdk.trace.export.BatchSpanProcessor
import okhttp3.OkHttpClient

val spanProcessor = SoftprobeAndroidSpanProcessor.builder()
	.setIntent(intent)
	.setServiceName("acme-android")
	.build()

val exporter = SoftprobeOtlpHttpJsonSpanExporter.builder()
	.setEndpoint("https://explorer.softprobe.ai/api/thelake")
	.setIngestionKey(BuildConfig.SOFTPROBE_INGESTION_KEY)
	.setServiceName("acme-android")
	.build()

val tracerProvider = SdkTracerProvider.builder()
	.addSpanProcessor(spanProcessor)
	.addSpanProcessor(BatchSpanProcessor.builder(exporter).build())
	.build()

val openTelemetry = OpenTelemetrySdk.builder()
	.setTracerProvider(tracerProvider)
	.build()

val tracer = openTelemetry.getTracer("com.acme.invite")

val uiRecorder = SoftprobeUiActionRecorder.builder(tracer)
	.setInitialRoute("/invite")
	.setInputCaptureMode(SoftprobeUiActionRecorder.InputCaptureMode.SECRETS_ONLY)
	.putSecretSlot("admin_password", "ADMIN_PASSWORD")
	.build()

val okHttpClient = OkHttpClient.Builder()
	.addInterceptor(
		SoftprobeOkHttpInterceptor(tracer, spanProcessor::getSessionId, uiRecorder),
	)
	.build()

uiRecorder.instrumentEditText(emailEditText, null)
uiRecorder.instrumentEditText(passwordEditText, "ADMIN_PASSWORD")
uiRecorder.instrumentClickView(sendInviteButton) {
	submitInvite(okHttpClient)
}
```

当测试由 `softprobeMobile` 启动时，`SoftprobeAndroidSpanProcessor` 会自动从 `Intent` Extra 中读取 `sp_session_id`。在手动 QA 或生产环境中则自动生成会话 ID。`SoftprobeUiActionRecorder` 会自动识别 `TYPE_TEXT_VARIATION_PASSWORD`、`TYPE_NUMBER_VARIATION_PASSWORD` 等 Android 密码 `InputType` 标记，在导出前将输入值替换为 `{ kind: "secret", slot }`。

### 原生 iOS 与 OpenTelemetry Swift {#path-2-ios}

添加 `SoftprobeOtelSwift` Swift Package，配合 `open-telemetry/opentelemetry-swift`（`OpenTelemetryApi`、`OpenTelemetrySdk` 与 `URLSessionInstrumentation`）使用。

在 `TracerProviderBuilder` 上注册 `SoftprobeSwiftSpanProcessor`，创建 `SoftprobeUiActionRecorder`，并启用 `SoftprobeURLSessionInstrumentation`：

```swift
import Foundation
import OpenTelemetryApi
import OpenTelemetrySdk
import SoftprobeOtelSwift

let spanProcessor = SoftprobeSwiftSpanProcessor(
	serviceName: "acme-ios",
	arguments: ProcessInfo.processInfo.arguments
)

let tracerProvider = TracerProviderBuilder()
	.add(spanProcessor: spanProcessor)
	.add(spanProcessor: yourOtlpSpanProcessor)
	.build()

OpenTelemetry.registerTracerProvider(tracerProvider: tracerProvider)
let tracer = tracerProvider.get(instrumentationName: "com.acme.invite")

let uiRecorder = SoftprobeUiActionRecorder(
	tracer: { tracer },
	initialRoute: "/invite",
	inputCapture: .secretsOnly,
	secretSlots: ["admin_password": "ADMIN_PASSWORD"]
)

let urlSessionInstrumentation = SoftprobeURLSessionInstrumentation.install(
	sessionIdProvider: { spanProcessor.getSessionId() },
	actionRecorder: uiRecorder
)

uiRecorder.recordFill(
	target: SoftprobeSemanticTarget(
		testId: "email_input",
		role: "textbox",
		label: "Teammate email"
	),
	rawValue: email
)

uiRecorder.recordFill(
	target: SoftprobeSemanticTarget(
		testId: "admin_password",
		role: "textbox",
		label: "Admin password"
	),
	rawValue: password,
	isSecureTextEntry: true,
	secretSlot: "ADMIN_PASSWORD"
)

uiRecorder.recordTap(
	target: SoftprobeSemanticTarget(
		testId: "send_invite_button",
		role: "button",
		name: "Send invite"
	)
)
```

在 `softprobeMobile` 启动应用时，`SoftprobeSwiftSpanProcessor` 会从 `ProcessInfo.processInfo.arguments` 中提取 `-spSessionId`，为所有 span 写入 `sp.session.id` 与 `session.id`，并通过 `SoftprobeURLSessionInstrumentation` 自动注入 `traceparent` 与 `baggage` 请求头，同时在导出前脱敏鉴权与 Cookie 请求头。

### 在 `e2e.config.ts` 中使用会话模式关联路径 2 应用 {#path-2-session-mode}

使用 `@softprobe/e2e/mobile` 驱动已接入路径 2 的客户端时，配置 `correlation: { mode: "session" }` 与 `captureActions: false`，由客户端内的 OpenTelemetry SDK 负责动作采集与链路透传，无需启动本地代理：

```ts
const iosEngine = softprobeMobile({
	platform: "ios",
	captureActions: false,
	correlation: {
		mode: "session",
	},
	sink: {
		kind: "blackbox",
		endpoint:
			process.env.SOFTPROBE_SINK_ENDPOINT ??
			"https://explorer.softprobe.ai/api/thelake",
		token: process.env.SOFTPROBE_TOKEN,
		workspaceId: process.env.SOFTPROBE_WORKSPACE_ID,
	},
});
```

在 `"session"` 模式下，`softprobeMobile` 会在启动 Android 应用时注入 `--es sp_session_id <sessionId>`，在启动 iOS 应用时注入 `-spSessionId <sessionId>`，随后直接从 Blackbox 会话 span 中解析并校验 `trace.outboundHttp` 与 `trace.expectNoOutboundHttp`。

## 使用 Blackbox MCP 生成移动端测试 {#generate-from-sessions}

无论会话由路径 1 还是路径 2 采集，只要包含 `softprobe.ui.action` span，都可以生成确定性测试套件。打开 [Softprobe Explorer](https://explorer.softprobe.ai) 的 **Sessions** 页面复制目标 `session_id`，或直接让编码 Agent 调用 `search_sessions` 检索会话。

在 OpenCode、Claude Code、Cursor、Codex 或 Antigravity 中连接 [Blackbox MCP](/zh/blackbox/coding-agent-skills) 后，编码 Agent 会调用 `get_session_semantic_actions` 读取紧凑的移动端语义动作时间线，并调用 `get_trace` 检查下游后端 HTTP 消息体，在生成代码前自动剔除探索性滑动与带 `[non-interactive]` 标记的无效点击。

### 生成确定性的 `@softprobe/e2e/mobile` 套件 {#generate-e2e-mobile}

让编码 Agent 检查录制好的移动端会话并生成基于定位器的 `@softprobe/e2e/mobile` 测试：

```text
使用 Blackbox 的 get_session_semantic_actions 查看会话 sp-ios-...，
调用 get_trace 检查邀请接口链路，剔除探索性滑动与非交互点击，
为包名 "com.acme.invite" 在 ./mobile-e2e/tests/recorded-invite.e2e.ts 中
编写使用 { app, screen, device, trace } 的确定性 @softprobe/e2e/mobile 测试。
```

编码 Agent 会直接输出调用 `{ app, screen, device, trace }` 的确定性测试文件：

```ts
import { z } from "zod";
import { describe, expect, secrets, test } from "@softprobe/e2e/mobile";

const EmailPayloadSchema = z.object({
	to: z.string().email(),
});

describe("Recorded mobile team invite", () => {
	test("sends an invitation and verifies the downstream email call", async ({
		app,
		screen,
		device,
		trace,
	}) => {
		await app.open();
		expect((await device.foregroundApp()).bundleId).toBe("com.acme.invite");

		await screen.getByTestId("email_input").fill("ada@example.com");
		await screen
			.getByTestId("admin_password")
			.fill(secrets.get("ADMIN_PASSWORD"));
		await screen.getByRole("button", { name: "Send invite" }).tap();

		await expect(
			screen.getByText("Invitation queued for ada@example.com"),
		).toBeVisible();

		const outbound = await trace.outboundHttp({
			triggeredBy: { method: "POST", path: "/api/invites" },
			method: "POST",
			url: /\/v1\/email\/send$/,
			status: 200,
		});

		expect(EmailPayloadSchema.parse(outbound.request.json)).toEqual({
			to: "ada@example.com",
		});
	});
});
```

由于每个步骤都直接调用 `{ app, screen, device, trace }` 定位器而不经过 `agent.act`，该套件在首次本地运行与 CI 中均不需要任何大模型调用、模型 API Key 或 `.e2e/cache/` 缓存文件：

```bash
cd ./mobile-e2e
E2E_TELEMETRY_DISABLED=1 \
SOFTPROBE_TOKEN="YOUR_BLACKBOX_TOKEN" \
SOFTPROBE_WORKSPACE_ID="YOUR_WORKSPACE_ID" \
SP_SECRET_ADMIN_PASSWORD="YOUR_TEST_PASSWORD" \
npx e2e run
```

### 生成 Maestro YAML 流程 {#generate-maestro}

如需从同一条会话生成仅校验客户端界面的 Maestro 流程，可让编码 Agent 写出 `.maestro/*.yaml`：

```text
使用 Blackbox 的 get_session_semantic_actions 查看会话 sp-ios-...，
剔除探索性滑动与非交互点击，将敏感槽位保留为 ${SP_SECRET_<SLOT>} 环境变量，
为 appId "com.acme.invite" 编写 .maestro/team-invite.yaml 流程文件。
```

编码 Agent 会生成 `.maestro/team-invite.yaml`：

```yaml
appId: com.acme.invite
---
- launchApp
- tapOn:
    id: "email_input"
- inputText: "ada@example.com"
- tapOn:
    id: "admin_password"
- inputText: ${SP_SECRET_ADMIN_PASSWORD}
- hideKeyboard
- tapOn: "Send invite"
- assertVisible: "Invitation queued for ada@example.com"
```

通过 `--env` 注入捕获的敏感槽位并运行 Maestro 流程：

```bash
maestro test \
	--env SP_SECRET_ADMIN_PASSWORD="YOUR_TEST_PASSWORD" \
	.maestro/
```

## 相关文档 {#related}

- [如何从录制的会话生成 UI 测试](/zh/ui-testing/from-sessions)
- [如何用 `e2e` 编写自然语言 UI 测试](/zh/ui-testing/natural-language)
- [`@softprobe/e2e/mobile` 参考](/zh/blackbox/reference/softprobe-js#softprobe-e2e-mobile)
- [`@softprobe/react-native` 参考](/zh/blackbox/reference/softprobe-js#softprobe-react-native)
