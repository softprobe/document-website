---
title: How to test iOS and Android apps
---

# How to test iOS and Android apps

Automate iOS and Android UI tests and optionally check what your backend sent to downstream services. The runner can replay cached `agent.act` steps in CI. A coding agent can also use recorded mobile actions through Blackbox MCP to write `@softprobe/e2e/mobile` or Maestro tests.

The examples on this page illustrate backend checks using an invitation app; they are not a standalone demo. A separate UI-only mobile walkthrough is not yet available.

Both mobile capture paths can export `softprobe.ui.action` spans to a configured sink. Host capture observes actions driven by the test engine. The in-app SDK path can also capture manual or real-user sessions; its examples instrument specific actions and controls. Backend assertions require correlated backend telemetry. See [how to choose a capture path](/en/ui-testing/frontend-instrumentation) for a comparison.

<video controls playsinline muted preload="metadata" style="width: 100%; max-width: 820px; border-radius: 8px; margin: 16px 0;" src="/videos/mobile-ui-testing.mp4"></video>

## Choose a capture path {#choose-path}

Pick the capture path that matches how your mobile app is built and where it runs:

| Criterion | Path 1, zero-SDK `agent.act` + proxy mode | Path 2, OpenTelemetry SDK plugins + session mode |
|-----------|-------------------------------------------|--------------------------------------------------|
| **Mobile app code changes** | No SDK is required. Proxy-based checks require the app to accept the proxy URL at launch. | Registers a Softprobe `SpanProcessor` and UI and HTTP hooks on your OpenTelemetry SDK. |
| **`softprobeMobile` correlation** | `correlation: { mode: "proxy", upstreamOrigin }` | `correlation: { mode: "session" }` |
| **Trace and session propagation** | A local reverse proxy adds W3C `traceparent` and `baggage` to requests routed through it. | In-app `fetch`, `OkHttp`, or `URLSession` instrumentation injects W3C `traceparent` and `baggage` headers directly. |
| **Where actions are captured** | During a test driven by the host engine on a supported device or simulator. | In the instrumented app, including manual QA or real-user sessions. |
| **Action span fidelity** | Exports `sp.ui.action.capture_source: "host_agent"` by diffing OS accessibility trees over ADB UiAutomator and XCTest. | Exports `sp.ui.action.capture_source: "otel_sdk"` from in-process React Native, Android `View`, and iOS controls. |

Start with Path 1 when the app can use the proxy address provided at launch. Choose Path 2 when you need in-app capture, including manual QA sessions.

## Test without an in-app SDK with Path 1 {#path-1}

### Install host packages {#path-1-install}

On Node.js 22.13 or newer, install `@softprobe/e2e`, `e2e`, `@e2e-dev/mobile`, `zod`, and an AI SDK model provider package such as `@ai-sdk/openai` for recording uncached steps:

```bash
npm install -D @softprobe/e2e e2e@0.24.0 @e2e-dev/mobile@0.12.8 @ai-sdk/openai zod
```

Boot an Android Emulator visible in `adb devices` or a macOS iOS Simulator visible in `xcrun simctl list devices booted`. Export OpenTelemetry HTTP spans or attach official OpenTelemetry OBI on your backend with your workspace Ingestion Key, as shown in [End-to-end session tracing with payloads](/en/blackbox/end-to-end-session-tracing).

### Configure `softprobeMobile` in proxy mode {#path-1-config}

Create `e2e.config.ts`. Set `correlation.mode` to `"proxy"` with your backend `upstreamOrigin`. Locally, pass `mobileTools(androidEngine)` alongside your model to record new steps into `.e2e/cache/`. In CI, switch to `softprobeCachedAgent()` and `"read-only"` cache mode so runs execute with zero model calls:

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
		softprobeApiKey: process.env.SOFTPROBE_API_KEY,
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

During each test attempt, `softprobeMobile` starts an ephemeral plain-HTTP reverse proxy on `127.0.0.1` and injects the proxy URL into `app.launchArguments`:

- On Android, `softprobeMobile` runs `adb reverse tcp:<port> tcp:<port>` unless `correlation.adbReverse` is `false`, and appends `--es api_base_url http://127.0.0.1:<port>` to the launch intent. Set `correlation.launchArgKey` if your `Activity` reads a different string extra key.
- On iOS Simulator, `softprobeMobile` appends `-API_BASE_URL http://127.0.0.1:<port>` to process launch arguments, which `UserDefaults.standard.string(forKey: "API_BASE_URL")` reads directly. Set `correlation.launchArgKey` to customize the flag name.

