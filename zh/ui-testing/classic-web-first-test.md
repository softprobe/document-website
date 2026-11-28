---
title: 用自然语言测试旅游网站
---

# 用自然语言测试旅游网站

本教程将编写一个测试，搜索从伦敦到巴黎的航班，检查搜索结果并完成预订。测试使用 `agent.act()` 以自然语言描述操作。

我们会测试一个示例网站，无需修改网站代码。本例检查页面，不向 Blackbox 发送会话。需要检查服务端请求时，可以用 Softprobe 将测试与后端跟踪关联起来。

## 准备工作

你需要 Docker、Node.js 22.13 或更高版本，以及 Gemini API 密钥。你需要在终端运行命令并复制 TypeScript 测试代码。如果不熟悉这些工具，可以和开发人员或自动化测试同事一起完成配置。

测试会将操作指令和页面信息发送给模型服务商。测试自己的应用前，请使用测试环境和虚构数据，并了解服务商的数据处理政策。首次运行以及后续缓存无法回放时，模型调用都可能产生费用。

## 1. 启动示例网站

在终端运行：

```bash
docker run -d --rm --name travel-ui-tutorial \
	-e TRAVEL_AGENT_PORT=18080 \
	-p 127.0.0.1:18080:18080 \
	docker.io/softprobe/demo-ota:v1.3.1
```

在浏览器打开 [http://127.0.0.1:18080](http://127.0.0.1:18080)。页面应显示 **Flight Search**，包含出发和到达机场输入框。如果端口 18080 已被占用，请选择一个可用端口，并替换 Docker 命令和下方测试配置中的 `18080`。

## 2. 配置测试

创建文件夹并安装测试工具：

```bash
mkdir travel-ui-test && cd travel-ui-test
npm init -y
npm pkg set type=module
npm install -D @softprobe/e2e@0.2.8 e2e@0.24.0 @e2e-dev/web@0.16.1 @playwright/test @ai-sdk/google@4 ai@^7 zod
npx playwright install chromium
```

在该文件夹中创建 `e2e.config.ts`：

```ts
import { google } from "@ai-sdk/google";
import type { E2EConfig } from "e2e";
import { softprobeCachedAgent, softprobeWeb } from "@softprobe/e2e";

export default {
	projectId: "travel-ui-test",
	workers: 1,
	tests: "tests/**/*.e2e.ts",
	cache: {
		dir: ".e2e/cache",
		mode: "read-write",
	},
	agents: {
		default: softprobeCachedAgent({
			model: google("gemini-2.5-flash"),
		}),
	},
	targets: [{
		name: "web",
		engine: softprobeWeb(),
		app: { url: "http://127.0.0.1:18080", identity: "travel-demo" },
	}],
} satisfies E2EConfig;
```

## 3. 编写测试

创建 `tests` 文件夹，再创建 `tests/booking.e2e.ts`：

```ts
import { expect, test } from "@softprobe/e2e";

test("books a flight from London to Paris", async ({ app, agent, screen }) => {
	await app.open("/");
	await agent.act("Select London Heathrow as the departure airport and Paris Charles de Gaulle as the arrival airport, then click Search.");
	await expect(screen.getByText("Flight Search Results")).toBeVisible();
	await expect(screen.getByRole("button", { name: /Select/ }).first()).toBeVisible();
	await agent.act("Select the first flight and book the first fare. Enter the passenger first name Alex, last name Tester, passport number TEST123456, phone 2025550100, and email alex@example.test. Confirm the booking.");
	await expect(screen.getByText("Booking Reference")).toBeVisible();
	await agent.act("Choose Credit Card/Debit Card. Enter cardholder Alex Tester, test card number 4111111111111111, expiry 12/30, and CVV 123. Click Pay Now.");
	await expect(screen.getByText("Payment Successful!")).toBeVisible();
});
```

这些检查确认至少有一个航班可供选择、页面显示预订参考号，并且示例网站报告支付成功。示例使用虚构的乘客信息和测试卡号，不检查是否收到邮件。

![示例网站的航班搜索结果](/img/ui-testing/travel-search-results.png)

你看到的航班和价格可能不同。图片展示的是示例页面，不是测试结果。

![带有预订参考号的示例支付成功页面](/img/ui-testing/travel-booking-confirmation.png)

示例网站显示支付成功消息和预订参考号。图片展示的是操作过程，不是测试结果。

## 4. 运行测试

在终端环境中设置 `GOOGLE_GENERATIVE_AI_API_KEY`。在 Bash 中，可以输入密钥而不显示内容：

```bash
read -r -s -p "Gemini API key: " GOOGLE_GENERATIVE_AI_API_KEY; echo
export GOOGLE_GENERATIVE_AI_API_KEY
```

运行测试：

```bash
E2E_TELEMETRY_DISABLED=1 npx e2e run
```

首次运行时，模型会执行操作。测试成功后，终端会报告一个测试通过，例如：

```text
Test Files  1 passed (1)
     Tests  1 passed (1)
```

如果测试失败，请查看终端输出并确认示例页面可以访问。

要测试自己的应用，请替换应用地址、操作步骤和页面检查。请使用测试数据和安全的测试环境。

## 关于本地缓存

运行器可以将操作步骤保存在 `.e2e/cache/` 中，并在之后运行时回放。示例网站的航班信息和价格会变化，因此缓存可能无法回放，运行器可能再次调用模型。运行本例时请保留模型密钥。缓存保存在本地，不会上传到 Blackbox。分享或提交缓存文件前，请检查其中是否包含敏感信息。

完成后停止示例网站：

```bash
docker stop travel-ui-tutorial
```

如需检查后端发出的请求，请参阅[编写同时检查后端的自然语言 UI 测试](/zh/ui-testing/natural-language)。
