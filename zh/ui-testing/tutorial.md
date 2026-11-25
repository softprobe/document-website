---
title: 构建第一个自动生成 UI 与后端联调测试
---

# 构建第一个自动生成 UI 与后端联调测试

在本教程中，你将启动预埋点的 [Travel OTA 示例应用](https://github.com/softprobe/demo-ota)单容器镜像（`docker.io/softprobe/demo-ota:classic-blackbox`），把一次真实机票预订浏览器操作录制到 [Softprobe Explorer](https://explorer.softprobe.ai)，并在编码 Agent 中使用 Blackbox MCP 从该会话生成 `@playwright/test` + `@softprobe/e2e` 测试套件。随后你将在订单确认页面照常跳转的情况下开启 `OTA_FAULT_SKIP_EMAIL=true` 让 Java 后端漏发确认邮件请求，验证自动生成的测试如何拦截这类隐蔽回归缺陷。

开始前，请安装 Docker 以及 Node.js 22.13 或更高版本，并在 [Softprobe Explorer](https://explorer.softprobe.ai) 中创建一把 Agent Ingestion Key（`spk_...`）以及用于查询的 API Token 和 Workspace ID。如果你在 Linux 上使用[自托管 Blackbox](/en/blackbox/self-hosting)（`http://127.0.0.1:8787`），请在 `docker run` 中将 `-p 8080:8080` 替换为 `--network host -e OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="http://127.0.0.1:8787/api/thelake/v1/traces"`，并在第二个终端额外配置 `export SOFTPROBE_SINK_ENDPOINT="http://127.0.0.1:8787/api/thelake"`。

## 1. 一键启动预埋点示例容器 {#step-1}

首先创建工作目录并安装 `@softprobe/e2e` 与 Playwright：

```bash
mkdir softprobe-ui-tutorial && cd softprobe-ui-tutorial
npm init -y
npm pkg set type=module
npm install @softprobe/e2e@0.2.8 @playwright/test@1.64.1 zod
npx playwright install chromium
```

在第一个终端配置 `INGESTION_KEY` 并启动预埋点的 `docker.io/softprobe/demo-ota:classic-blackbox` 容器：

```bash
export INGESTION_KEY="spk_REPLACE_WITH_YOUR_INGESTION_KEY"

docker run --rm --privileged --name demo-ota-tutorial \
	-p 8080:8080 \
	-e INGESTION_KEY="$INGESTION_KEY" \
	docker.io/softprobe/demo-ota:classic-blackbox
```

该单容器内置监听在 `8080` 端口的多页面机票预订前端、监听在 `127.0.0.1:8081` 的 Spring Boot Java 21 后端、本地 PostgreSQL（`127.0.0.1:5432`）、支付与邮件通知沙箱服务（`127.0.0.1:8082` 与 `127.0.0.1:8083`），并已自动注入浏览器端 `@softprobe/web-record` 与 Java 后端 OpenTelemetry eBPF Instrumentation（OBI）。

在第二个终端确认应用已就绪：

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/index.html
```

终端会打印：

```text
200
```

## 2. 录制一次机票预订会话 {#step-2}

在 Chrome 浏览器中打开 `http://127.0.0.1:8080` 完成一次订票流程：

1. 在 **From** 选择 **London Heathrow (LHR)**，在 **To** 选择 **Paris Charles de Gaulle (CDG)**。
2. 选择未来的出发日期并点击 **Search**。
3. 在 `list.html` 页面点击第一个航班的 **Select**。
4. 在 `detail.html` 页面点击第一个舱位票价的 **Book**。
5. 在 `booking.html` 页面依次填写 **Last Name**（`Demo`）、**First Name**（`Alex`）、**Document Type**（`Passport`）、**Document Number**（`DEMO000001`）、**Phone Number**（`+12025550100`）与 **Email**（`alex@example.com`），点击 **Confirm Booking**。
6. 等待浏览器跳转到 `payment.html` 后，打开浏览器开发者工具 Console 执行 `await window.__softprobeSession.flush(); window.__softprobeSession.sessionId` 立即上报前端 span 并复制打印出的 `SESSION_ID`。

打开 [Softprobe Explorer](https://explorer.softprobe.ai) 的 **Sessions** 页面并点击刚录制的会话。等待数秒完成 Trace 落盘后切到 **Trace** 标签页，你会看到跨 5 个页面的 `UI`（`softprobe.ui.action`）动作 span，以及与之关联的 `travel-ota` 入站请求、`ota_orders` PostgreSQL 查询、航司 NDC 接口调用（`/ndc/v21.3/airshopping`、`/ndc/v21.3/offerprice`、`/ndc/v21.3/ordercreate`）和 `POST /v1/notifications/confirmation` 邮件通知 span。

## 3. 使用 Blackbox MCP 生成并运行 `@playwright/test` 套件 {#step-3}

在 OpenCode、Claude Code、Cursor 或 Antigravity 中连接 [Blackbox MCP 服务](/zh/blackbox/coding-agent-skills)后，让编码 Agent 根据 `SESSION_ID` 生成 `./pw-suite/tests/recorded-session.spec.ts`：

```text
使用 Blackbox MCP 调用 get_session_semantic_actions 查看会话 <SESSION_ID>，
调用 get_trace 检查订票与支付链路，剔除多余的非交互点击与重试失败请求，
使用 @softprobe/e2e/playwright 在 ./pw-suite/tests/recorded-session.spec.ts 编写 Playwright 测试，
针对 http://127.0.0.1:8080 回放订票流程并断言确认邮件请求（/v1/notifications/confirmation）。
```

在第二个终端配置 Explorer 查询凭据（`SOFTPROBE_TOKEN` 与 `SOFTPROBE_WORKSPACE_ID`），检查编码 Agent 生成的测试文件：

```ts
import { expect, test } from "@softprobe/e2e/playwright";

test.describe("Recorded session replay", () => {
	test("replays session 830501cb-7792-47cf-8a3c-b58929cef6aa", async ({ page, trace }) => {
		await page.goto("/");
		await page.locator("#fromCity").selectOption("LHR");
		await page.locator("#toCity").selectOption("CDG");
		await page.locator("#departureDate").fill("2026-12-07");
		const responsePromise_3 = page.waitForResponse((res) => res.request().method() === "POST" && new RegExp("^\\/api\\/flights\\/[^/]*\\/?$").test(new URL(res.url()).pathname));
		await page.getByRole("button", { name: new RegExp("^[\\s\\p{Co}]*Search[\\s\\p{Co}]*$", "u") }).click();
		await responsePromise_3;
		await expect(page).toHaveURL(new RegExp("^https?:\\/\\/[^/?#]+/list\\.html(?:[?#]|$)"));
		const outbound_3_0_0 = await trace.outboundHttp({
			triggeredBy: { method: "POST", path: new RegExp("^\\/api\\/flights\\/[^/]*\\/?$") },
			method: "POST",
			url: new RegExp("/ndc/v21\\.3/airshopping$"),
			status: 200,
		});
		expect(outbound_3_0_0.status).toBe(200);
		expect(outbound_3_0_0.request.json).toMatchObject({ "IATA_AirShoppingRQ": { "Request": { "FlightCriteria": { "OriginDestCriteria": { "OriginDepCriteria": { "IATA_LocationCode": "LHR", "Date": "2026-12-07" }, "DestArrivalCriteria": { "IATA_LocationCode": "CDG" } } } } } });
		await page.getByRole("button", { name: new RegExp("^[\\s\\p{Co}]*Select[\\s\\p{Co}]+→[\\s\\p{Co}]*$", "u") }).nth(0).click();
		await expect(page).toHaveURL(new RegExp("^https?:\\/\\/[^/?#]+/detail\\.html(?:[?#]|$)"));
		await page.getByRole("button", { name: new RegExp("^[\\s\\p{Co}]*Book[\\s\\p{Co}]*$", "u") }).nth(0).click();
		await expect(page).toHaveURL(new RegExp("^https?:\\/\\/[^/?#]+/booking\\.html(?:[?#]|$)"));
		await page.locator("input[name=\"passenger_1_lastName\"]").fill("Demo");
		await page.locator("input[name=\"passenger_1_firstName\"]").fill("Alex");
		await page.locator("select[name=\"passenger_1_documentType\"]").selectOption("PASSPORT");
		await page.locator("input[name=\"passenger_1_documentNumber\"]").fill("DEMO000001");
		await page.locator("#contactPhone").fill("+12025550100");
		await page.locator("#contactEmail").fill("alex@example.com");
		await page.mouse.wheel(0, 4800);
		const responsePromise_13 = page.waitForResponse((res) => res.request().method() === "POST" && new URL(res.url()).pathname === "/api/flights/book");
		await page.getByRole("button", { name: new RegExp("^[\\s\\p{Co}]*Confirm[\\s\\p{Co}]+Booking[\\s\\p{Co}]*$", "u") }).click();
		await responsePromise_13;
		await expect(page).toHaveURL(new RegExp("^https?:\\/\\/[^/?#]+/payment\\.html(?:[?#]|$)"));
		const outbound_13_0_0 = await trace.outboundHttp({
			triggeredBy: { method: "POST", path: "/api/flights/book" },
			method: "POST",
			url: new RegExp("/ndc/v21\\.3/offerprice$"),
			status: 200,
		});
		expect(outbound_13_0_0.status).toBe(200);
		expect(outbound_13_0_0.request.json).toMatchObject({ "IATA_OfferPriceRQ": { "Request": { "PricedOffer": { "OfferRefID": expect.any(String), "OfferItemRefID": expect.any(String) } } } });
		const outbound_13_0_1 = await trace.outboundHttp({
			triggeredBy: { method: "POST", path: "/api/flights/book" },
			method: "POST",
			url: new RegExp("/ndc/v21\\.3/ordercreate$"),
			status: 200,
		});
		expect(outbound_13_0_1.status).toBe(200);
		const outbound_13_0_2 = await trace.outboundHttp({
			triggeredBy: { method: "POST", path: "/api/flights/book" },
			method: "POST",
			url: new RegExp("/v1/notifications/confirmation$"),
			status: 200,
		});
		expect(outbound_13_0_2.status).toBe(200);
		expect(outbound_13_0_2.request.json).toMatchObject({ "bookingId": expect.any(String), "confirmationNumber": expect.any(String), "recipientEmail": "alex@example.com", "eventType": expect.any(String) });
	});
});
```

`toMatchObject(...)` 将测试脚本在浏览器中填写的业务字段（`LHR`、`CDG`、`2026-12-07` 与 `alex@example.com`）固定为精确字符串，同时对服务端生成的字段（`OfferRefID`、`OfferItemRefID`、`bookingId`、`confirmationNumber` 与 `eventType`）使用 `expect.any(String)` 校验，既检查消息体结构又保证实盘回放稳定可重复。

运行生成的 Playwright 用例：

```bash
npx playwright test --config ./pw-suite/playwright.config.ts
```

你会看到测试通过：

```text
Running 1 test using 1 worker
  1 passed (42.9s)
```

## 4. 拦截隐蔽的后端漏发回归 {#step-4}

现在我们在不改动前端页面的前提下制造一个后端回归缺陷。回到第一个终端按 `Ctrl+C` 停止容器，带上 `-e OTA_FAULT_SKIP_EMAIL=true` 重新启动：

```bash
docker run --rm --privileged --name demo-ota-tutorial \
	-p 8080:8080 \
	-e INGESTION_KEY="$INGESTION_KEY" \
	-e OTA_FAULT_SKIP_EMAIL=true \
	docker.io/softprobe/demo-ota:classic-blackbox
```

开启 `OTA_FAULT_SKIP_EMAIL=true` 后，`POST /api/flights/book` 仍会正常调用 `/ndc/v21.3/offerprice` 与 `/ndc/v21.3/ordercreate`、写入 PostgreSQL 订单表、返回 `200 OK` 并跳转到 `/payment.html`。只检查 DOM 的常规 UI 测试此时仍会误判通过，而乘客实际上没有收到订票确认邮件。

在第二个终端重新运行生成的 Playwright 用例：

```bash
npx playwright test --config ./pw-suite/playwright.config.ts
```

测试会抛出 `TraceAssertionError` 失败，列出实际发生的两次航司 NDC 调用，并直接打印出漏发 `/v1/notifications/confirmation` 的那条 Explorer Trace 链接：

```text
TraceAssertionError: No outbound HTTP call on trace 256b83b5d78cb26c312375e850d12791 matched (method=POST, url=/\/v1\/notifications\/confirmation$/, status=200) within 30000ms. Observed outbound calls: POST https://spair.softprobe.ai/ndc/v21.3/offerprice (status 200), POST /ndc/v21.3/ordercreate (status 200). Inspect trace at https://explorer.softprobe.ai/?trace=256b83b5d78cb26c312375e850d12791.
```

## 下一步 {#next-steps}

- 将会话生成测试接入自有前端与 CI 流水线，请参阅[如何从录制的会话生成 UI 测试](/zh/ui-testing/from-sessions)。
- 无需预先录制浏览器会话，直接用自然语言从零编写测试，请参阅[如何用 `e2e` 编写自然语言 UI 测试](/zh/ui-testing/natural-language)。
