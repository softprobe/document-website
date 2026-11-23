---
title: Build your first generated UI and backend test
---

# Build your first generated UI and backend test

In this tutorial, you build a small team-invitation web app, record one browser flow into [Softprobe Explorer](https://explorer.softprobe.ai), and compile that session into both a `@playwright/test` suite and a zero-LLM `e2e` suite. Then you simulate a silent backend bug where the UI still shows a green confirmation message while the backend drops the outgoing email request, and watch the generated test catch it.

Before you start, install Node.js 22.13 or newer and create an Agent Ingestion Key (`spk_...`) plus an API token and Workspace ID in [Softprobe Explorer](https://explorer.softprobe.ai). If you prefer to self-host Explorer locally with Docker, follow [Self-host Blackbox](/en/blackbox/self-hosting) first.

## 1. Create the sample app

First, create a fresh folder and install the Softprobe SDKs, Playwright, `e2e`, and OpenTelemetry HTTP instrumentation:

```bash
mkdir softprobe-ui-tutorial && cd softprobe-ui-tutorial
npm init -y
npm pkg set type=module
npm install @softprobe/e2e@0.2.3 @softprobe/web-record@0.2.3 @playwright/test@1.64.1 \
	e2e@0.24.0 @e2e-dev/web@0.16.1 zod \
	@opentelemetry/sdk-node @opentelemetry/sdk-trace-base \
	@opentelemetry/exporter-trace-otlp-proto @opentelemetry/instrumentation-http \
	@opentelemetry/resources
npx playwright install chromium
```

Next, create `otel.mjs` so your Node.js backend exports incoming `SERVER` and outgoing `CLIENT` HTTP spans to Softprobe:

```js
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";

const exporter = new OTLPTraceExporter({
	url:
		process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
		"https://explorer.softprobe.ai/api/thelake/v1/traces",
	headers: { Authorization: `Bearer ${process.env.INGESTION_KEY}` },
});

const sdk = new NodeSDK({
	resource: resourceFromAttributes({ "service.name": "invite-demo-api" }),
	spanProcessors: [new SimpleSpanProcessor(exporter)],
	instrumentations: [new HttpInstrumentation()],
});

sdk.start();
```

Now create `server.cjs`. It serves the team-invitation form on port `4173`, runs a local webhook receiver on port `4174`, and loads `@softprobe/web-record` with `captureSemanticActions: true` and `inputCapture: "secrets-only"`:

```js
const http = require("node:http");
const { readFileSync } = require("node:fs");

const port = Number(process.env.PORT || 4173);
const webhookPort = Number(process.env.WEBHOOK_PORT || 4174);
const tracesEndpoint =
	process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
	"https://explorer.softprobe.ai/api/thelake/v1/traces";

const webRecordJs = readFileSync(
	"./node_modules/@softprobe/web-record/dist/browser.js",
	"utf8",
);
const recordOptions = JSON.stringify({
	ingestionKey: process.env.INGESTION_KEY,
	otlp: { tracesEndpoint, protocol: "http/protobuf" },
	serviceName: "invite-demo-web",
	captureSemanticActions: true,
	inputCapture: "secrets-only",
}).replaceAll('"', "&quot;");

http
	.createServer((req, res) => {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ delivered: true }));
	})
	.listen(webhookPort, "127.0.0.1");

function sendWebhook(payload) {
	return new Promise((resolve, reject) => {
		const body = JSON.stringify(payload);
		const req = http.request(
			{
				hostname: "127.0.0.1",
				port: webhookPort,
				path: "/v1/email/send",
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Content-Length": Buffer.byteLength(body),
				},
			},
			(res) => {
				res.resume();
				res.on("end", () => resolve(res.statusCode));
			},
		);
		req.on("error", reject);
		req.end(body);
	});
}

http
	.createServer(async (req, res) => {
		if (req.method === "GET" && req.url === "/softprobe-web-record.js") {
			res.writeHead(200, {
				"Content-Type": "application/javascript; charset=utf-8",
			});
			return res.end(webRecordJs);
		}
		if (req.method === "POST" && req.url === "/api/invites") {
			const chunks = [];
			for await (const c of req) chunks.push(c);
			const { email, role } = JSON.parse(Buffer.concat(chunks).toString("utf8"));
			if (process.env.SKIP_EMAIL !== "1") {
				await sendWebhook({ to: email, role });
			}
			res.writeHead(200, { "Content-Type": "application/json" });
			return res.end(JSON.stringify({ ok: true, invited: email, role }));
		}
		res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
		res.end(`<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>Team Invite Demo</title>
	<script src="/softprobe-web-record.js" data-softprobe-options="${recordOptions}"></script>
</head>
<body>
	<h1>Invite a teammate</h1>
	<form id="inviteForm">
		<label for="email">Teammate email</label>
		<input id="email" name="email" type="email" required />
		<label for="role">Workspace role</label>
		<select id="role" name="role">
			<option value="member">Member</option>
			<option value="admin">Admin</option>
		</select>
		<label for="password">Confirm admin password</label>
		<input id="password" name="password" type="password" required />
		<button type="submit">Send invite</button>
	</form>
	<p id="status" role="status"></p>
	<script>
		document.getElementById("inviteForm").addEventListener("submit", async (e) => {
			e.preventDefault();
			const email = document.getElementById("email").value;
			const role = document.getElementById("role").value;
			const res = await fetch("/api/invites", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, role }),
			});
			const data = await res.json();
			document.getElementById("status").textContent =
				"Invitation queued for " + data.invited + " (" + data.role + ")";
		});
	</script>