### Write an `agent.act` test with backend trace checks {#path-1-test}

Create `tests/invite-mobile.e2e.ts`. Import `{ describe, expect, secrets, test }` from `@softprobe/e2e/mobile`, verify visible screen state after each `agent.act` step, and assert downstream backend HTTP side effects with `trace.outboundHttp` and `trace.expectNoOutboundHttp`:

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

Passing `secrets.get("ADMIN_PASSWORD")` substitutes the credential only at execution time. Both `.e2e/cache/*.json` on disk and exported `softprobe.ui.action` spans in Blackbox store `{ kind: "secret", slot: "ADMIN_PASSWORD" }` with zero plaintext credentials.

### Record once locally and replay in CI with zero LLM calls {#path-1-replay}

1. Run the suite once locally with a model API key to record `.e2e/cache/<sha256>.json` and export `softprobe.ui.action` spans to Blackbox:

	```bash
	E2E_TELEMETRY_DISABLED=1 \
	OPENAI_API_KEY="sk-..." \
	SOFTPROBE_API_KEY="YOUR_SOFTPROBE_API_KEY" \
	SP_SECRET_ADMIN_PASSWORD="YOUR_TEST_PASSWORD" \
	npx e2e run
	```

2. Re-run with `CI=true` and no `OPENAI_API_KEY` to verify deterministic zero-LLM replay:

	```bash
	CI=true \
	E2E_TELEMETRY_DISABLED=1 \
	SOFTPROBE_API_KEY="YOUR_SOFTPROBE_API_KEY" \
	SP_SECRET_ADMIN_PASSWORD="YOUR_TEST_PASSWORD" \
	npx e2e run
	```

3. Confirm `"modelTokens": 0` in `.e2e/report.json`, then commit `tests/` and `.e2e/cache/` to Git.

## Instrument your app with OpenTelemetry in Path 2 {#path-2}

Path 2 extends official CNCF OpenTelemetry SDKs inside React Native, Android, and iOS apps. Each extension stamps `sp.session.id` and `session.id` onto spans, injects W3C `traceparent` and `baggage` (`sp.session.id`) headers onto outgoing HTTP requests, and emits `softprobe.ui.action` spans with `sp.ui.action.capture_source: "otel_sdk"`.

### React Native and Expo {#path-2-react-native}

Install `@softprobe/react-native` alongside `@opentelemetry/api` and `@opentelemetry/sdk-trace-base`:

```bash
npm install @softprobe/react-native @opentelemetry/api @opentelemetry/sdk-trace-base
```

If your app already configures a `BasicTracerProvider` or `WebTracerProvider`, call `installSoftprobeReactNative` so Softprobe shares your existing provider and exporter:

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

If your app does not configure its own OpenTelemetry provider yet, call `initSoftprobeReactNative` to initialize a `BasicTracerProvider` with built-in OTLP HTTP JSON export:

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

Record navigation transitions, text entry, and taps through `softprobe.actions`:

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

When `secureTextEntry` is `true`, `target.inputPurpose` is `"password"` or `"one-time-code"`, or a key in `secretSlots` matches the target, `recordFill` exports `{ kind: "secret", slot }` and never transmits the raw value.

### Native Android with OpenTelemetry Java {#path-2-android}

Add `ai.softprobe:softprobe-otel-android:0.1.0` alongside `io.opentelemetry:opentelemetry-sdk` or `io.opentelemetry.android:android-agent` and `com.squareup.okhttp3:okhttp`.

Register `SoftprobeAndroidSpanProcessor` on your `SdkTracerProvider`, create a `SoftprobeUiActionRecorder`, and attach `SoftprobeOkHttpInterceptor` to `OkHttpClient`:

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
	.setIngestionKey(BuildConfig.INGESTION_KEY)
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

`SoftprobeAndroidSpanProcessor` reads `sp_session_id` from `Intent` extras automatically when launched by `softprobeMobile`, or generates a session ID for manual QA and production sessions. `SoftprobeUiActionRecorder` detects Android password `InputType` flags such as `TYPE_TEXT_VARIATION_PASSWORD` and `TYPE_NUMBER_VARIATION_PASSWORD` and replaces raw text with `{ kind: "secret", slot }` before span export.

### Native iOS with OpenTelemetry Swift {#path-2-ios}

Add the `SoftprobeOtelSwift` Swift Package alongside `open-telemetry/opentelemetry-swift` (`OpenTelemetryApi`, `OpenTelemetrySdk`, and `URLSessionInstrumentation`).

