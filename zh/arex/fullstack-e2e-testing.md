---
title: 编写全栈 AI 端到端测试
---

# 编写全栈 AI 端到端测试

`@softprobe/e2e` 将 [`e2e`](https://github.com/e2e-inc/e2e) 浏览器自动化步骤与跨 Softprobe Blackbox（`thelake` 或本地 Explorer）及 Arex（`sp-backend`）的 W3C `traceparent` 链路校验结合在一起。同一份 `.e2e.ts` 用例既能驱动页面并把自然语言操作缓存到 `.e2e/cache/`（CI 回放时零模型调用），又能直接断言后端向下游服务发出的真实出站 HTTP 请求与消息体。

## 检查前置条件 {#prerequisites}

1. 安装 Node.js `^22.22.3 || >=24.8.0`，并用 `sp doctor --e2e` 校验运行环境：

	```bash
	sp doctor --e2e --json
	```

	确认 `data.checks` 中的 `e2e-node` 项返回 `"status": "healthy"`。机器上有多个 Node.js 版本时，可通过 `SP_E2E_NODE_BIN` 指定兼容的 `node` 可执行文件。

2. 在测试目录安装 `@softprobe/e2e`、`e2e`、`@e2e-dev/web` 与 `zod`：

	```bash
	npm install -D @softprobe/e2e e2e@0.24.0 @e2e-dev/web@0.24.0 zod
	```

3. 如果工程中还没有 `e2e.config.ts`，先生成脚手架和示例用例：

	```bash
	sp test init --json
	```

4. 确认被测后端已接入链路采集并接受入站 W3C `traceparent` 请求头：
	- **Blackbox**：后端开启 OpenTelemetry HTTP 埋点或挂载 Softprobe OBI，将 span 导出到 `thelake` 或本地 Explorer。
	- **Arex**：后端挂载 `sp-agent.jar` 或 Softprobe OBI，连接到 `sp-backend`（`v2.1` 及以上版本）。

	如果前端页面跨域请求后端接口，请在后端 CORS 配置中放行 `traceparent` 请求头（`Access-Control-Allow-Headers: traceparent`）。

## 配置 `e2e.config.ts` {#configure}

在 `e2e.config.ts` 中把目标引擎设为 `softprobeWeb`，并在 `reporters` 中加入 `softprobeReporter()`。`softprobeWeb` 在 Playwright `browser.route` 层拦截 API 请求：前端已加载 [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record) 时会原样保留它生成的 `traceparent` 请求头，未加载时则直接补齐 W3C `traceparent` 请求头，不向页面注入额外脚本。

### 连接 Blackbox（`thelake` 或本地 Explorer） {#configure-blackbox}

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

### 连接 Arex（`sp-backend`） {#configure-arex}

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

如果省略 `sink` 直接写 `softprobeWeb({ appId: "travel-ota" })`，`@softprobe/e2e` 会自动读取 `sp test run` 从 XDG 配置注入的 `SP_API_URL`、`SP_TOKEN` 和 `SP_TENANT_ID`。当浏览器页面请求的后端域名或端口与 `app.url` 不同时，请通过 `apiOrigins` 显式列出后端地址。

## 编写全栈 `.e2e.ts` 用例 {#write-a-test}

从 `@softprobe/e2e` 导入 `test`、`describe`、`afterEach` 和 `expect`。请直接使用 `@softprobe/e2e` 重新导出的原生 `expect`，并在 `agent.act(...)` 之后紧跟可见的页面 `expect(...)` 断言，使 `e2e` 在确认断言通过后把步骤写入 `.e2e/cache/`。不要覆盖 `expect`，也不要用带 `mutates: true` 的 `defineTool` 包装会改动状态的页面操作。

下面的用例向工作区邀请 `lc@softprobe.ai`，断言页面出现待接受邀请行与 **Revoke** 按钮，通过 `trace.outboundHttp` 断言后端向 EmailEngine 发出了状态码为 `200` 且收件人为 `lc@softprobe.ai` 的 HTTP `POST` 请求，并通过 `trace.expectNoOutboundHttp` 断言重复邀请已有成员返回 `409` 时不会向下游邮件服务发请求：

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

### 用 `trace.window` 隔离同一接口的多次请求 {#trace-window}

同一个用例多次触发同一个后端路由时，用 `trace.window` 包住单次操作，让返回的 `TraceScope` 只匹配该回调期间发出的浏览器请求：

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

## 运行测试并验证零 LLM 缓存回放 {#run-and-verify-cache}

连续执行两次 `sp test run --json`：

```bash
sp test run tests/workspace-invite.e2e.ts --json
sp test run tests/workspace-invite.e2e.ts --json
```

核对两次 JSON 输出：

1. **第一次运行**执行 `agent.act(...)`，生成 `.e2e/cache/` 缓存，并完成后端链路校验（`"passed": 2`、`"failed": 0`、`"verifiedTraces"` 非空）。
2. **第二次运行**直接回放缓存的页面操作，不再调用大模型（`"modelCalls": 0`、`"modelTokens": 0`），同时浏览器仍发出带全新 W3C `traceId` 的真实请求，并在 `"verifiedTraces"` 中校验当次后端出站调用。

将 `tests/*.e2e.ts` 和 `.e2e/cache/` 一并提交到 Git，使 CI 任务在零 LLM 调用的前提下同时拦截前端交互回归与后端下游调用异常。

## 将录制的 Blackbox 会话编译为端到端测试 {#compile-from-session}

当前端应用在 Blackbox 中开启了实时语义化 UI 动作采集后，`sp test from-session` 可以把一段录制好的真实浏览器会话直接编译为独立的 `@playwright/test` 测试套件，或带预置缓存的 `@softprobe/e2e` 测试套件，并自动生成 `trace.outboundHttp(...)` 后端出站调用断言。

1. 在 [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record) 中开启 `captureSemanticActions: true` 与 `inputCapture: "secrets-only"`：

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

	启用 `inputCapture: "secrets-only"` 后，普通输入框会保留真实输入值供编译器生成用例，而密码框、银行卡号、一次性验证码、名称含 `token` 或 `secret` 的输入框，以及命中 `secretSlots` CSS 选择器的输入框只导出 `{ kind: "secret", slot }` 槽位引用，既不会把明文密钥上传到遥测后端，也不会因全量打星号而导致无法生成可执行脚本。通过 HTML `<script>` 标签接入时，可配置 `data-capture-semantic-actions="true"` 与 `data-input-capture="secrets-only"`。

2. 按目标运行器编译录制会话：

	- **独立的 `@playwright/test` 套件（`--runner playwright`）。** 适合不需要自然语言扩展、追求纯确定性回归的流水线：

		```bash
		sp test from-session <sessionId> --runner playwright --out ./e2e-playwright --json
		```

		编译器会输出 `tests/recorded-session.spec.ts` 与 `playwright.config.ts`。生成的测试文件从 `@softprobe/e2e/playwright` 导入 `{ expect, test }`，从 `process.env.SP_SECRET_<SLOT>` 读取敏感槽位，通过 `page.waitForResponse` 同步前后端网络轮次，将后端响应派生的动态文案参数化为正则表达式，并通过 `trace.outboundHttp(...)` 校验下游调用。使用 Playwright 直接运行生成的用例：

		```bash
		cd ./e2e-playwright
		SP_SECRET_PASSWORD=... npx playwright test
		```

	- **带预置零 LLM 缓存的 `@softprobe/e2e` 混合套件（`--runner e2e`）。** 适合先零成本回放已录制的前缀步骤，再在末尾追加新步骤：

		```bash
		sp test from-session <sessionId> --runner e2e --out ./e2e --json
		```

		编译器会输出 `tests/recorded-session.e2e.ts`、默认挂载 `softprobeCachedAgent()` 的 `e2e.config.ts`，以及预置的 `.e2e/cache/<sha256>.json` `trace-1` `ActionTrace` 缓存文件。首次执行 `sp test run --dir ./e2e --json` 时，录制前缀会直接命中预置缓存，以 `"modelCalls": 0` 完成回放。如果要在录制流程之后继续验证未录制的新交互，只需在 `e2e.config.ts` 中向 `softprobeCachedAgent({ model })` 传入模型实例，在用例末尾追加新的 `await agent.act(...)` 与可见的 `expect(screen...)` 断言，再连续执行两次 `sp test run --dir ./e2e --json`，第二次运行即可对整条用例实现 `"modelCalls": 0` 缓存回放。

## 在 `sp code` 中用自然语言生成测试 {#author-in-sp-code}

当工程目录安装了 `node_modules/e2e` 且本机有兼容的 `node` 时，`sp code` 与 `sp code web` 会自动在 Node.js 下挂载本地 `e2e` MCP 服务并注入 `E2E_TELEMETRY_DISABLED=1`。

1. 在工程目录启动工作台：

	```bash
	sp code
	```

2. 直接用一句话描述全栈测试需求：

	```text
	在 tests/workspace-invite.e2e.ts 中编写并验证 @softprobe/e2e 测试：
	邀请 lc@softprobe.ai 加入测试工作区，确认页面出现待处理邀请行与 Revoke 按钮，
	校验后端发往 EmailEngine 的 POST 请求收件人为 lc@softprobe.ai，
	并确认重复邀请现有 owner 返回 409 且不发送出站邮件请求。
	```

3. `sp code` 会通过 `e2e` MCP（`open_session`、`navigate`、`tap`、`type`、`observe`）走通一次真实页面，查询捕获到的后端链路（Blackbox 下调用 Blackbox MCP 的 `get_trace`，Arex 下调用 `sp trace outbound <traceId> --app <appId> --json`）确认脱敏后的真实消息体结构，生成 `tests/workspace-invite.e2e.ts`，并连续两次运行 `sp test run --json`，确认第二次运行以 `"modelCalls": 0` 通过。

你也可以直接把一段已录制的 Blackbox `sessionId` 交给 `sp code`。`sp code` 会读取 `recordings.sessionActions` 检查录制到的 `softprobe.ui.action` 语义步骤、关联后端链路与所需的 `SP_SECRET_<SLOT>` 环境变量，再调用 `sp test from-session` 生成并验证 `@playwright/test` 或 `@softprobe/e2e` 测试套件。

## 排查链路失败 {#troubleshoot}

`@softprobe/e2e` 先等待后端入口 `SERVER` span 落库，再校验出站 `CLIENT` HTTP 调用，从而把埋点缺失与业务断言失败区分开：

- **`TraceInstrumentationError`（`code: "TRACE_INSTRUMENTATION_MISSING"`）**：浏览器已发出 `traceparent`，但在 `pollTimeoutMs`（默认 `15000` 毫秒）内存储端一直处于 `state: "awaiting_server_span"`。请检查后端 OTLP 导出、`sp-agent.jar` 或 OBI 挂载状态、`workspaceId`（Blackbox）或 `appId`（Arex），以及后端 CORS 是否允许 `traceparent`。
- **`TraceAssertionError`（`code: "TRACE_ASSERTION_FAILED"`）**：后端 `SERVER` span 已到达，说明链路透传正常，但没有匹配到期望的出站 `CLIENT` HTTP 请求（`outboundHttp`），或出现了不该发出的下游请求（`expectNoOutboundHttp`）。Arex 下可执行 `sp trace outbound <traceId> --app <appId> --json` 查看当次录制的全部出站请求；Blackbox 下可直接打开报错信息中的 `explorerTraceUrl` 在 Softprobe Explorer 中查看完整链路。

## 相关文档 {#related}

- [sp test：全栈端到端测试](/zh/arex/commands/test)
- [sp trace：链路查询](/zh/arex/commands/trace)
- [`@softprobe/e2e` API 参考（英文）](/en/blackbox/reference/softprobe-js#softprobe-e2e)
