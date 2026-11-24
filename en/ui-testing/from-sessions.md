---
title: How to generate UI tests from recorded sessions
---

# How to generate UI tests from recorded sessions

Record a user flow once in [Softprobe Explorer](https://explorer.softprobe.ai), compile the captured session into a `@playwright/test` or `e2e` test suite, and verify both UI behavior and outgoing backend HTTP requests in CI.

`@softprobe/web-record` records semantic browser actions as `softprobe.ui.action` OpenTelemetry spans alongside W3C `traceparent` headers. `@softprobe/e2e` turns those spans into repeatable browser steps and checks the downstream `CLIENT` HTTP calls that your backend sent in Blackbox.

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

## Compile a recorded session into a test {#compile-session}

Walk through the user flow once in your browser, then open **Sessions** in Softprobe Explorer and select the recorded session. You can compile that session into a test suite from Explorer, from your coding agent, or from the terminal.

### Export in one click from Explorer {#export-from-explorer}

When a session contains `softprobe.ui.action` spans, Explorer displays a **Generate E2E test** button in the session detail header.

1. Click **Generate E2E test** to open the export drawer.
2. Select **Playwright (@playwright/test)** to preview a `.spec.ts` test, or select **AI cached (@softprobe/e2e)** to preview a `.e2e.ts` test.
3. Inspect the generated browser steps, `SP_SECRET_<SLOT>` bindings, and `trace.outboundHttp` assertions. Click **Copy test** or **Download** to save the test file, or click **Copy command** to copy a pre-filled `softprobe-compile-session` command that writes the full suite including `playwright.config.ts`, `e2e.config.ts`, and `.e2e/cache/*.json`.

### Compile from a coding agent with Blackbox MCP {#compile-from-mcp}

If you use Claude Code, Cursor, Codex, or Antigravity connected to [Blackbox MCP](/en/blackbox/coding-agent-skills), ask your agent to compile the session with `compile_session_test`:

```text
Use Blackbox compile_session_test on session ses_01J... with runner "playwright"
and target_url "http://127.0.0.1:3000", then write the generated files into ./e2e.
```

`compile_session_test` accepts `session_id`, `runner` set to `"playwright"` or `"e2e"`, and an optional `target_url`. It returns the compiled test and configuration files, the required `SP_SECRET_<SLOT>` environment variable names, and the pre-seeded `.e2e/cache/` `trace-1` entries when `runner` is `"e2e"`.

### Compile from the terminal {#compile-from-cli}

On Node.js 22.13 or newer, run `softprobe-compile-session` with `npx`:

```bash
export SOFTPROBE_API_KEY="YOUR_SOFTPROBE_API_KEY"

npx --package=@softprobe/e2e@0.2.8 softprobe-compile-session \
	--session-id <sessionId> \
	--runner playwright \
	--target-url http://127.0.0.1:3000 \
	--out ./e2e-playwright \
	--json
```

To generate an `e2e` suite with pre-seeded `.e2e/cache/<sha256>.json` files instead, set `--runner e2e`:

```bash
npx --package=@softprobe/e2e@0.2.8 softprobe-compile-session \
	--session-id <sessionId> \
	--runner e2e \
	--target-url http://127.0.0.1:3000 \
	--out ./e2e \
	--json
```

By default, `softprobe-compile-session` refuses to overwrite existing test and configuration files. Pass `--force` when regenerating a suite to overwrite `tests/*` and `playwright.config.ts` or `e2e.config.ts`. Content-addressed `.e2e/cache/<sha256>.json` files always refresh idempotently.

## Run generated test suites {#run-suites}

### Run `@playwright/test` suites {#run-playwright}

Install `@softprobe/e2e` and `@playwright/test` in your test directory:

```bash
npm install -D @softprobe/e2e @playwright/test
npx playwright install chromium
```

Pass every captured secret slot as `SP_SECRET_<SLOT>` alongside your Blackbox query credentials, then run Playwright:

```bash
SOFTPROBE_API_KEY="YOUR_SOFTPROBE_API_KEY" \
SP_SECRET_PASSWORD="YOUR_TEST_PASSWORD" \
npx playwright test
```

The generated `playwright.config.ts` configures `@softprobe/e2e/playwright` under `use.softprobe` so every browser request carries a correlated W3C `traceparent` header and `trace.outboundHttp` queries `BlackboxSink`.

### Run zero-LLM `e2e` suites {#run-e2e}

Install `@softprobe/e2e`, `e2e`, `@e2e-dev/web`, and `zod` on Node.js 22.13 or newer:

```bash
npm install -D @softprobe/e2e e2e@0.24.0 @e2e-dev/web@0.16.1 zod
```

Run the suite with `E2E_TELEMETRY_DISABLED=1`:

```bash
E2E_TELEMETRY_DISABLED=1 \
SOFTPROBE_API_KEY="YOUR_SOFTPROBE_API_KEY" \
SP_SECRET_PASSWORD="YOUR_TEST_PASSWORD" \
npx e2e run
```

The generated `e2e.config.ts` wires `softprobeCachedAgent()`, `softprobeWeb()`, and `softprobeReporter()`. Even on the first run, `softprobeCachedAgent()` replays the pre-seeded `.e2e/cache/<sha256>.json` `trace-1` entries with zero LLM calls while the browser sends live HTTP requests with fresh `traceparent` headers. Commit `.e2e/cache/` alongside `tests/*.e2e.ts` so CI runs stay deterministic and require no model API key.

To append new natural-language steps after a compiled flow, see [How to write natural-language UI tests with `e2e`](/en/ui-testing/natural-language#extend-compiled-tests).

## Assert backend outbound HTTP calls and clean up state {#outbound-assertions}

Configure `BlackboxSink` in `playwright.config.ts` or `e2e.config.ts` to verify what your backend sent to external services during each browser action. Clean up created records in `afterEach` so repeated runs stay idempotent.

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
				softprobeApiKey: process.env.SOFTPROBE_API_KEY,
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

- **`TraceInstrumentationError` with code `TRACE_INSTRUMENTATION_MISSING`.** The browser sent `traceparent`, and Blackbox did not receive a matching backend `SERVER` span within `pollTimeoutMs` (default `30000` milliseconds). Confirm that your backend exports OTLP traces or runs with OpenTelemetry OBI, verify the `SOFTPROBE_API_KEY`, and allow `traceparent` in `Access-Control-Allow-Headers` on cross-origin APIs.
- **`TraceAssertionError` with code `TRACE_ASSERTION_FAILED`.** The backend `SERVER` span arrived in Blackbox, and either no outgoing `CLIENT` HTTP span matched `trace.outboundHttp` or an unexpected call matched `trace.expectNoOutboundHttp`. Open the `explorerTraceUrl` printed in the error message, or inspect the trace with `get_trace` in [Blackbox MCP](/en/blackbox/coding-agent-skills).

## Related {#related}

- [Tutorial: Build your first generated UI and backend test](/en/ui-testing/tutorial)
- [How to write natural-language UI tests with `e2e`](/en/ui-testing/natural-language)
- [JavaScript and TypeScript SDK reference](/en/blackbox/reference/softprobe-js#softprobe-e2e)
