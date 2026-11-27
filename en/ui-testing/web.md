---
title: How to test web applications
---

# How to test web applications

New to UI testing? [Write your first test for a travel web app](/en/ui-testing/classic-web-first-test). It checks the page without backend tracing.

Test web applications with Playwright tests generated from recorded browser sessions or plain-English `agent.act` tests. You can check the page alone or add backend request checks with Softprobe.

<video controls playsinline muted preload="metadata" style="width: 100%; max-width: 820px; border-radius: 8px; margin: 16px 0;" src="/videos/web-ui-testing.mp4"></video>

## Choose your web workflow {#choose-workflow}

| Goal | Frontend SDK needed? | Authoring tool | Guide |
|---|---|---|---|
| Record a real user flow and generate Playwright tests | Yes (`@softprobe/web-record`) | Blackbox MCP + coding agent | [Generate from recorded sessions](/en/ui-testing/from-sessions) |
| Write plain-English `agent.act` tests against an unmodified app | No (`softprobeWeb`) | `e2e` + `.e2e/cache/` | [Write in plain English](/en/ui-testing/natural-language) |
| Add `trace.outboundHttp` to an existing Playwright suite | No (`@softprobe/e2e/playwright`) | `@playwright/test` | [Playwright fixture setup](#playwright-fixture) |

See [how to choose a capture path](/en/ui-testing/frontend-instrumentation) for the setup each approach needs.

## Option A: `@playwright/test` with `@softprobe/e2e/playwright` {#playwright-fixture}

If you already maintain a Playwright suite or generated tests from a recorded session, configure `use.softprobe` in `playwright.config.ts`:

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

Import `{ expect, test } from "@softprobe/e2e/playwright"` in your spec files so `trace.outboundHttp` and `trace.expectNoOutboundHttp` verify what your backend sent during each browser request.

## Option B: Plain-English `e2e` with `softprobeWeb` {#e2e-web}

Use `softprobeWeb` in `e2e.config.ts` to run `agent.act(...)` steps against an unmodified web app, record `.e2e/cache/` once locally, and replay in CI with `CI=true` and zero LLM calls. Follow [How to write natural-language UI tests with `e2e`](/en/ui-testing/natural-language) for the complete setup.

## Cross-origin APIs and CORS {#cors}

When your web frontend calls an API on a different origin (for example `http://localhost:5173` calling `http://localhost:8080`), `@softprobe/web-record`, `softprobeWeb`, and `@softprobe/e2e/playwright` attach W3C `traceparent` and `baggage` headers to outgoing requests. Configure your backend CORS response headers to allow them:

```text
Access-Control-Allow-Headers: Content-Type, Authorization, traceparent, baggage
```

## Related {#related}

- [Tutorial: Build your first generated UI and backend test](/en/ui-testing/tutorial)
- [With vs. without frontend instrumentation](/en/ui-testing/frontend-instrumentation)
- [Generate tests from recorded sessions](/en/ui-testing/from-sessions)
- [Write natural-language UI tests with `e2e`](/en/ui-testing/natural-language)
