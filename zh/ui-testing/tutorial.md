---
title: 根据录制会话编写 UI 测试
---

# 根据录制会话编写 UI 测试

录制一次真实的机票预订流程，在 Softprobe Explorer 中检查浏览器动作和后端调用，再把流程写成可重复运行的 Playwright 测试。测试会同时校验用户看到的页面和后端是否发送了预订确认请求。

开始前请安装 Docker 和 Node.js 22.13 或更高版本。下面公开的演示 **Ingestion Key** 只能为绑定的演示 Agent 发送遥测数据，不能读取会话。测试查询链路需要一个对演示 Workspace 有读取权限的 **Softprobe API Key**，并通过 `SOFTPROBE_API_KEY` 提供。

后端 span 通过 OBI 采集，需要受支持的 Linux 环境：`amd64` 或 `arm64`、Linux 内核 5.8 或更高版本（RHEL 系 4.18+ 且包含所需 eBPF backport）、启用 BTF，并具备必要的 eBPF 权限。下面的 `--privileged` 为容器提供所需权限，但 Docker 主机仍必须使用受支持的 Linux 内核。参阅 [OBI 兼容性要求](https://opentelemetry.io/docs/zero-code/obi/#compatibility)。

## 1. 启动预埋点演示应用

在终端 1 启动 `docker.io/softprobe/demo-ota:classic-blackbox`：

```bash
export INGESTION_KEY="spk_UIKFA-detIGQsdXzGszOM6Xb0UTpmbBD"

docker run --rm --privileged --name demo-ota-tutorial \
	-p 8080:8080 \
	-e INGESTION_KEY="$INGESTION_KEY" \
	docker.io/softprobe/demo-ota:classic-blackbox
```

该容器在 `8080` 端口提供机票预订应用，运行 Java 后端和本地 PostgreSQL，使用 `@softprobe/web-record` 发送浏览器遥测数据，并使用 OBI 采集后端 span。

在终端 2 等待应用就绪：

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/index.html
```

返回 `200` 后继续。

## 2. 录制并检查预订会话

在 Chrome 中打开 `http://127.0.0.1:8080` 并预订机票：

1. 在 **Departure Airport** 中选择 **London Heathrow (LHR)**，在 **Arrival Airport** 中选择 **Paris Charles de Gaulle (CDG)**。
2. 选择未来的 **Departure** 日期，然后点击 **Search**。
3. 在 `list.html` 中点击第一班航班的 **Select**。
4. 在 `detail.html` 中点击第一个票价选项的 **Book**。
5. 在 `booking.html` 中填写以下模拟信息，然后点击 **Confirm Booking**：Last Name `Demo`、First Name `Alex`、Document Type `Passport`、Document Number `DEMO000001`、Phone Number `+12025550100` 和 Email Address `alex@example.com`。
6. `payment.html` 加载后，打开浏览器 DevTools 控制台，运行 `await window.__softprobeSession.flush(); window.__softprobeSession.sessionId`。保存返回值作为 `SESSION_ID`。

在 [Softprobe Explorer](https://explorer.softprobe.ai) 中打开 **Sessions**，找到刚录制的会话并检查 UI 动作及其相关 trace。你应能看到浏览器 `softprobe.ui.action` span，以及 `travel-ota` 服务端 span、PostgreSQL 查询、航空 NDC 调用和确认请求。根据录制的动作顺序和定位器编写下面的 Playwright 测试。保留 `SESSION_ID` 以重新打开或查询这次录制；测试运行时会创建新的 trace。

浏览器刷新后，服务端 span 可能稍后到达。如果会话暂时只显示 UI 动作，请刷新会话视图，等预订和确认 span 出现后再继续。

## 3. 根据录制流程编写 Playwright 测试

在终端 2 创建测试项目并安装已发布的 SDK 与 Playwright 版本：

```bash
mkdir softprobe-ui-tutorial && cd softprobe-ui-tutorial
npm init -y
npm pkg set type=module
npm install -D @softprobe/e2e@0.2.7 @playwright/test@1.64.1
npx playwright install chromium
mkdir tests
```

创建 `playwright.config.ts`：

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	use: { baseURL: "http://127.0.0.1:8080" },
});
```

创建 `tests/booking.spec.ts`。浏览器操作对应刚录制的流程。`trace.outboundHttp` 会检查预订请求是否触发了航空公司调用和确认请求：

```ts
import { expect, test } from "@softprobe/e2e/playwright";

