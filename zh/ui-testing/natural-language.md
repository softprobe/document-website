---
title: 如何用 e2e 编写自然语言 UI 测试
---

# 如何用 `e2e` 编写自然语言 UI 测试

无需预先录制浏览器会话，直接使用 `e2e` 与 `@softprobe/e2e` 用自然语言编写浏览器 UI 测试。在本地配置模型运行一次即可生成 `.e2e/cache/` 动作缓存；将缓存提交到 Git 后，每次 CI 运行都以零次大模型调用稳定回放，并同时校验后端真实出站 HTTP 请求。

## 安装依赖 {#install}

在 Node.js 22.13 及以上环境中安装 `@softprobe/e2e`、`e2e`、`@e2e-dev/web`、`@playwright/test`、`zod` 以及首次录制所需的 AI SDK 模型适配包（例如 `@ai-sdk/openai`）：

```bash
npm install -D @softprobe/e2e e2e@0.24.0 @e2e-dev/web@0.16.1 @playwright/test @ai-sdk/openai zod
npx playwright install chromium
```

## 配置 `e2e.config.ts` {#configure}

默认导出满足 `E2EConfig` 类型的配置对象。在本地录制新 `agent.act` 步骤时将 `cache.mode` 设为 `"read-write"`，在 CI 中设为 `"read-only"`，确保 CI 不会改写 `.e2e/cache/`，也不需要配置任何模型密钥：

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
					softprobeApiKey: process.env.SOFTPROBE_API_KEY,
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

如果你只需要纯前端自然语言 UI 自动化而不需要校验后端链路，可以在 `softprobeWeb(...)` 中省略 `sink`，并在测试用例参数中省略 `trace`。

## 编写自然语言测试 {#author-test}

创建 `tests/invite.e2e.ts`。在每个 `await agent.act(...)` 步骤后紧跟可见的 `expect(screen.getByRole(...))` 或 `expect(browser).toHaveURL(...)` 断言，以便 `e2e` 记录明确的后置条件，再通过 `trace.outboundHttp` 校验后端出站副作用：

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

通过 `{ params: { password: secrets.get("PASSWORD") } }` 注入密码会在运行时读取 `SP_SECRET_PASSWORD` 或 `E2E_SECRET_PASSWORD`，不会把明文密码写入 `.e2e/cache/*.json` 缓存文件。

## 本地录制一次并在 CI 零 LLM 回放 {#record-and-replay}

1. 携带模型 API Key 本地运行一次，录制并生成 `.e2e/cache/<sha256>.json`：

	```bash
	E2E_TELEMETRY_DISABLED=1 \
	OPENAI_API_KEY="sk-..." \
	SOFTPROBE_API_KEY="YOUR_SOFTPROBE_API_KEY" \
	SOFTPROBE_WORKSPACE_ID="YOUR_WORKSPACE_ID" \
	SP_SECRET_PASSWORD="YOUR_TEST_PASSWORD" \
	npx e2e run
	```

2. 设置 `CI=true` 并移除 `OPENAI_API_KEY` 再运行一次，验证 `.e2e/cache/` 零模型消耗回放：

	```bash
	CI=true \
	E2E_TELEMETRY_DISABLED=1 \
	SOFTPROBE_API_KEY="YOUR_SOFTPROBE_API_KEY" \
	SOFTPROBE_WORKSPACE_ID="YOUR_WORKSPACE_ID" \
	SP_SECRET_PASSWORD="YOUR_TEST_PASSWORD" \
	npx e2e run
	```

3. 检查 `.e2e/report.json` 中的 `"modelTokens": 0` 与 `"maxModelCallsInStep": 0`，随后将 `tests/` 与 `.e2e/cache/` 一并提交到代码仓库。

## 在会话生成的用例末尾追加自然语言步骤 {#extend-compiled-tests}

从录制会话导出的 `e2e` 套件默认在 `e2e.config.ts` 中配置 `cache.mode: "read-only"` 且不绑定模型。如需在已编译流程后追加新步骤：

1. 在 `e2e.config.ts` 中，当 `!process.env.CI` 时将 `cache.mode` 改为 `"read-write"`，并向 `softprobeCachedAgent({ model })` 传入模型实例（例如 `openai("gpt-5.4-mini")`）。
2. 在 `tests/recorded-session.e2e.ts` 末尾追加新的 `await agent.act(...)` 调用以及可见的 `await expect(screen.getByText(...)).toBeVisible()` 断言。
3. 在本地运行一次 `E2E_TELEMETRY_DISABLED=1 npx e2e run`。原有的预置步骤仍直接从 `.e2e/cache/` 零模型调用回放，只有新增的 `agent.act` 步骤会调用模型并写入新的缓存文件。
4. 提交新增的 `.e2e/cache/*.json` 文件，使 CI 在 `CI=true` 下全程零模型调用运行全部步骤。

## 相关文档 {#related}

- [教程：构建第一个自动生成 UI 与后端联调测试](/zh/ui-testing/tutorial)
- [如何从录制的会话生成 UI 测试](/zh/ui-testing/from-sessions)
- [JavaScript 与 TypeScript SDK 参考](/en/blackbox/reference/softprobe-js#softprobe-e2e)
