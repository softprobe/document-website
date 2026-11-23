---
title: 构建第一个自动生成 UI 与后端联调测试
---

# 构建第一个自动生成 UI 与后端联调测试

在本教程中，你将搭建一个轻量的团队成员邀请 Web 应用，把一次真实浏览器操作录制到 [Softprobe Explorer](https://explorer.softprobe.ai)，并将这条会话分别编译为 `@playwright/test` 套件与零大模型调用的 `e2e` 套件。随后你将在页面照常显示邀请成功提示的情况下让后端漏发邮件请求，验证自动生成的测试如何拦截这类隐蔽回归缺陷。

开始前，请安装 Node.js 22.13 或更高版本，并在 [Softprobe Explorer](https://explorer.softprobe.ai) 中创建一把 Agent Ingestion Key（`spk_...`）以及用于查询的 API Token 和 Workspace ID。如果你希望使用 Docker 在本地自托管 Explorer，请先完成[自托管 Blackbox](/en/blackbox/self-hosting)。

## 1. 创建示例应用

首先创建空目录并安装 Softprobe SDK、Playwright、`e2e` 以及 OpenTelemetry HTTP 自动埋点依赖：

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

接着创建 `otel.mjs`，让 Node.js 后端将入站 `SERVER` 与出站 `CLIENT` HTTP span 自动导出到 Softprobe：

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

再创建 `server.cjs`，包含团队邀请表单、监听在 `4174` 端口模拟外部邮件服务商的本地 Webhook 接收端，以及开启了 `captureSemanticActions: true` 与 `inputCapture: "secrets-only"` 的 `@softprobe/web-record` 脚本：

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

在第一个终端配置 `INGESTION_KEY` 并启动服务：

```bash
export INGESTION_KEY="spk_REPLACE_WITH_YOUR_INGESTION_KEY"
node --import ./otel.mjs server.cjs
```

终端会打印：

```text
Invite demo listening at http://127.0.0.1:4173
```

## 2. 录制一次浏览器会话

在 Chrome 浏览器中打开 `http://127.0.0.1:4173`：

1. 在 **Teammate email** 输入框填写 `ada@example.com`。
2. 在 **Workspace role** 下拉框选择 **Admin**。
3. 在 **Confirm admin password** 密码框填写 `Sup3rS3cretAdminPass!`。
4. 点击 **Send invite**，确认页面显示 `Invitation queued for ada@example.com (admin)`。
5. 打开浏览器开发者工具 Console，执行 `await window.__softprobeSession.flush(); window.__softprobeSession.sessionId` 立即上报数据并复制打印出的 `SESSION_ID`。

打开 [Softprobe Explorer](https://explorer.softprobe.ai) 的 **Sessions** 页面并点击刚生成的会话。切到 **Trace** 标签页，你会看到 4 条 `UI`（`softprobe.ui.action`）动作 span，以及与之关联的 `POST /api/invites` 和 `POST /v1/email/send` 后端 HTTP span；其中密码框内容已被脱敏为 `{ "kind": "secret", "slot": "PASSWORD" }`，不会上传明文密码。

## 3. 生成并运行 `@playwright/test` 测试套件

打开第二个终端，配置 Explorer 查询凭据与 `SESSION_ID`，将录制的会话编译到 `./pw-suite` 目录：

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

终端会输出 JSON 摘要，显示已编译 `4` 个前端动作与 `1` 条后端出站 HTTP 断言：

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

你也可以直接在 Explorer 会话详情页顶部点击 **Generate E2E test** 预览或下载测试文件，或点击 **Copy command** 复制上面的 CLI 命令。

打开生成的 `pw-suite/tests/recorded-session.spec.ts` 查看编译结果：

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

传入 `SP_SECRET_PASSWORD` 运行生成的 Playwright 用例：

```bash
SP_SECRET_PASSWORD="Sup3rS3cretAdminPass!" \
npx playwright test --config ./pw-suite/playwright.config.ts
```

你会看到测试通过：

```text
Running 1 test using 1 worker
  1 passed (4.8s)
```

## 4. 拦截隐蔽的后端漏发回归

现在我们在不改动前端文案的前提下制造一个后端回归缺陷。回到第一个终端按 `Ctrl+C` 停止服务，带上 `SKIP_EMAIL=1` 重新启动：

```bash
SKIP_EMAIL=1 node --import ./otel.mjs server.cjs
```

开启 `SKIP_EMAIL=1` 后，`POST /api/invites` 仍然返回 `200 OK`，浏览器依然显示 `Invitation queued for ada@example.com (admin)`。只检查 DOM 的常规 UI 测试此时仍会误判通过。

在第二个终端重新运行生成的 Playwright 用例：

```bash
SP_SECRET_PASSWORD="Sup3rS3cretAdminPass!" \
npx playwright test --config ./pw-suite/playwright.config.ts
```

测试会立即抛出 `TraceAssertionError` 失败，并直接打印出漏发 `/v1/email/send` 请求的那条 Explorer Trace 链接：

```text
TraceAssertionError: No outbound HTTP call on trace 468763bd2fd104fbbc9da925d5d1524f matched (method=POST, url=/\/v1\/email\/send$/, status=200) within 30000ms. Observed outbound calls: none. Inspect trace at https://explorer.softprobe.ai/?trace=468763bd2fd104fbbc9da925d5d1524f.
```

继续下一步前，请在第一个终端停掉服务并去掉 `SKIP_EMAIL=1` 重新启动正常后端：

```bash
node --import ./otel.mjs server.cjs
```

## 5. 生成并运行零 LLM 的 `e2e` 套件

最后我们将同一条录制会话编译为 `e2e` 测试套件：

```bash
npx softprobe-compile-session \
	--session-id "$SESSION_ID" \
	--runner e2e \
	--target-url http://127.0.0.1:4173 \
	--out ./e2e-suite \
	--json
```

`softprobe-compile-session` 会生成 `e2e-suite/tests/recorded-session.e2e.ts`、`e2e-suite/e2e.config.ts`，以及预置的 `.e2e/cache/<sha256>.json` 动作缓存。在不配置任何大模型 API Key 的情况下直接运行 `e2e`：

```bash
cd e2e-suite
CI=true \
E2E_TELEMETRY_DISABLED=1 \
SP_SECRET_PASSWORD="Sup3rS3cretAdminPass!" \
../node_modules/.bin/e2e run --reporter list
```

用 Node.js 检查 `.e2e/report.json`，确认用例通过且模型 Token 与模型调用次数均为 `0`：

```bash
node -e 'const r = JSON.parse(fs.readFileSync(".e2e/report.json", "utf8")); console.log(r.run.summary.passed, r.run.usage.modelTokens, r.run.usage.maxModelCallsInStep);'
```

终端会输出：

```text
1 0 0
```

## 下一步

- 将会话生成测试接入真实前端与 CI 流水线，请参阅[如何从录制的会话生成 UI 测试](/zh/ui-testing/from-sessions)。
- 无需预先录制浏览器会话，直接用自然语言从零编写测试，请参阅[如何用 `e2e` 编写自然语言 UI 测试](/zh/ui-testing/natural-language)。
