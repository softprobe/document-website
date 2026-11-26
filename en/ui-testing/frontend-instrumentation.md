---
title: With vs. without frontend instrumentation
---

# With vs. without frontend instrumentation

Softprobe UI Testing supports two capture modes across web and mobile applications:

- **Without frontend instrumentation (proxy or browser-hook mode).** `@softprobe/e2e` injects W3C `traceparent` and `baggage` headers at the browser or mobile network boundary without modifying your application code.
- **With frontend instrumentation (SDK mode).** You install [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record), [`@softprobe/react-native`](/en/blackbox/reference/softprobe-js#softprobe-react-native), `ai.softprobe:softprobe-otel-android`, or `SoftprobeOtelSwift` inside your app so the client emits semantic UI action spans (`softprobe.ui.action`), screenshots, and native trace context.

Both modes work with either authoring workflow: [generated from recorded sessions](/en/ui-testing/from-sessions) or [written in plain English with `agent.act`](/en/ui-testing/natural-language).

## Side-by-side comparison {#comparison}

| Capability | Without frontend instrumentation | With frontend instrumentation |
|---|---|---|
| App code changes required | **None** (tests run against unmodified builds) | Add one SDK init block in your app entrypoint |
| Backend `trace.outboundHttp` & `trace.expectNoOutboundHttp` | Yes (during test runs) | Yes (during test runs and live sessions) |
| Zero-LLM `.e2e/cache/` CI replay (`agent.act`) | Yes | Yes |
| `explorerTraceUrl` printed on test failure | Yes | Yes |
| `softprobe.ui.action` semantic spans in Explorer | No | **Yes** |
| Generate tests from recorded user sessions (Blackbox MCP) | No (use `agent.act` instead) | **Yes** (`get_session_semantic_actions` + `get_trace`) |
| Screenshots & navigation route names in Explorer | No | **Yes** |
| Source-level `SP_SECRET_<SLOT>` password/card redaction | Runtime `secrets.get()` only | **Yes** (automated in SDK + generated tests) |
| Mobile `traceparent` without MITM proxy / CA cert | No (requires `softprobeMobile` HTTP proxy) | **Yes** (in-process OkHttp / `URLProtocol` / `fetch`) |

## What you gain with frontend instrumentation {#benefits}

1. **Generate deterministic tests from real user sessions.** When your web or mobile app runs with a Softprobe frontend SDK, every click, tap, text entry, and screen transition is recorded as a `softprobe.ui.action` OpenTelemetry span. Coding agents call `get_session_semantic_actions` and `get_trace` via [Blackbox MCP](/en/blackbox/coding-agent-skills) to turn a recorded session into `@playwright/test`, `@softprobe/e2e/mobile`, or Maestro tests with zero manual selector hunting.
2. **See the full client-to-backend story in Explorer.** Softprobe Explorer pairs each backend `CLIENT` HTTP call with the exact UI action, CSS/accessibility selector, screen route name, and `ui_action` screenshot that triggered it.
3. **Redact sensitive fields at the source.** Setting `inputCapture: "secrets-only"` with `secretSlots` replaces passwords, cards, and one-time codes with `{ kind: "secret", slot }` before telemetry leaves the device. Generated tests read `SP_SECRET_<SLOT>` from the environment.
4. **Skip proxy and CA certificate friction on mobile.** Native Android (`SoftprobeHttpInterceptor`), native iOS (`SoftprobeURLProtocol`), and React Native (`@softprobe/react-native`) propagate `traceparent` directly from the app process, so staging and production builds trace cleanly without a local MITM proxy.

## Working examples {#examples}

### 1. Web without frontend instrumentation (`agent.act` + `trace.outboundHttp`) {#example-web-uninstrumented}

Use `softprobeWeb` when you want to test an existing web app immediately without editing frontend code. `@softprobe/e2e` intercepts browser requests, adds `traceparent` and `baggage`, runs `agent.act`, and asserts downstream backend calls:

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

test("invites teammate without frontend SDK", async ({ agent, app, screen, trace }) => {
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

### 2. Web with `@softprobe/web-record` (session capture + generated Playwright) {#example-web-instrumented}

Initialize `@softprobe/web-record` once in your frontend entrypoint. Every user session now emits `softprobe.ui.action` spans and `traceparent` headers:

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

Walk through your flow in the browser, then prompt your coding agent via Blackbox MCP:

```text
Use Blackbox get_session_semantic_actions on ses_01J....
Inspect the traces with get_trace and generate a @playwright/test + @softprobe/e2e test.
```

The agent produces a deterministic Playwright test with zero LLM calls at runtime:

```ts
// tests/invite.spec.ts
import { expect, test } from "@softprobe/e2e/playwright";

test("generated from recorded session", async ({ page, trace }) => {
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

### 3. Mobile without frontend instrumentation (`softprobeMobile` proxy mode) {#example-mobile-uninstrumented}

Test an unmodified `.apk` or `.app` binary on an Android emulator or iOS simulator. `softprobeMobile` starts a local HTTP proxy (`mode: "proxy"` by default), configures the device proxy, injects `traceparent` and `baggage`, and correlates backend spans:

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

### 4. Mobile with OpenTelemetry SDKs (React Native, Android, iOS) {#example-mobile-instrumented}

Add the platform SDK to capture `softprobe.ui.action` spans, screenshots, and in-process `traceparent` headers, then run `softprobeMobile` with `mode: "session"` or generate deterministic tests via Blackbox MCP:

- **React Native:** Call `initSoftprobeReactNative({ ingestionKey: process.env.INGESTION_KEY, serviceName: "my-rn-app", captureSemanticActions: true })` to auto-instrument `fetch`, `XMLHttpRequest`, React Navigation, and touch/text responders.
- **Native Android:** Add `ai.softprobe:softprobe-otel-android`, install `SoftprobeHttpInterceptor` on `OkHttpClient`, and attach `SoftprobeUiAction.install(application)`.
- **Native iOS:** Add `SoftprobeOtelSwift`, register `SoftprobeURLProtocol` on `URLSessionConfiguration`, and call `SoftprobeUIAction.install()`.

See [Test iOS, Android, and React Native apps](/en/ui-testing/mobile) for full installation snippets and session-mode configuration.

## Related {#related}

- [Softprobe UI Testing overview](/en/ui-testing/)
- [Generate tests from recorded sessions](/en/ui-testing/from-sessions)
- [Write natural-language UI tests with `e2e`](/en/ui-testing/natural-language)
- [Test Web apps](/en/ui-testing/web)
- [Test iOS, Android, and React Native apps](/en/ui-testing/mobile)
