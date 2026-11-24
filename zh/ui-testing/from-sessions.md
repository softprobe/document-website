---
title: 将录制会话作为测试计划
---

# 将录制会话作为测试计划

录制一次浏览器流程，在 Softprobe Explorer 中检查动作和相关后端调用，然后编写一个可重复运行的 Playwright 测试。录制结果提供真实的动作顺序、定位器和请求路径作为起点；测试代码保存在你的代码仓库中，同时检查页面状态和后端行为。

`@softprobe/web-record` 将语义浏览器动作记录为 `softprobe.ui.action` span。`@softprobe/e2e/playwright` fixture 会为浏览器请求添加 W3C `traceparent` 请求头，并允许测试查询这些请求触发的后端 `CLIENT` 调用。

## 开启语义动作采集 {#enable-capture}

在浏览器入口中初始化 [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record)：

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

Connect Agent 设置提示默认开启语义动作采集。使用 `inputCapture: "secrets-only"` 时，普通表单值可用于重现流程；密码、银行卡号、一次性验证码、名称中包含 token 或 secret 的输入值会转换为命名 slot，而不会以明文发送。有关输入屏蔽和路由设置，请参阅 [JavaScript SDK 参考](/en/blackbox/reference/softprobe-js#softprobe-web-record)。

在后端导出 OpenTelemetry span，或使用相同 Agent Ingestion Key 运行官方 OpenTelemetry OBI。参阅[端到端会话追踪与请求消息体](/en/blackbox/end-to-end-session-tracing)了解后端设置。如果浏览器调用跨域 API，请在 `Access-Control-Allow-Headers` 中允许 `traceparent`。

## 录制并检查流程 {#inspect-session}

在应用中完成流程，然后打开 Softprobe Explorer 的 **Sessions** 并选择新会话。查看 `softprobe.ui.action` span 以记录动作顺序、标签和值。沿着相关 trace 检查后端请求路径及影响该行为的下游调用。

录制时使用模拟表单值。公开的演示 Agent Ingestion Key 只能为绑定的 Agent 写入遥测数据，不能读取会话。测试中的会话与 trace 查询需要对 Workspace 有读取权限的 Softprobe API Key，并通过 `SOFTPROBE_API_KEY` 提供。

## 编写 Playwright 测试 {#write-test}

在测试项目中安装 SDK 和 Playwright：

```bash
npm install -D @softprobe/e2e @playwright/test
npx playwright install chromium
```

根据录制中的动作编写浏览器步骤。从 `@softprobe/e2e/playwright` 导入 `test` 即可获得 `trace` fixture：

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

请将示例中的路由、定位器和断言替换为录制会话中的真实值。

设置一个对会话 Workspace 有读取权限的 Softprobe API Key，然后运行测试：

```bash
SOFTPROBE_API_KEY="YOUR_SOFTPROBE_API_KEY" npx playwright test
```

API Key 会解析 Workspace，因此无需单独设置 Workspace ID。`trace.outboundHttp` 会等待匹配的后端 span；如果未出现，则以 `TraceAssertionError` 失败。完整的机票预订示例和确认请求故障模式请参阅[教程](/zh/ui-testing/tutorial)。

## 保持测试可重复运行 {#repeatable}

- 优先使用 label 和 role 等稳定定位器。如果录制结果只有 CSS 选择器，请使用持久的 `data-testid`，避免使用动态生成的 class 名。
- 使用模拟值，并将凭据放在环境变量或 Playwright fixture 中。
- 清理每次测试创建的数据，以便重复运行。
- 聚焦于一个用户结果，并断言能证明该结果发生的后端副作用。

若要使用 `e2e` 编写自然语言动作并通过已提交的缓存回放，请参阅[如何编写自然语言 UI 测试](/zh/ui-testing/natural-language)。
