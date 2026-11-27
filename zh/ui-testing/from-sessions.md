---
title: 如何从录制的会话生成 UI 测试
---

# 如何从录制的会话生成 UI 测试

在 [Softprobe Explorer](https://explorer.softprobe.ai) 中走通一次真实浏览器流程，让编码 Agent 通过 Blackbox MCP 生成确定性的 `@playwright/test` + `@softprobe/e2e` 测试套件，并在 CI 中同时验证前端交互与后端向外部服务发出的真实出站 HTTP 请求。

`@softprobe/web-record` 会把浏览器语义交互记录为 `softprobe.ui.action` OpenTelemetry span。编码 Agent 通过 Blackbox MCP 读取动作并编写测试。下方示例还检查后端请求，因此需要后端跟踪和 Blackbox 接收端。

> [!NOTE] 选择采集路径
> 本 Web 示例需要在应用中接入 `@softprobe/web-record`。如果只检查 Web 页面且不想接入前端 SDK，请参阅[第一个 Web UI 测试](/zh/ui-testing/classic-web-first-test)。移动端测试也可以在应用不接入 SDK 的情况下导出由 `softprobeMobile` 驱动的动作。请参阅[移动端采集路径](/zh/ui-testing/mobile#choose-path)。

## 开启语义动作采集 {#enable-capture}

1. 在 [Softprobe Explorer](https://explorer.softprobe.ai) 中打开 **Agents**，点击 **+ Connect agent**，复制面向前端与后端应用的 **Connect Agent** 配置提示。

2. 在前端入口初始化 [`@softprobe/web-record`](/zh/blackbox/reference/softprobe-js#softprobe-web-record)，开启 `captureSemanticActions: true` 与 `inputCapture: "secrets-only"`：

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

	Explorer 的 **Connect Agent** 代码片段已默认启用这两项配置。启用 `inputCapture: "secrets-only"` 后，普通表单项会保留输入文本用于生成测试。密码框、银行卡号、一次性验证码、名称含 `token` 或 `secret` 的输入框，以及匹配 `secretSlots` 选择器的输入框只生成 `{ kind: "secret", slot }` 占位引用，明文凭据不会离开浏览器。

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

3. 要运行本指南中的后端请求断言，请使用同一把 Ingestion Key 在后端导出 OpenTelemetry HTTP span，或挂载官方 OpenTelemetry OBI。后端配置步骤见[快速开始](/zh/blackbox/getting-started)。如果浏览器跨域调用后端接口，请在后端 CORS 配置的 `Access-Control-Allow-Headers` 中放行 `traceparent`。只检查页面的测试不需要这项后端配置。

## 使用 Blackbox MCP 生成测试 {#generate-test}

在浏览器中操作一次目标业务流程，随后打开 Softprobe Explorer 的 **Sessions** 页面复制对应的 `session_id`，或直接让编码 Agent 调用 `search_sessions` 检索会话。

在 OpenCode、Claude Code、Cursor、Codex 或 Antigravity 中连接 [Blackbox MCP](/zh/blackbox/coding-agent-skills) 后，让编码 Agent 检查语义动作时间线并生成 Playwright 测试：

```text
使用 Blackbox 的 get_session_semantic_actions 查看会话 ses_01J...，
调用 get_trace 检查订票与支付链路，剔除多余的非交互点击与重试失败请求，
在 ./e2e 目录下针对 http://127.0.0.1:3000 编写清晰的 @playwright/test + @softprobe/e2e 测试。
```

`get_session_semantic_actions` 会返回按业务流程分段的紧凑时间线，包含 CSS 与 WAI-ARIA 定位器、`[non-interactive]` 噪声标记，以及触发的 `trace_id`、HTTP 状态码与单行下游调用摘要。编码 Agent 随后对关键链路调用 `get_trace(trace_id)` 读取完整请求与响应体，编写确定性的 `trace.outboundHttp` 断言。

## 运行生成的测试套件 {#run-suites}

在测试目录安装 `@softprobe/e2e`、`@playwright/test` 与 `zod`：

```bash
npm install -D @softprobe/e2e @playwright/test zod
npx playwright install chromium
```

通过 `SP_SECRET_<SLOT>` 传入录制时捕获的敏感槽位，并配置 Blackbox 查询凭据后运行 Playwright：

```bash
SOFTPROBE_TOKEN="YOUR_BLACKBOX_TOKEN" \
SOFTPROBE_WORKSPACE_ID="YOUR_WORKSPACE_ID" \
SP_SECRET_PASSWORD="YOUR_TEST_PASSWORD" \
npx playwright test
```

生成的 `playwright.config.ts` 会在 `use.softprobe` 下挂载 `@softprobe/e2e/playwright`，为每次浏览器请求关联 W3C `traceparent` 请求头，并让 `trace.outboundHttp` 直接向 `BlackboxSink` 查询后端链路，全程无需任何大模型调用或 `.e2e/cache/` 缓存文件。

如需从 iOS 与 Android 录制会话生成确定性的 `@softprobe/e2e/mobile` 或 Maestro 套件，请参阅[如何测试 iOS 与 Android 应用](/zh/ui-testing/mobile#generate-from-sessions)。如需直接用自然语言编写 `agent.act` 步骤并缓存到 `.e2e/cache/`，请参阅[如何用 `e2e` 编写自然语言 UI 测试](/zh/ui-testing/natural-language)。

## 断言后端出站 HTTP 调用并清理测试数据 {#outbound-assertions}

在 `playwright.config.ts` 中配置 `BlackboxSink`，断言每次前端交互触发的后端下游 HTTP 请求。在 `afterEach` 中清理测试产生的业务数据，保证多次运行幂等互不干扰。

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
				token: process.env.SOFTPROBE_TOKEN,
				workspaceId: process.env.SOFTPROBE_WORKSPACE_ID,
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

- **抛出 `TraceInstrumentationError` 且错误码为 `TRACE_INSTRUMENTATION_MISSING`。** 浏览器已发送 `traceparent` 请求头，但 Blackbox 在默认的 `30000` 毫秒 `pollTimeoutMs` 超时时间内未收到对应的后端 `SERVER` span。请确认后端已配置 OTLP 导出或挂载 OpenTelemetry OBI，核对 `SOFTPROBE_WORKSPACE_ID` 与 `SOFTPROBE_TOKEN`，并在跨域接口的 `Access-Control-Allow-Headers` 中放行 `traceparent`。
- **抛出 `TraceAssertionError` 且错误码为 `TRACE_ASSERTION_FAILED`。** 后端 `SERVER` span 已写入 Blackbox，说明链路透传正常，但没有下游 `CLIENT` HTTP 请求匹配 `trace.outboundHttp`，或出现了违反 `trace.expectNoOutboundHttp` 的下游调用。可直接打开报错信息中的 `explorerTraceUrl`，或在 [Blackbox MCP](/zh/blackbox/coding-agent-skills) 中调用 `get_trace` 检查记录到的真实请求。

## 相关文档 {#related}

- [教程：构建第一个自动生成 UI 与后端联调测试](/zh/ui-testing/tutorial)
- [如何用 `e2e` 编写自然语言 UI 测试](/zh/ui-testing/natural-language)
- [JavaScript 与 TypeScript SDK 参考](/zh/blackbox/reference/softprobe-js#softprobe-e2e)
