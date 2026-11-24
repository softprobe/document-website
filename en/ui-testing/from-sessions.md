---
title: Use a recorded session as a test plan
---

# Use a recorded session as a test plan

Record a browser flow once, inspect its actions and related backend calls in Softprobe Explorer, then write a Playwright test that repeats the flow. The recording gives you real selectors and request paths to start from; the test stays in your repository and checks both the UI and the backend behavior.

`@softprobe/web-record` captures semantic browser actions as `softprobe.ui.action` spans. The `@softprobe/e2e/playwright` fixture adds W3C `traceparent` headers to browser requests and lets the test query the backend `CLIENT` calls those requests caused.

## Enable semantic action capture {#enable-capture}

Initialize [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record) in your browser entrypoint:

```ts
import { RecordSdk } from "@softprobe/web-record";

RecordSdk.init({
	ingestionKey: "spk_REPLACE_WITH_INGESTION_KEY",
	serviceName: "my-web",
	captureSemanticActions: true,
	inputCapture: "secrets-only",
	secretSlots: {
		'input[name="password"]': "PASSWORD",
	},
});
```

The Connect Agent setup prompt enables semantic action capture. With `inputCapture: "secrets-only"`, ordinary form values can help reproduce a flow, while password, payment-card, one-time-code, token, and secret values are represented by named slots instead of being sent as plain text. See [the JavaScript SDK reference](/en/blackbox/reference/softprobe-js#softprobe-web-record) for input masking and route settings.

Export backend OpenTelemetry spans or run official OpenTelemetry OBI with the same Agent Ingestion Key. Follow [End-to-end session tracing with payloads](/en/blackbox/end-to-end-session-tracing) for backend setup. If the browser calls a cross-origin API, allow `traceparent` in `Access-Control-Allow-Headers`.

## Record and inspect the flow {#inspect-session}

Complete the flow in your application, then open **Sessions** in Softprobe Explorer and select the new session. Use its `softprobe.ui.action` spans to note the action order, labels, and values. Follow the related trace to find the backend request path and the downstream calls that matter to the behavior.

If you use Blackbox MCP, call `get_session_semantic_actions` with the session ID to get flow segments, UI locators, and trace IDs caused by each action. Use `get_trace` on the relevant traces to inspect full request and response details before writing assertions.

Use synthetic form values while recording. The public demo Agent Ingestion Key can write telemetry for its bound Agent; it cannot read sessions. Session and trace queries in the test require a Softprobe API Key with read access to the workspace, set as `SOFTPROBE_API_KEY`.

## Write the Playwright test {#write-test}

Install the SDK and Playwright in your test project:

```bash
npm install -D @softprobe/e2e @playwright/test
npx playwright install chromium
```

Use the actions from the recording to write the browser steps. Import `test` from `@softprobe/e2e/playwright` to get the `trace` fixture:

```ts
import { expect, test } from "@softprobe/e2e/playwright";

test("sends an invitation email", async ({ page, trace }) => {
	await page.goto("/members");
	await page.getByLabel("Email address").fill("ada@example.com");
	await page.getByRole("button", { name: "Send invitation" }).click();
	await expect(page.getByText("Invitation sent")).toBeVisible();

	const emailCall = await trace.outboundHttp({
		triggeredBy: { method: "POST", path: "/api/workspaces/invites" },
		method: "POST",
		url: /\/v1\/email\/send$/,
		status: 200,
	});
	expect(emailCall.request.json).toMatchObject({
		to: "ada@example.com",
	});
});
```

Set `SOFTPROBE_API_KEY` to a key with read access to the session workspace, then run the suite:

```bash
SOFTPROBE_API_KEY="YOUR_SOFTPROBE_API_KEY" npx playwright test
```

The key resolves its workspace, so you do not need a separate Workspace ID. `trace.outboundHttp` waits for the matching backend span and fails with `TraceAssertionError` if it does not appear. See the [tutorial](/en/ui-testing/tutorial) for a complete flight-booking example, including a fault mode that skips the confirmation request.

## Keep the test repeatable {#repeatable}

- Use stable locators such as labels and roles. If the recording exposes only a CSS selector, prefer a durable `data-testid` over a generated class name.
- Use synthetic values and keep credentials in environment variables or Playwright fixtures.
- Remove data created by each test so it can run repeatedly.
- Keep the test focused on one user outcome and assert the backend effect that proves it happened.

To author natural-language actions with `e2e` and replay them from a committed cache, see [How to write natural-language UI tests](/en/ui-testing/natural-language).
