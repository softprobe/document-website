---
title: Write full-stack AI E2E tests
---

# Write full-stack AI E2E tests

`@softprobe/e2e` pairs [`e2e`](https://github.com/e2e-inc/e2e) browser steps with W3C `traceparent` verification across Softprobe Blackbox (`thelake` or local Explorer) and Arex (`sp-backend`). You write one `.e2e.ts` test that drives the UI, caches natural-language steps in `.e2e/cache/` so CI runs make zero LLM calls, and asserts the real outgoing HTTP requests your backend sent downstream.

## Check prerequisites {#prerequisites}

1. Install Node.js `^22.22.3 || >=24.8.0` and verify your environment with `sp doctor --e2e`:

	```bash
	sp doctor --e2e --json
	```

	Check that the `e2e-node` entry in `data.checks` reports `"status": "healthy"`. If multiple Node.js versions are installed, point `SP_E2E_NODE_BIN` at the compatible binary.

2. Install `@softprobe/e2e`, `e2e`, `@e2e-dev/web`, and `zod` in your test directory:

	```bash
	npm install -D @softprobe/e2e e2e@0.24.0 @e2e-dev/web@0.24.0 zod
	```

3. Generate `e2e.config.ts` and a starter spec if your project does not have them yet:

	```bash
	sp test init --json
	```

4. Ensure your backend exports traces for incoming W3C `traceparent` requests:
	- For **Blackbox**, run your backend with OpenTelemetry HTTP instrumentation or Softprobe OBI exporting to `thelake` or local Explorer.
	- For **Arex**, run your service with `sp-agent.jar` or Softprobe OBI connected to `sp-backend` (`v2.1` or newer).

	If your browser app calls a cross-origin API, allow the `traceparent` request header in your backend CORS configuration (`Access-Control-Allow-Headers: traceparent`).

## Configure `e2e.config.ts` {#configure}

Register `softprobeWeb` as the target engine and `softprobeReporter()` in `reporters`. `softprobeWeb` intercepts API requests through Playwright `browser.route`: if your frontend already runs [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record), `softprobeWeb` preserves its `traceparent` header, and otherwise it mints a W3C `traceparent` header without injecting scripts into the page.

### Connect to Blackbox (`thelake` or local Explorer) {#configure-blackbox}

```ts
import type { E2EConfig } from "e2e";
import { softprobeReporter, softprobeWeb } from "@softprobe/e2e";

export default {
	cache: {
		mode: "read-write",
	},
	tests: "tests/**/*.e2e.ts",
	targets: [
		{
			name: "web",
			engine: softprobeWeb({
				sink: {
					kind: "blackbox",
					endpoint: process.env.SOFTPROBE_URL ?? "http://127.0.0.1:8091",
					token: process.env.SOFTPROBE_TOKEN,
					workspaceId: process.env.SOFTPROBE_WORKSPACE_ID,
					explorerUrl: process.env.SOFTPROBE_EXPLORER_URL ?? "http://localhost:5179",
				},
			}),
			app: {
				url: process.env.E2E_BASE_URL ?? "http://localhost:5179",
				identity: "explorer-web",
			},
		},
	],
	reporters: ["list", softprobeReporter()],
} satisfies E2EConfig;
```

### Connect to Arex (`sp-backend`) {#configure-arex}

```ts
import type { E2EConfig } from "e2e";
import { softprobeReporter, softprobeWeb } from "@softprobe/e2e";

export default {
	cache: {
		mode: "read-write",
	},
	tests: "tests/**/*.e2e.ts",
	targets: [
		{
			name: "web",
			engine: softprobeWeb({
				sink: {
					kind: "arex",
					endpoint: process.env.SP_API_URL ?? "http://127.0.0.1:8090",
					appId: process.env.SP_APP_ID ?? "travel-ota",
					token: process.env.SP_TOKEN,
					tenantId: process.env.SP_TENANT_ID,
				},
				apiOrigins: ["http://127.0.0.1:18080"],
			}),
			app: {
				url: process.env.E2E_BASE_URL ?? "http://127.0.0.1:18080",
				identity: "travel-ota",
			},
		},
	],
	reporters: ["list", softprobeReporter()],
} satisfies E2EConfig;
```

When you omit `sink` and call `softprobeWeb({ appId: "travel-ota" })`, `@softprobe/e2e` reads `SP_API_URL`, `SP_TOKEN`, and `SP_TENANT_ID` from the XDG credentials that `sp test run` injects automatically. Pass `apiOrigins` whenever your browser UI sends API requests to a different host or port than `app.url`.

## Write a full-stack `.e2e.ts` test {#write-a-test}

Import `test`, `describe`, `afterEach`, and `expect` from `@softprobe/e2e`. Keep `@softprobe/e2e`'s re-exported `expect` untouched and follow `agent.act(...)` with a visible UI `expect(...)` check so `e2e` confirms the outcome and writes the compiled step plan into `.e2e/cache/`. Do not shadow `expect` and do not wrap mutating UI steps in `defineTool` with `mutates: true`.

The example below invites `lc@softprobe.ai` to a workspace, checks the **Pending invitations** row in the UI, verifies that the backend sent a `200` HTTP `POST` to EmailEngine with `lc@softprobe.ai` as the recipient, and verifies that inviting an existing member returns `409` without calling the email service:

```ts
import { z } from "zod";
import { afterEach, credentials, describe, expect, test } from "@softprobe/e2e";

const EmailPayloadSchema = z.object({
	to: z.array(z.object({ address: z.string().email() })).min(1),
	subject: z.string(),
});

describe("workspace invitations", { session: "workspace-owner" }, () => {
	afterEach(async ({ browser }) => {
		await browser.evaluate(async (targetEmail: string) => {
			const wsRes = await fetch("/api/workspaces");
			const wsJson: unknown = await wsRes.json();
			const workspaces =
				typeof wsJson === "object" && wsJson !== null && "workspaces" in wsJson && Array.isArray(wsJson.workspaces)
					? wsJson.workspaces
					: [];
			for (const ws of workspaces) {
				if (typeof ws !== "object" || ws === null || !("id" in ws) || typeof ws.id !== "string") continue;
				const invRes = await fetch(`/api/workspaces/${ws.id}/invites`);
				const invJson: unknown = await invRes.json();
				const invites =
					typeof invJson === "object" && invJson !== null && "invites" in invJson && Array.isArray(invJson.invites)
						? invJson.invites
						: [];
				for (const inv of invites) {
					if (
						typeof inv === "object" &&
						inv !== null &&
						"id" in inv &&
						"email" in inv &&
						typeof inv.id === "string" &&
						inv.email === targetEmail
					) {
						await fetch(`/api/workspaces/${ws.id}/invites/${inv.id}`, { method: "DELETE" });
					}
				}
			}
		}, "lc@softprobe.ai");
	});

	test("invites lc@softprobe.ai and sends one outbound email request", async ({
		app,
		agent,
		screen,
		trace,
	}) => {
		await app.open("/");
		await expect(screen.getByRole("button", "Members")).toBeVisible();

		await agent.act(
			"open Members, enter {email} in Email address, and click Send invitation",
			{ params: { email: "lc@softprobe.ai" } },
		);

		await expect(screen.getByText("lc@softprobe.ai")).toBeVisible();
		await expect(screen.getByRole("button", "Revoke")).toBeVisible();

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
		app,
		screen,
		trace,
	}) => {
		const owner = credentials.user("workspaceOwner");

		await app.open("/");
		await screen.getByRole("button", "Members").tap();
		await screen.getByLabel("Email address").fill(owner.username);
		await screen.getByRole("button", "Send invitation").tap();

		await expect(screen.getByRole("alert")).toContainText(
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

### Isolate repeated calls with `trace.window` {#trace-window}

When a single test triggers the same backend route more than once, wrap the action in `trace.window` so `outboundHttp` or `expectNoOutboundHttp` inspects only browser requests fired inside that callback:

```ts
const retryTrace = await trace.window(async () => {
	await screen.getByRole("button", "Resend invitation").tap();
});

const resentCall = await retryTrace.outboundHttp({
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

## Run tests and verify zero-LLM cache replay {#run-and-verify-cache}

Run the spec twice with `sp test run --json`:

```bash
sp test run tests/workspace-invite.e2e.ts --json
sp test run tests/workspace-invite.e2e.ts --json
```

Compare the two JSON envelopes:

1. **Run 1** executes `agent.act(...)`, populates `.e2e/cache/`, and verifies the backend trace (`"passed": 2`, `"failed": 0`, non-empty `"verifiedTraces"`).
2. **Run 2** replays the cached UI actions without calling a model (`"modelCalls": 0`, `"modelTokens": 0`), while the browser still sends real HTTP requests with a fresh W3C `traceId` and verifies the live backend trace in `"verifiedTraces"`.

Commit both `tests/*.e2e.ts` and `.e2e/cache/` to Git so CI jobs run with zero LLM calls and catch both UI regressions and broken downstream HTTP calls.

## Author tests from plain English in `sp code` {#author-in-sp-code}

When `node_modules/e2e` is installed in your project and a compatible `node` binary is available, `sp code` and `sp code web` automatically register the local `e2e` MCP server under Node.js with `E2E_TELEMETRY_DISABLED=1`.

1. Start the workbench in your project directory:

	```bash
	sp code
	```

2. Give `sp code` one plain-English requirement:

	```text
	Write and verify a @softprobe/e2e test in tests/workspace-invite.e2e.ts:
	invite lc@softprobe.ai to the test workspace, confirm the Pending invitations
	row and Revoke button appear, verify the outgoing EmailEngine POST carries
	lc@softprobe.ai as the recipient, and confirm inviting the existing owner
	returns 409 with no outbound email call.
	```

3. `sp code` walks the live UI once with `e2e` MCP (`open_session`, `navigate`, `tap`, `type`, `observe`), inspects the captured backend trace (`get_trace` on Blackbox MCP or `sp trace outbound <traceId> --app <appId> --json` on Arex) to read the real redacted request schema, writes `tests/workspace-invite.e2e.ts`, and runs `sp test run --json` twice until Run 2 passes with `"modelCalls": 0`.

## Troubleshoot trace failures {#troubleshoot}

`@softprobe/e2e` separates missing instrumentation from failed assertions by waiting for the backend `SERVER` entry span before checking outgoing `CLIENT` calls:

- **`TraceInstrumentationError` (`code: "TRACE_INSTRUMENTATION_MISSING"`).** The browser sent `traceparent`, and the sink stayed in `state: "awaiting_server_span"` past `pollTimeoutMs` (default `15000` ms). Check that your backend exports OTLP spans or runs with `sp-agent.jar` or OBI, verify `workspaceId` (Blackbox) or `appId` (Arex), and verify that CORS allows `traceparent`.
- **`TraceAssertionError` (`code: "TRACE_ASSERTION_FAILED"`).** The backend `SERVER` span arrived, so trace propagation works, and either no outgoing `CLIENT` HTTP call matched `trace.outboundHttp(...)` or an unexpected call matched `trace.expectNoOutboundHttp(...)`. Inspect the recorded calls directly with `sp trace outbound <traceId> --app <appId> --json` on Arex or open `explorerTraceUrl` in Softprobe Explorer on Blackbox.

## Related {#related}

- [sp test command reference](/en/arex/commands/test)
- [sp trace command reference](/en/arex/commands/trace)
- [`@softprobe/e2e` API reference](/en/blackbox/reference/softprobe-js#softprobe-e2e)
