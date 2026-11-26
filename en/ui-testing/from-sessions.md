---
title: How to generate UI tests from recorded sessions
---

# How to generate UI tests from recorded sessions

Record a user flow once in [Softprobe Explorer](https://explorer.softprobe.ai), ask your coding agent to generate a deterministic `@playwright/test` + `@softprobe/e2e` test suite with Blackbox MCP, and verify both UI behavior and outgoing backend HTTP requests in CI.

`@softprobe/web-record` records semantic browser actions as `softprobe.ui.action` OpenTelemetry spans alongside W3C `traceparent` headers. `@softprobe/e2e` turns those spans into repeatable browser steps and checks the downstream `CLIENT` HTTP calls that your backend sent in Blackbox.

> [!NOTE] Requires frontend instrumentation
> Generating tests from recorded sessions relies on `softprobe.ui.action` spans emitted by `@softprobe/web-record`, `@softprobe/react-native`, `softprobe-otel-android`, or `SoftprobeOtelSwift`. If you want to test an unmodified app without installing a frontend SDK, see [With vs. without frontend instrumentation](/en/ui-testing/frontend-instrumentation) and [Write natural-language UI tests with `e2e`](/en/ui-testing/natural-language).

## Enable semantic action capture {#enable-capture}

1. In [Softprobe Explorer](https://explorer.softprobe.ai), open **Agents** and click **+ Connect agent**. Copy the **Connect Agent** setup prompt for your web application and backend.

2. Initialize [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record) in your browser entrypoint with `captureSemanticActions: true` and `inputCapture: "secrets-only"`:

	```ts
	import { RecordSdk } from "@softprobe/web-record";

	RecordSdk.init({
		ingestionKey: "spk_REPLACE_WITH_INGESTION_KEY",
		serviceName: "my-web",
		captureSemanticActions: true,
		inputCapture: "secrets-only",
		secretSlots: {
			'input[name="apiKey"]': "API_KEY",
		},
	});
	```

	Explorer's **Connect Agent** snippet enables both options by default. With `inputCapture: "secrets-only"`, standard form inputs keep their typed text for test generation. Password, payment-card, one-time-code, token, secret, and `secretSlots` inputs emit `{ kind: "secret", slot }` references so raw credentials never leave the browser.

	If you load the UMD bundle from HTML without a bundler, pass `data-capture-semantic-actions="true"` and `data-input-capture="secrets-only"` on the `<script>` tag:

	```html
	<script
		src="https://unpkg.com/@softprobe/web-record/dist/browser.js"
		data-ingestion-key="spk_REPLACE_WITH_INGESTION_KEY"
		data-capture-semantic-actions="true"
		data-input-capture="secrets-only"
		defer
	></script>
	```

3. Export OpenTelemetry HTTP spans or attach official OpenTelemetry OBI on your backend with the same Ingestion Key. See [End-to-end session tracing with payloads](/en/blackbox/end-to-end-session-tracing) for backend setup. If your browser calls a cross-origin API, allow `traceparent` in `Access-Control-Allow-Headers`.

## Generate a test with Blackbox MCP {#generate-test}

Walk through the user flow once in your browser, then open **Sessions** in Softprobe Explorer to copy the `session_id`, or ask your coding agent to find it with `search_sessions`.

With [Blackbox MCP](/en/blackbox/coding-agent-skills) connected in OpenCode, Claude Code, Cursor, Codex, or Antigravity, ask your coding agent to inspect the semantic action history and generate a Playwright test:

```text
Use Blackbox get_session_semantic_actions on session ses_01J....
Inspect the booking and payment traces with get_trace, prune any stray
non-interactive clicks or retried failed requests, and write a clean
@playwright/test + @softprobe/e2e test in ./e2e against http://127.0.0.1:3000.
```

`get_session_semantic_actions` returns a compact timeline segmented into user flows with CSS and WAI-ARIA locators, `[non-interactive]` noise tags, and caused `trace_id`s with HTTP status and one-line downstream summaries. Your coding agent then calls `get_trace(trace_id)` on selected traces to inspect full request and response bodies and write deterministic `trace.outboundHttp` assertions.

## Run generated test suites {#run-suites}

Install `@softprobe/e2e`, `@playwright/test`, and `zod` in your test directory:

```bash
npm install -D @softprobe/e2e @playwright/test zod
npx playwright install chromium
```

Pass every captured secret slot as `SP_SECRET_<SLOT>` alongside your Blackbox query credentials, then run Playwright:

```bash
SOFTPROBE_TOKEN="YOUR_BLACKBOX_TOKEN" \
SOFTPROBE_WORKSPACE_ID="YOUR_WORKSPACE_ID" \
SP_SECRET_PASSWORD="YOUR_TEST_PASSWORD" \
npx playwright test
```

The generated `playwright.config.ts` configures `@softprobe/e2e/playwright` under `use.softprobe` so every browser request carries a correlated W3C `traceparent` header and `trace.outboundHttp` queries `BlackboxSink` with zero LLM calls and zero `.e2e/cache/` files.

To generate deterministic `@softprobe/e2e/mobile` or Maestro suites from iOS and Android sessions, see [How to test iOS and Android apps](/en/ui-testing/mobile#generate-from-sessions). To author prompt-driven `agent.act` suites cached into `.e2e/cache/` instead, see [How to write natural-language UI tests with `e2e`](/en/ui-testing/natural-language).

## Assert backend outbound HTTP calls and clean up state {#outbound-assertions}

Configure `BlackboxSink` in `playwright.config.ts` to verify what your backend sent to external services during each browser action. Clean up created records in `afterEach` so repeated runs stay idempotent.

`playwright.config.ts` with `BlackboxSink`:

```ts
import { defineConfig } from "@playwright/test";
import type { SoftprobePlaywrightFixtures } from "@softprobe/e2e/playwright";

export default defineConfig<SoftprobePlaywrightFixtures>({
	testDir: "./tests",
	fullyParallel: false,
	retries: 0,
	use: {
		baseURL: process.env.APP_URL ?? "http://127.0.0.1:5179",
		headless: true,
		softprobe: {
			sink: {
				kind: "blackbox",
				endpoint:
					process.env.SOFTPROBE_SINK_ENDPOINT ??
					"https://explorer.softprobe.ai/api/thelake",
				token: process.env.SOFTPROBE_TOKEN,
				workspaceId: process.env.SOFTPROBE_WORKSPACE_ID,
				explorerUrl:
					process.env.SOFTPROBE_EXPLORER_URL ?? "https://explorer.softprobe.ai",
			},
		},
	},
});
```

In your test, import `{ expect, test } from "@softprobe/e2e/playwright"`. Call `trace.outboundHttp` to assert a downstream `CLIENT` HTTP request and its redacted JSON body. Call `trace.expectNoOutboundHttp` to confirm that rejected requests trigger zero downstream calls, and delete test mutations in `test.afterEach`:

```ts
import { z } from "zod";
import { expect, test } from "@softprobe/e2e/playwright";

const EmailPayloadSchema = z.object({
	to: z.array(z.object({ address: z.string().email() })).min(1),
	subject: z.string(),
});

test.describe("workspace invitations", () => {
	test.afterEach(async ({ page }) => {
		await page.evaluate(async (targetEmail: string) => {
			const wsRes = await fetch("/api/workspaces");
			const wsJson = (await wsRes.json()) as { workspaces?: Array<{ id: string }> };
			for (const ws of wsJson.workspaces ?? []) {
				const invRes = await fetch(`/api/workspaces/${ws.id}/invites`);
				const invJson = (await invRes.json()) as {
					invites?: Array<{ id: string; email: string }>;
				};
				for (const inv of invJson.invites ?? []) {
					if (inv.email === targetEmail) {
						await fetch(`/api/workspaces/${ws.id}/invites/${inv.id}`, {
							method: "DELETE",
						});
					}
				}
			}
		}, "lc@softprobe.ai");
	});

	test("invites a teammate and sends one outbound email request", async ({
		page,
		trace,
	}) => {
		await page.goto("/");
		await page.getByRole("button", { name: "Members" }).click();
		await page.getByLabel("Email address").fill("lc@softprobe.ai");

		const inviteResponse = page.waitForResponse(
			(res) =>
				res.request().method() === "POST" &&
				/\/api\/workspaces\/[^/]+\/invites$/.test(new URL(res.url()).pathname),
		);
		await page.getByRole("button", { name: "Send invitation" }).click();
		await inviteResponse;

		await expect(page.getByText("lc@softprobe.ai")).toBeVisible();

		const emailCall = await trace.outboundHttp({
			triggeredBy: {
				method: "POST",
				path: "/api/workspaces/:workspaceId/invites",
			},
			method: "POST",
			url: /\/v1\/account\/invite\/submit$/,
			status: 200,
		});

		const payload = EmailPayloadSchema.parse(emailCall.request.json);
		expect(payload.to).toEqual([{ address: "lc@softprobe.ai" }]);
		expect(emailCall.request.text ?? "").toContain("/invite/[REDACTED]");
	});

	test("sends no outbound email when inviting an active member returns 409", async ({
		page,
		trace,
	}) => {
		await page.goto("/");
		await page.getByRole("button", { name: "Members" }).click();
		await page.getByLabel("Email address").fill("owner@example.com");
		await page.getByRole("button", { name: "Send invitation" }).click();

		await expect(page.getByRole("alert")).toContainText(
			"already an active workspace member",
		);

		await trace.expectNoOutboundHttp({
			triggeredBy: {
				method: "POST",
				path: "/api/workspaces/:workspaceId/invites",
			},
		});
	});
});
```

If one test calls the same backend route multiple times, wrap the step in `trace.window` so `outboundHttp` or `expectNoOutboundHttp` inspects only requests sent inside that callback:

```ts
const resendTrace = await trace.window(async () => {
	await page.getByRole("button", { name: "Resend invitation" }).click();
});

const resentCall = await resendTrace.outboundHttp({
	triggeredBy: {
		method: "POST",
		path: "/api/workspaces/:workspaceId/invites",
	},
	method: "POST",
	url: /\/v1\/account\/invite\/submit$/,
	status: [200, 299],
});
expect(resentCall.status).toBe(200);
```

## Troubleshoot trace verification {#troubleshoot}

`BlackboxSink` waits for the backend `SERVER` entry span before checking outgoing `CLIENT` spans so instrumentation issues stay separate from assertion failures:

- **`TraceInstrumentationError` with code `TRACE_INSTRUMENTATION_MISSING`.** The browser sent `traceparent`, and Blackbox did not receive a matching backend `SERVER` span within `pollTimeoutMs` (default `30000` milliseconds). Confirm that your backend exports OTLP traces or runs with OpenTelemetry OBI. Check `SOFTPROBE_WORKSPACE_ID` and `SOFTPROBE_TOKEN`, and allow `traceparent` in `Access-Control-Allow-Headers` on cross-origin APIs.
- **`TraceAssertionError` with code `TRACE_ASSERTION_FAILED`.** The backend `SERVER` span arrived in Blackbox, and either no outgoing `CLIENT` HTTP span matched `trace.outboundHttp` or an unexpected call matched `trace.expectNoOutboundHttp`. Open the `explorerTraceUrl` printed in the error message, or inspect the trace with `get_trace` in [Blackbox MCP](/en/blackbox/coding-agent-skills).

## Related {#related}

- [Tutorial: Build your first generated UI and backend test](/en/ui-testing/tutorial)
- [How to write natural-language UI tests with `e2e`](/en/ui-testing/natural-language)
- [JavaScript and TypeScript SDK reference](/en/blackbox/reference/softprobe-js#softprobe-e2e)