Register `SoftprobeSwiftSpanProcessor` on `TracerProviderBuilder`, create `SoftprobeUiActionRecorder`, and install `SoftprobeURLSessionInstrumentation`:

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

`SoftprobeSwiftSpanProcessor` extracts `-spSessionId` from `ProcessInfo.processInfo.arguments` when launched under `softprobeMobile`, stamps `sp.session.id` and `session.id` onto every span, and pairs with `SoftprobeURLSessionInstrumentation` to inject `traceparent` and `baggage` headers while scrubbing authorization and cookie headers from exported span attributes.

### Pair Path 2 apps with session mode {#path-2-session-mode}

When testing a Path 2 build with `@softprobe/e2e/mobile`, set `correlation: { mode: "session" }` and `captureActions: false` so the in-app OpenTelemetry SDK owns UI action capture and trace propagation without starting a localhost proxy:

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
		softprobeApiKey: process.env.SOFTPROBE_API_KEY,
	},
});
```

In `"session"` mode, `softprobeMobile` injects `--es sp_session_id <sessionId>` on Android and `-spSessionId <sessionId>` on iOS at launch, then resolves `trace.outboundHttp` and `trace.expectNoOutboundHttp` directly from the correlated Blackbox session spans.

## Generate mobile tests with Blackbox MCP {#generate-from-sessions}

A coding agent can use a mobile session containing `softprobe.ui.action` spans from Path 1 or Path 2 to draft a test suite. Review and run the generated test before relying on it. Open **Sessions** in [Softprobe Explorer](https://explorer.softprobe.ai) to copy the `session_id`, or ask your coding agent to find it with `search_sessions`.

With [Blackbox MCP](/en/blackbox/coding-agent-skills) connected in OpenCode, Claude Code, Cursor, Codex, or Antigravity, your coding agent calls `get_session_semantic_actions` to read the compact mobile action timeline and `get_trace` to inspect downstream backend HTTP bodies, pruning exploratory swipes and `[non-interactive]` taps before writing the test.

### Generate a locator-based `@softprobe/e2e/mobile` suite {#generate-e2e-mobile}

Ask your coding agent to inspect the recorded mobile session and write a locator-driven `@softprobe/e2e/mobile` test:

```text
Use Blackbox get_session_semantic_actions on session sp-ios-....
Inspect the invite trace with get_trace, prune any exploratory swipes or
non-interactive taps, and write a deterministic @softprobe/e2e/mobile test in
./mobile-e2e/tests/recorded-invite.e2e.ts for bundle "com.acme.invite" using
{ app, screen, device, trace }.
```

For example, the agent may draft a test that uses `{ app, screen, device, trace }` directly:

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

This example uses `{ app, screen, device, trace }` directly without `agent.act`, so running these steps does not require model calls, a model API key, or `.e2e/cache/` files. Generation still requires a coding agent; review the generated test and run it against your app:

```bash
cd ./mobile-e2e
E2E_TELEMETRY_DISABLED=1 \
SOFTPROBE_API_KEY="YOUR_SOFTPROBE_API_KEY" \
SP_SECRET_ADMIN_PASSWORD="YOUR_TEST_PASSWORD" \
npx e2e run
```

### Generate a Maestro YAML flow {#generate-maestro}

To generate a UI-only Maestro flow from the same recorded session, ask your coding agent to emit `.maestro/*.yaml`:

```text
Use Blackbox get_session_semantic_actions on session sp-ios-....
Prune any exploratory swipes or non-interactive taps, preserve captured secret
slots as ${SP_SECRET_<SLOT>} variables, and write a Maestro flow at
.maestro/team-invite.yaml for appId "com.acme.invite".
```

The agent writes `.maestro/team-invite.yaml`:

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

Run the generated Maestro flow with captured secret slots passed through `--env`:

```bash
maestro test \
	--env SP_SECRET_ADMIN_PASSWORD="YOUR_TEST_PASSWORD" \
	.maestro/
```

## Related {#related}

- [How to generate UI tests from recorded sessions](/en/ui-testing/from-sessions)
- [How to write natural-language UI tests with `e2e`](/en/ui-testing/natural-language)
- [`@softprobe/e2e/mobile` reference](/en/blackbox/reference/softprobe-js#softprobe-e2e-mobile)
- [`@softprobe/react-native` reference](/en/blackbox/reference/softprobe-js#softprobe-react-native)