</body>
</html>`);
	})
	.listen(port, "127.0.0.1", () => {
		console.log(`Invite demo listening at http://127.0.0.1:${port}`);
	});
```

Start the server in Terminal 1 with your `INGESTION_KEY`:

```bash
export INGESTION_KEY="spk_REPLACE_WITH_YOUR_INGESTION_KEY"
node --import ./otel.mjs server.cjs
```

You should see:

```text
Invite demo listening at http://127.0.0.1:4173
```

## 2. Record one browser session

Open `http://127.0.0.1:4173` in Chrome:

1. Type `ada@example.com` into **Teammate email**.
2. Select **Admin** in **Workspace role**.
3. Type `Sup3rS3cretAdminPass!` into **Confirm admin password**.
4. Click **Send invite** and confirm that the page displays `Invitation queued for ada@example.com (admin)`.
5. Open your browser DevTools console and run `await window.__softprobeSession.flush(); window.__softprobeSession.sessionId` to flush spans immediately and print your `SESSION_ID`.

Now open **Sessions** in [Softprobe Explorer](https://explorer.softprobe.ai) and click your new session. In the **Trace** tab, you see four `UI` (`softprobe.ui.action`) spans alongside the `POST /api/invites` and `POST /v1/email/send` HTTP spans. The password field appears as `{ "kind": "secret", "slot": "PASSWORD" }` rather than plaintext.

## 3. Generate and run the `@playwright/test` suite

In Terminal 2, export your Explorer query credentials and `SESSION_ID`, then compile the recorded session into `./pw-suite`:

```bash
export SESSION_ID="PASTE_YOUR_SESSION_ID"
export SOFTPROBE_TOKEN="YOUR_EXPLORER_API_TOKEN"
export SOFTPROBE_WORKSPACE_ID="YOUR_WORKSPACE_ID"

npx softprobe-compile-session \
	--session-id "$SESSION_ID" \
	--runner playwright \
	--target-url http://127.0.0.1:4173 \
	--out ./pw-suite \
	--json
```

You should see JSON output showing `4` compiled UI actions and `1` outbound HTTP assertion:

```json
{
	"ok": true,
	"runner": "playwright",
	"sessionId": "00e87df7-e9c3-4bf9-b1ce-f9e1526ba376",
	"actionCount": 4,
	"outboundAssertionCount": 1,
	"filesWritten": [
		".../pw-suite/tests/recorded-session.spec.ts",
		".../pw-suite/playwright.config.ts"
	],
	"cacheFilesWritten": []
}
```

You can also preview or download the test file from the browser by clicking **Generate E2E test** in the Explorer session header, or click **Copy command** to copy the CLI command above.

Open `pw-suite/tests/recorded-session.spec.ts` to inspect what the compiler generated:

```ts
import { expect, test } from "@softprobe/e2e/playwright";

function requireSecret(envName: string, fallbackEnvName?: string): string {
	const value = process.env[envName] ?? (fallbackEnvName ? process.env[fallbackEnvName] : undefined);
	if (!value || value.trim() === "") {
		throw new Error(`Missing required secret environment variable: ${envName}`);
	}
	return value;
}

test.describe("Recorded session replay", () => {
	test("replays session 00e87df7-e9c3-4bf9-b1ce-f9e1526ba376", async ({ page, trace }) => {
		const secret_PASSWORD = requireSecret("SP_SECRET_PASSWORD", "E2E_SECRET_PASSWORD");
		await page.goto("/");
		await page.getByRole("textbox", { name: new RegExp("^[\\s\\p{Co}]*Teammate[\\s\\p{Co}]+email[\\s\\p{Co}]*$", "u") }).fill("ada@example.com");
		await page.getByRole("combobox", { name: new RegExp("^[\\s\\p{Co}]*Workspace[\\s\\p{Co}]+role[\\s\\p{Co}]*$", "u") }).selectOption("admin");
		await page.getByRole("textbox", { name: new RegExp("^[\\s\\p{Co}]*Confirm[\\s\\p{Co}]+admin[\\s\\p{Co}]+password[\\s\\p{Co}]*$", "u") }).fill(secret_PASSWORD);
		const responsePromise_3 = page.waitForResponse((res) => res.request().method() === "POST" && new URL(res.url()).pathname === "/api/invites");
		await page.getByRole("button", { name: new RegExp("^[\\s\\p{Co}]*Send[\\s\\p{Co}]+invite[\\s\\p{Co}]*$", "u") }).click();
		await responsePromise_3;
		await expect(page.getByRole("status").filter({ hasText: "Invitation queued for ada@example.com (admin)" }).first()).toBeVisible();
		const outbound_3_0_0 = await trace.outboundHttp({
			triggeredBy: { method: "POST", path: "/api/invites" },
			method: "POST",
			url: new RegExp("/v1/email/send$"),
			status: 200,
		});
		expect(outbound_3_0_0.status).toBe(200);
	});
});
```

Run the generated Playwright test with `SP_SECRET_PASSWORD`:

```bash
SP_SECRET_PASSWORD="Sup3rS3cretAdminPass!" \
npx playwright test --config ./pw-suite/playwright.config.ts
```

You should see the test pass:

```text
Running 1 test using 1 worker
  1 passed (4.8s)
```

## 4. Catch a silent backend regression

Break the backend without changing the UI. In Terminal 1, stop `server.cjs` with `Ctrl+C` and restart it with `SKIP_EMAIL=1`:

```bash
SKIP_EMAIL=1 node --import ./otel.mjs server.cjs
```

With `SKIP_EMAIL=1`, `POST /api/invites` still returns `200 OK` and the browser still displays `Invitation queued for ada@example.com (admin)`. A DOM-only UI test would stay green.

Re-run the generated Playwright test in Terminal 2:

```bash
SP_SECRET_PASSWORD="Sup3rS3cretAdminPass!" \
npx playwright test --config ./pw-suite/playwright.config.ts
```

The test fails with `TraceAssertionError` and prints a direct Explorer link to the trace that missed `/v1/email/send`:

```text
TraceAssertionError: No outbound HTTP call on trace 468763bd2fd104fbbc9da925d5d1524f matched (method=POST, url=/\/v1\/email\/send$/, status=200) within 30000ms. Observed outbound calls: none. Inspect trace at https://explorer.softprobe.ai/?trace=468763bd2fd104fbbc9da925d5d1524f.
```

Stop `server.cjs` in Terminal 1 and restart it without `SKIP_EMAIL=1` before the final step:

```bash
node --import ./otel.mjs server.cjs
```

## 5. Generate and run the zero-LLM `e2e` suite

Now compile the same recorded session for the `e2e` runner:

```bash
npx softprobe-compile-session \
	--session-id "$SESSION_ID" \
	--runner e2e \
	--target-url http://127.0.0.1:4173 \
	--out ./e2e-suite \
	--json
```

Notice that `softprobe-compile-session` writes `e2e-suite/tests/recorded-session.e2e.ts`, `e2e-suite/e2e.config.ts`, and a pre-seeded `.e2e/cache/<sha256>.json` action trace. Run the `e2e` suite with zero model API keys configured:

```bash
cd e2e-suite
CI=true \
E2E_TELEMETRY_DISABLED=1 \
SP_SECRET_PASSWORD="Sup3rS3cretAdminPass!" \
../node_modules/.bin/e2e run --reporter list
```

Inspect `.e2e/report.json` with Node.js to verify that the test passed with `0` model tokens and `0` model calls:

```bash
node -e 'const r = JSON.parse(fs.readFileSync(".e2e/report.json", "utf8")); console.log(r.run.summary.passed, r.run.usage.modelTokens, r.run.usage.maxModelCallsInStep);'
```

You should see:

```text
1 0 0
```

## Next steps

- To integrate session-to-test exports into your real frontend and CI pipeline, see [How to generate UI tests from recorded sessions](/en/ui-testing/from-sessions).
- To write new `e2e` tests directly in plain English without recording a browser session first, see [How to write natural-language UI tests with `e2e`](/en/ui-testing/natural-language).
