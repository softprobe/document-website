---
title: 如何从录制的会话生成 UI 测试
---

# 如何从录制的会话生成 UI 测试

在 [Softprobe Explorer](https://explorer.softprobe.ai) 中走通一次真实浏览器流程，将录制到的会话编译为 `@playwright/test` 或 `e2e` 测试套件，并在 CI 中同时验证前端交互与后端向外部服务发出的真实出站 HTTP 请求。

`@softprobe/web-record` 会把浏览器语义交互记录为 `softprobe.ui.action` OpenTelemetry span 并自动透传 W3C `traceparent` 请求头。`@softprobe/e2e` 会把这些动作编译为可重复执行的页面步骤，并通过 `BlackboxSink` 校验后端在 Blackbox 中记录的下游 `CLIENT` HTTP 调用。

## 开启语义动作采集 {#enable-capture}

1. 在 [Softprobe Explorer](https://explorer.softprobe.ai) 中打开 **Agents**，点击 **+ Connect agent**，复制面向前端与后端应用的 **Connect Agent** 配置提示。

2. 在前端入口初始化 [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record)，开启 `captureSemanticActions: true` 与 `inputCapture: "secrets-only"`：

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

	Explorer 的 **Connect Agent** 代码片段已默认启用这两项配置。启用 `inputCapture: "secrets-only"` 后，普通表单项会保留输入文本用于测试编译，而密码框、银行卡号、一次性验证码、名称含 `token` 或 `secret` 的输入框，以及匹配 `secretSlots` 选择器的输入框只生成 `{ kind: "secret", slot }` 占位引用，明文凭据不会离开浏览器。

	如果页面通过 HTML `<script>` 标签直接引入 UMD 脚本，请在标签上添加 `data-capture-semantic-actions="true"` 与 `data-input-capture="secrets-only"`：

	```html
	<script
		src="https://unpkg.com/@softprobe/web-record/dist/browser.js"
		data-ingestion-key="spk_REPLACE_WITH_INGESTION_KEY"
		data-capture-semantic-actions="true"
		data-input-capture="secrets-only"
		defer
	></script>
	```

3. 使用同一把 Ingestion Key 在后端导出 OpenTelemetry HTTP span，或挂载官方 OpenTelemetry OBI。后端配置步骤见[快速开始](/zh/blackbox/getting-started)。如果浏览器跨域调用后端接口，请在后端 CORS 配置的 `Access-Control-Allow-Headers` 中放行 `traceparent`。

## 将录制的会话编译为测试 {#compile-session}

在浏览器中操作一次目标业务流程，随后打开 Softprobe Explorer 的 **Sessions** 页面并选中刚录制的会话。你可以直接在 Explorer 页面一键导出测试，通过编码 Agent 的 Blackbox MCP 编译，或在终端运行命令行编译。

### 在 Explorer 中一键导出 {#export-from-explorer}

当会话包含 `softprobe.ui.action` span 时，Explorer 会在会话详情页顶部展示 **Generate E2E test** 按钮。

1. 点击 **Generate E2E test** 打开导出抽屉。
2. 选择 **Playwright (@playwright/test)** 预览 `.spec.ts` 用例，或选择 **AI cached (@softprobe/e2e)** 预览 `.e2e.ts` 用例。
3. 检查生成的浏览器步骤、`SP_SECRET_<SLOT>` 环境变量绑定与 `trace.outboundHttp` 出站断言。点击 **Copy test** 或 **Download** 保存测试文件，或点击 **Copy command** 复制预填参数的 `softprobe-compile-session` 命令，一次性写出完整目录（含 `playwright.config.ts`、`e2e.config.ts` 与 `.e2e/cache/*.json`）。

### 在编码 Agent 中通过 Blackbox MCP 编译 {#compile-from-mcp}

如果你在 Claude Code、Cursor、Codex 或 Antigravity 中连接了 [Blackbox MCP](/zh/blackbox/coding-agent-skills)，可以直接让 Agent 调用 `compile_session_test` 工具编译会话：

```text
调用 Blackbox 的 compile_session_test 编译会话 ses_01J...，runner 设为 "playwright"，
target_url 设为 "http://127.0.0.1:3000"，并将生成的文件写入 ./e2e 目录。
```

`compile_session_test` 接收 `session_id`、取值为 `"playwright"` 或 `"e2e"` 的 `runner`，以及可选的 `target_url`。该工具会返回生成的测试文件与配置文件内容、所需的 `SP_SECRET_<SLOT>` 环境变量名，以及在 `runner` 为 `"e2e"` 时生成的 `.e2e/cache/` `trace-1` 缓存内容。

### 在终端使用命令行编译 {#compile-from-cli}

在 Node.js 22.13 及以上环境中，通过 `npx` 运行 `softprobe-compile-session`：

```bash
export SOFTPROBE_API_KEY="YOUR_SOFTPROBE_API_KEY"

npx --package=@softprobe/e2e softprobe-compile-session \
	--session-id <sessionId> \
	--runner playwright \
	--target-url http://127.0.0.1:3000 \
	--out ./e2e-playwright \
	--json
```

如需生成包含预置 `.e2e/cache/<sha256>.json` 缓存文件的 `e2e` 套件，将 `--runner` 设为 `e2e`：

```bash
npx --package=@softprobe/e2e softprobe-compile-session \
	--session-id <sessionId> \
	--runner e2e \
	--target-url http://127.0.0.1:3000 \
	--out ./e2e \
	--json
```

默认情况下，`softprobe-compile-session` 不会覆盖已存在的测试文件与配置文件。重新生成套件时传入 `--force` 可覆盖现有的 `tests/*` 以及 `playwright.config.ts` 或 `e2e.config.ts`，而按内容寻址的 `.e2e/cache/<sha256>.json` 缓存条目始终会幂等刷新。

## 运行生成的测试套件 {#run-suites}

### 运行 `@playwright/test` 套件 {#run-playwright}

在测试目录安装 `@softprobe/e2e` 与 `@playwright/test`：

```bash
npm install -D @softprobe/e2e @playwright/test
npx playwright install chromium
```

通过 `SP_SECRET_<SLOT>` 传入录制时捕获的敏感槽位，并配置 Blackbox 查询凭据后运行 Playwright：

```bash
SOFTPROBE_API_KEY="YOUR_SOFTPROBE_API_KEY" \
SP_SECRET_PASSWORD="YOUR_TEST_PASSWORD" \
npx playwright test
```

生成的 `playwright.config.ts` 会在 `use.softprobe` 下挂载 `@softprobe/e2e/playwright`，为每次浏览器请求关联 W3C `traceparent` 请求头，并让 `trace.outboundHttp` 直接向 `BlackboxSink` 查询后端链路。

### 运行零 LLM 调用的 `e2e` 套件 {#run-e2e}

在 Node.js 22.13 及以上环境中安装 `@softprobe/e2e`、`e2e`、`@e2e-dev/web` 与 `zod`：

```bash
npm install -D @softprobe/e2e e2e@0.24.0 @e2e-dev/web@0.16.1 zod
```

携带 `E2E_TELEMETRY_DISABLED=1` 运行测试套件：

```bash
E2E_TELEMETRY_DISABLED=1 \
SOFTPROBE_API_KEY="YOUR_SOFTPROBE_API_KEY" \
SP_SECRET_PASSWORD="YOUR_TEST_PASSWORD" \
npx e2e run
```

生成的 `e2e.config.ts` 默认注册 `softprobeCachedAgent()`、`softprobeWeb()` 与 `softprobeReporter()`。首次运行时，`softprobeCachedAgent()` 就会直接回放预置的 `.e2e/cache/<sha256>.json` `trace-1` 缓存步骤，全程产生零次大模型调用，同时浏览器仍发送带全新 `traceparent` 请求头的真实 HTTP 请求。请将 `.e2e/cache/` 与 `tests/*.e2e.ts` 一并提交到 Git，使 CI 无需配置模型密钥即可稳定运行。

如果需要在已编译流程末尾追加新的自然语言步骤，请参阅[如何用 `e2e` 编写自然语言 UI 测试](/zh/ui-testing/natural-language#extend-compiled-tests)。

## 断言后端出站 HTTP 调用并清理测试数据 {#outbound-assertions}

在 `playwright.config.ts` 或 `e2e.config.ts` 中配置 `BlackboxSink`，断言每次前端交互触发的后端下游 HTTP 请求。在 `afterEach` 中清理测试产生的业务数据，保证多次运行幂等互不干扰。

使用 `BlackboxSink` 的 `playwright.config.ts` 示例：

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

在测试文件中从 `@softprobe/e2e/playwright` 导入 `{ expect, test }`。调用 `trace.outboundHttp` 断言后端发出的下游 `CLIENT` HTTP 请求及脱敏后的 JSON 消息体。调用 `trace.expectNoOutboundHttp` 验证被拒绝的请求不会触发下游副作用，并在 `test.afterEach` 中删除测试期间写入的数据：

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

如果单条用例多次调用同一个后端接口，可用 `trace.window` 包住目标操作，使返回的 `TraceScope` 只匹配该回调期间发出的浏览器请求：

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

## 排查链路校验失败 {#troubleshoot}

`BlackboxSink` 会先等待后端入口 `SERVER` span 到达，再校验下游 `CLIENT` HTTP 调用，把埋点缺失与业务断言失败清晰分开：

- **抛出 `TraceInstrumentationError` 且错误码为 `TRACE_INSTRUMENTATION_MISSING`。** 浏览器已发送 `traceparent` 请求头，但 Blackbox 在默认的 `30000` 毫秒 `pollTimeoutMs` 超时时间内未收到对应的后端 `SERVER` span。请确认后端已配置 OTLP 导出或挂载 OpenTelemetry OBI，核对 `SOFTPROBE_API_KEY`，并在跨域接口的 `Access-Control-Allow-Headers` 中放行 `traceparent`。
- **抛出 `TraceAssertionError` 且错误码为 `TRACE_ASSERTION_FAILED`。** 后端 `SERVER` span 已写入 Blackbox，说明链路透传正常，但没有下游 `CLIENT` HTTP 请求匹配 `trace.outboundHttp`，或出现了违反 `trace.expectNoOutboundHttp` 的下游调用。可直接打开报错信息中的 `explorerTraceUrl`，或在 [Blackbox MCP](/zh/blackbox/coding-agent-skills) 中调用 `get_trace` 检查记录到的真实请求。

## 相关文档 {#related}

- [教程：构建第一个自动生成 UI 与后端联调测试](/zh/ui-testing/tutorial)
- [如何用 `e2e` 编写自然语言 UI 测试](/zh/ui-testing/natural-language)
- [JavaScript 与 TypeScript SDK 参考](/en/blackbox/reference/softprobe-js#softprobe-e2e)
