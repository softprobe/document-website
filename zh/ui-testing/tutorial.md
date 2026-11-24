---
title: 构建第一个自动生成 UI 与后端联调测试
---

# 构建第一个自动生成 UI 与后端联调测试

在本教程中，你将直接启动预埋点的 [Travel OTA 示例应用](https://github.com/softprobe/demo-ota)单容器镜像（`docker.io/softprobe/demo-ota:classic-blackbox`），把一次真实机票预订浏览器操作录制到 [Softprobe Explorer](https://explorer.softprobe.ai)，并将这条会话分别编译为 `@playwright/test` 套件与零大模型调用的 `e2e` 套件。随后你将在订单确认页面照常跳转的情况下开启 `OTA_FAULT_SKIP_EMAIL=true` 让 Java 后端漏发确认邮件请求，验证自动生成的测试如何精准拦截这类隐蔽回归缺陷。

开始前，请安装 Docker 和 Node.js 22.13 或更高版本。在 [Softprobe Explorer](https://explorer.softprobe.ai) 中创建 Agent，并复制它的 **Ingestion Key**。向组织管理员索取一个具有会话和 trace 读取权限的 **Softprobe API Key**，并在编译会话时将它设为 `SOFTPROBE_API_KEY`。Ingestion Key 只为对应 Agent 上报遥测数据；Softprobe API Key 用于读取会话和 trace，并解析查询对应的 workspace。

本教程的后端 spans 由 OBI 采集，需要受支持的 Linux 环境：`amd64` 或 `arm64` 架构、Linux 内核 5.8 或更高版本（RHEL 系发行版需 4.18+ 并包含所需 eBPF 回移）、启用 BTF，并授予所需的 eBPF 权限。下方的 `--privileged` 会为容器授予所需权限，但 Docker 主机仍须提供受支持的 Linux 内核。请参阅 [OBI 兼容性要求](https://opentelemetry.io/docs/zero-code/obi/#compatibility)。

如果你在 Linux 上使用[自托管 Explorer](/en/blackbox/self-hosting) (`http://127.0.0.1:8787`), 请在 `docker run` 中将 `-p 8080:8080` 替换为 `--network host -e OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="http://127.0.0.1:8787/api/thelake/v1/traces"`，并在第二个终端额外配置 `export SOFTPROBE_SINK_ENDPOINT="http://127.0.0.1:8787/api/thelake"`。

## 1. 一键启动预埋点示例容器

首先创建工作目录并安装 `@softprobe/e2e`、Playwright 与 `e2e`：

```bash
mkdir softprobe-ui-tutorial && cd softprobe-ui-tutorial
npm init -y
npm pkg set type=module
npm install @softprobe/e2e@0.2.5 @playwright/test@1.64.1 \
	e2e@0.24.0 @e2e-dev/web@0.16.1 zod
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

## 2. 录制一次机票预订会话

在 Chrome 浏览器中打开 `http://127.0.0.1:8080` 完成一次订票流程：

1. 在 **Departure Airport** 选择 **London Heathrow (LHR)**，在 **Arrival Airport** 选择 **Paris Charles de Gaulle (CDG)**。
2. 选择未来的出发日期并点击 **Search**。
3. 在 `list.html` 页面点击第一个航班的 **Select**。
4. 在 `detail.html` 页面点击第一个舱位票价的 **Book**。
5. 在 `booking.html` 页面依次填写 **Last Name**（`Demo`）、**First Name**（`Alex`）、**Document Type**（`Passport`）、**Document Number**（`DEMO000001`）、**Phone Number**（`+12025550100`）与 **Email**（`alex@example.com`），点击 **Confirm Booking**。
6. 等待浏览器跳转到 `payment.html` 后，打开浏览器开发者工具 Console 执行 `await window.__softprobeSession.flush(); window.__softprobeSession.sessionId` 立即上报前端 span 并复制打印出的 `SESSION_ID`。

打开 [Softprobe Explorer](https://explorer.softprobe.ai) 的 **Sessions** 页面并点击刚录制的会话。等待数秒完成 Trace 落盘后切到 **Trace** 标签页，你会看到跨 5 个页面的 `UI`（`softprobe.ui.action`）动作 span，以及与之关联的 `travel-ota` 入站请求、`ota_orders` PostgreSQL 查询、航司 NDC 接口调用（`/ndc/v21.3/airshopping`、`/ndc/v21.3/offerprice`、`/ndc/v21.3/ordercreate`）和 `POST /v1/notifications/confirmation` 邮件通知 span。

## 3. 生成并运行 `@playwright/test` 测试套件

在第二个终端配置 Explorer 查询凭据与 `SESSION_ID`，将录制的会话编译到 `./pw-suite` 目录：

```bash
export SESSION_ID="PASTE_YOUR_SESSION_ID"
export SOFTPROBE_API_KEY="YOUR_SOFTPROBE_API_KEY"
npx softprobe-compile-session \
	--session-id "$SESSION_ID" \
	--runner playwright \
	--target-url http://127.0.0.1:8080 \
	--out ./pw-suite \
	--json
```

终端会输出 JSON 摘要，显示已编译 `14` 个前端动作与 `4` 条后端出站 HTTP 断言：

```json
{
	"ok": true,
	"runner": "playwright",
	"sessionId": "830501cb-7792-47cf-8a3c-b58929cef6aa",
	"actionCount": 14,
	"outboundAssertionCount": 4,
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

编译器在 `toMatchObject(...)` 中将测试脚本亲自填写的业务字段（`LHR`、`CDG`、`2026-12-07`、`alex@example.com`）固定为精确字面量，同时对服务端生成的字段（`OfferRefID`、`OfferItemRefID`、`bookingId`、`confirmationNumber`、`eventType`）断言 `expect.any(String)`，既校验出站载荷结构又保证实盘回放稳定可重复。

运行生成的 Playwright 用例：

```bash
npx playwright test --config ./pw-suite/playwright.config.ts
```

你会看到测试通过：

```text
Running 1 test using 1 worker
  1 passed (42.9s)
```

## 4. 拦截隐蔽的后端漏发回归

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

继续下一步前，请在第一个终端停掉容器并去掉 `OTA_FAULT_SKIP_EMAIL=true` 重新启动正常容器：

```bash
docker run --rm --privileged --name demo-ota-tutorial \
	-p 8080:8080 \
	-e INGESTION_KEY="$INGESTION_KEY" \
	docker.io/softprobe/demo-ota:classic-blackbox
```

## 5. 生成并运行零 LLM 的 `e2e` 套件

最后我们将同一条录制会话编译为 `e2e` 测试套件：

```bash
npx softprobe-compile-session \
	--session-id "$SESSION_ID" \
	--runner e2e \
	--target-url http://127.0.0.1:8080 \
	--out ./e2e-suite \
	--json
```

`softprobe-compile-session` 会生成 `e2e-suite/tests/recorded-session.e2e.ts`、`e2e-suite/e2e.config.ts`，以及 4 个预置的 `.e2e/cache/<sha256>.json` 动作缓存。在不配置任何大模型 API Key 的情况下直接运行 `e2e`：

```bash
cd e2e-suite
CI=true \
E2E_TELEMETRY_DISABLED=1 \
../node_modules/.bin/e2e run --reporter list
```

用 Node.js 检查 `.e2e/report.json`，确认用例通过且模型 Token 与模型调用次数均为 `0`：

```bash
node --input-type=module -e 'import { readFileSync } from "node:fs"; const r = JSON.parse(readFileSync(".e2e/report.json", "utf8")); console.log(r.run.summary.passed, r.run.usage.modelTokens, r.run.usage.maxModelCallsInStep);'
```

终端会输出：

```text
1 0 0
```

## 下一步

- 将会话生成测试接入自有前端与 CI 流水线，请参阅[如何从录制的会话生成 UI 测试](/zh/ui-testing/from-sessions)。
- 无需预先录制浏览器会话，直接用自然语言从零编写测试，请参阅[如何用 `e2e` 编写自然语言 UI 测试](/zh/ui-testing/natural-language)。
