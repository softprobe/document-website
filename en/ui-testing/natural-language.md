---
title: How to write natural-language UI tests with e2e
---

# How to write natural-language UI tests with `e2e`

Write browser UI tests in plain English with `e2e` and `@softprobe/e2e` without recording a browser session first. Run a new test with a model once to populate `.e2e/cache/`, commit the cache files to Git, and replay every CI run deterministically with zero LLM calls and real backend HTTP trace checks.

## Install packages {#install}

On Node.js 22.13 or newer, install `@softprobe/e2e`, `e2e`, `@e2e-dev/web`, `zod`, and an AI SDK model provider package such as `@ai-sdk/openai` for initial authoring:

```bash
npm install -D @softprobe/e2e e2e@0.24.0 @e2e-dev/web@0.16.1 @playwright/test @ai-sdk/openai zod
npx playwright install chromium
```

## Configure `e2e.config.ts` {#configure}

Export an `E2EConfig` object that uses `"read-write"` cache mode locally when recording new `agent.act` steps, and `"read-only"` in CI so cached runs never mutate `.e2e/cache/` or require a model API key:

```ts
import { openai } from "@ai-sdk/openai";
import type { E2EConfig } from "e2e";
import {
	softprobeCachedAgent,
	softprobeReporter,
	softprobeWeb,
} from "@softprobe/e2e";

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

export default {
	projectId: "my-web-ui-tests",
	workers: 1,
	retries: 0,
	tests: "tests/**/*.e2e.ts",
	cache: {
		dir: ".e2e/cache",
		mode: isCi ? "read-only" : "read-write",
	},
	agents: {
		default: softprobeCachedAgent({
			model: isCi ? undefined : openai("gpt-5.4-mini"),
		}),
	},
	secrets: {
		PASSWORD: () =>
			requireSecretEnv("SP_SECRET_PASSWORD", "E2E_SECRET_PASSWORD"),
	},
	targets: [
		{
			name: "web",
			engine: softprobeWeb({
				sink: {
					kind: "blackbox",
					endpoint:
						process.env.SOFTPROBE_SINK_ENDPOINT ??
						"https://explorer.softprobe.ai/api/thelake",
					token: process.env.SOFTPROBE_TOKEN,
					workspaceId: process.env.SOFTPROBE_WORKSPACE_ID,
				},
			}),
			app: {
				url: process.env.APP_URL ?? "http://127.0.0.1:3000",
				identity: "my-web-app",
			},
		},
	],
	reporters: ["list", softprobeReporter()],
} satisfies E2EConfig;
```

If you want UI-only natural-language tests without backend trace verification, omit `sink` in `softprobeWeb(...)` and omit `trace` from your test arguments.

## Author a natural-language test {#author-test}

Create `tests/invite.e2e.ts`. Pair each `await agent.act(...)` step with a visible `expect(screen.getByRole(...))` or `expect(browser).toHaveURL(...)` check so `e2e` caches clear postconditions, then assert backend side effects with `trace.outboundHttp`:

```ts
import { z } from "zod";
import { describe, expect, secrets, test } from "@softprobe/e2e";

const OutboundEmailSchema = z.object({
	to: z.string().email(),
	role: z.enum(["member", "admin"]),
});

describe("Team invite flow", () => {
	test("invites an admin and sends the outbound email", async ({
		agent,
		app,
		screen,
		trace,
	}) => {
		await app.open("/");

		await agent.act(
			'Fill "ada@example.com" into Teammate email, select "Admin" in Workspace role, fill secret "PASSWORD" into Confirm admin password, and click Send invite',
			{
				params: { password: secrets.get("PASSWORD") },
			},
		);

		await expect(screen.getByRole("status")).toContainText(
			"Invitation queued for ada@example.com (admin)",
		);

		const emailCall = await trace.outboundHttp({
			triggeredBy: { method: "POST", path: "/api/invites" },
			method: "POST",
			url: /\/v1\/email\/send$/,
			status: 200,
		});

		expect(OutboundEmailSchema.parse(emailCall.request.json)).toEqual({
			to: "ada@example.com",
			role: "admin",
		});
	});
});
```

Passing `{ params: { password: secrets.get("PASSWORD") } }` injects `SP_SECRET_PASSWORD` or `E2E_SECRET_PASSWORD` at runtime without writing the secret value into `.e2e/cache/*.json` files.

## Record once locally and replay with zero LLM calls {#record-and-replay}

1. Run the suite once with your model API key to record `.e2e/cache/<sha256>.json`:

	```bash
	E2E_TELEMETRY_DISABLED=1 \
	OPENAI_API_KEY="sk-..." \
	SOFTPROBE_TOKEN="YOUR_BLACKBOX_TOKEN" \
	SOFTPROBE_WORKSPACE_ID="YOUR_WORKSPACE_ID" \
	SP_SECRET_PASSWORD="YOUR_TEST_PASSWORD" \
	npx e2e run
	```

2. Run the suite a second time with `CI=true` and no `OPENAI_API_KEY` to confirm that `.e2e/cache/` replays with zero model tokens:

	```bash
	CI=true \
	E2E_TELEMETRY_DISABLED=1 \
	SOFTPROBE_TOKEN="YOUR_BLACKBOX_TOKEN" \
	SOFTPROBE_WORKSPACE_ID="YOUR_WORKSPACE_ID" \
	SP_SECRET_PASSWORD="YOUR_TEST_PASSWORD" \
	npx e2e run
	```

3. Check `.e2e/report.json` to confirm `"modelTokens": 0` and `"maxModelCallsInStep": 0`, then commit `tests/` and `.e2e/cache/` together.

## Add new `agent.act` steps to a cached suite {#add-steps}

When an existing `.e2e.ts` test already has recorded steps in `.e2e/cache/`, you can append new plain-English steps without re-recording earlier ones:

1. Keep `cache.mode` set to `"read-write"` when `!process.env.CI` and pass a `ModelInstance` such as `openai("gpt-5.4-mini")` to `softprobeCachedAgent({ model })` in `e2e.config.ts`.
2. Append your new `await agent.act(...)` call and a visible `await expect(screen.getByText(...)).toBeVisible()` assertion to your `.e2e.ts` file.
3. Run `E2E_TELEMETRY_DISABLED=1 npx e2e run` once locally. Cached steps replay from `.e2e/cache/` with zero model calls, while only your newly added `agent.act` step calls the model and writes its new `.e2e/cache/<sha256>.json` file.
4. Commit the updated test and new `.e2e/cache/*.json` file so CI runs every step with `CI=true` and zero model calls.

## Related {#related}

- [Tutorial: Build your first generated UI and backend test](/en/ui-testing/tutorial)
- [How to generate UI tests from recorded sessions](/en/ui-testing/from-sessions)
- [JavaScript and TypeScript SDK reference](/en/blackbox/reference/softprobe-js#softprobe-e2e)