function dateInDays(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() + days);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

test("books a flight and sends its confirmation", async ({ page, trace }) => {
	await page.goto("/");
	await page.locator("#fromCity").selectOption("LHR");
	await page.locator("#toCity").selectOption("CDG");
	await page.locator("#departureDate").fill(dateInDays(14));
	await page.getByRole("button", { name: /Search/i }).click();
	await expect(page).toHaveURL(/list\.html/);

	await page.getByRole("button", { name: /^Select\b/ }).first().click();
	await expect(page).toHaveURL(/detail\.html/);
	await page.getByRole("button", { name: /^Book\b/ }).first().click();
	await expect(page).toHaveURL(/booking\.html/);

	await page.locator('input[name="passenger_1_lastName"]').fill("Demo");
	await page.locator('input[name="passenger_1_firstName"]').fill("Alex");
	await page.locator('select[name="passenger_1_documentType"]').selectOption("PASSPORT");
	await page.locator('input[name="passenger_1_documentNumber"]').fill("DEMO000001");
	await page.locator("#contactPhone").fill("+12025550100");
	await page.locator("#contactEmail").fill("alex@example.com");
	const confirmButton = page.getByRole("button", { name: /Confirm Booking/i });
	await confirmButton.scrollIntoViewIfNeeded();
	await confirmButton.click();
	await expect(page).toHaveURL(/payment\.html/);

	const triggeredBy = { method: "POST", path: "/api/flights/book" };
	const offerPrice = await trace.outboundHttp({
		triggeredBy,
		method: "POST",
		url: /\/ndc\/v21\.3\/offerprice$/,
		status: 200,
	});
	expect(offerPrice.request.json).toMatchObject({
		IATA_OfferPriceRQ: { Request: { PricedOffer: expect.any(Object) } },
	});

	await trace.outboundHttp({
		triggeredBy,
		method: "POST",
		url: /\/ndc\/v21\.3\/ordercreate$/,
		status: 200,
	});
	const confirmation = await trace.outboundHttp({
		triggeredBy,
		method: "POST",
		url: /\/v1\/notifications\/confirmation$/,
		status: 200,
	});
	expect(confirmation.request.json).toMatchObject({
		recipientEmail: "alex@example.com",
	});
});
```

请向演示 Workspace 管理员索取具有读取权限的 Softprobe API Key，在终端 2 设置后运行测试：

```bash
export SOFTPROBE_API_KEY="YOUR_SOFTPROBE_API_KEY"
npx playwright test
```

测试应通过。Playwright fixture 会为浏览器请求创建 trace，并从 Blackbox 查询这些请求触发的后端调用。API Key 会解析 Workspace，因此无需单独设置 Workspace ID。

## 4. 捕获隐蔽的后端回归

在终端 1 按 `Ctrl+C` 停止容器，然后启用确认请求故障并重新启动：

```bash
docker run --rm --privileged --name demo-ota-tutorial \
	-p 8080:8080 \
	-e INGESTION_KEY="$INGESTION_KEY" \
	-e OTA_FAULT_SKIP_EMAIL=true \
	docker.io/softprobe/demo-ota:classic-blackbox
```

预订仍会成功并进入 `payment.html`，但后端会跳过确认请求。再次运行相同的 Playwright 测试：

```bash
npx playwright test
```

测试应在确认请求的 `trace.outboundHttp` 断言处失败，因为 Blackbox 中没有匹配的调用。实际执行的航空公司调用仍会显示出来。这样可以发现仅检查页面时会漏掉的后端回归。

继续操作前停止故障模式容器，并在不设置 `OTA_FAULT_SKIP_EMAIL=true` 的情况下重新启动它。

## 后续阅读

- [将录制会话作为测试计划](/zh/ui-testing/from-sessions)
- [用自然语言编写 UI 测试](/zh/ui-testing/natural-language)
- [JavaScript 与 TypeScript SDK 参考](/en/blackbox/reference/softprobe-js#softprobe-e2e)
