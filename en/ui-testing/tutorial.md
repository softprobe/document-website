---
title: Build your first generated UI and backend test
---

# Build your first generated UI and backend test

In this tutorial, you start the pre-instrumented [Travel OTA demo](https://github.com/softprobe/demo-ota) container (`docker.io/softprobe/demo-ota:classic-blackbox`), record one flight-booking browser flow into [Softprobe Explorer](https://explorer.softprobe.ai), and use Blackbox MCP in your coding agent to generate a `@playwright/test` + `@softprobe/e2e` test suite from that session. Then you restart the container with `OTA_FAULT_SKIP_EMAIL=true` so the booking page still confirms the order while the Java backend skips the confirmation email request, and watch the generated test catch the regression.

Before you start, install Docker and Node.js 22.13 or newer, and create an Agent Ingestion Key (`spk_...`) plus an API token and Workspace ID in [Softprobe Explorer](https://explorer.softprobe.ai). If you run [self-hosted Explorer](/en/blackbox/self-hosting) on Linux (`http://127.0.0.1:8787`), replace `-p 8080:8080` with `--network host -e OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="http://127.0.0.1:8787/api/thelake/v1/traces"` in `docker run` and export `SOFTPROBE_SINK_ENDPOINT="http://127.0.0.1:8787/api/thelake"` in Terminal 2.

## 1. Start the pre-instrumented demo app {#step-1}

First, create a fresh working folder and install `@softprobe/e2e` and Playwright:

```bash
mkdir softprobe-ui-tutorial && cd softprobe-ui-tutorial
npm init -y
npm pkg set type=module
npm install @softprobe/e2e@0.2.8 @playwright/test@1.64.1 zod
npx playwright install chromium
```

Now start `docker.io/softprobe/demo-ota:classic-blackbox` in Terminal 1 with your `INGESTION_KEY`:

```bash
export INGESTION_KEY="spk_REPLACE_WITH_YOUR_INGESTION_KEY"

docker run --rm --privileged --name demo-ota-tutorial \
	-p 8080:8080 \
	-e INGESTION_KEY="$INGESTION_KEY" \
	docker.io/softprobe/demo-ota:classic-blackbox
```

The single container starts the multi-page flight-booking web app on port `8080`, the Spring Boot Java 21 backend on `127.0.0.1:8081`, local PostgreSQL on `127.0.0.1:5432`, payment and notification sandboxes on `127.0.0.1:8082` and `127.0.0.1:8083`, `@softprobe/web-record` in the browser, and OpenTelemetry eBPF Instrumentation (OBI) on the Java backend.

Verify that the web app is ready in Terminal 2:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/index.html
```

You should see:

```text
200
```

## 2. Record one flight-booking session {#step-2}

Open `http://127.0.0.1:8080` in Chrome and book a flight:

1. Select **London Heathrow (LHR)** in **From** and **Paris Charles de Gaulle (CDG)** in **To**.
2. Pick a future **Departure** date and click **Search**.
3. On `list.html`, click **Select** on the first flight.
4. On `detail.html`, click **Book** on the first fare option.
5. On `booking.html`, fill in **Last Name** (`Demo`), **First Name** (`Alex`), **Document Type** (`Passport`), **Document Number** (`DEMO000001`), **Phone Number** (`+12025550100`), and **Email** (`alex@example.com`), then click **Confirm Booking**.
6. Wait until `payment.html` loads, then open your browser DevTools console and run `await window.__softprobeSession.flush(); window.__softprobeSession.sessionId` to flush browser spans and copy your `SESSION_ID`.

Open **Sessions** in [Softprobe Explorer](https://explorer.softprobe.ai) and click your recorded session. After a few seconds for trace ingestion, open the **Trace** tab to see `UI` (`softprobe.ui.action`) spans across all five pages alongside `travel-ota` server spans, PostgreSQL queries on `ota_orders`, airline NDC calls (`/ndc/v21.3/airshopping`, `/ndc/v21.3/offerprice`, `/ndc/v21.3/ordercreate`), and `POST /v1/notifications/confirmation`.

## 3. Generate and run the `@playwright/test` suite with Blackbox MCP {#step-3}

With the [Blackbox MCP server](/en/blackbox/coding-agent-skills) connected in OpenCode, Claude Code, Cursor, or Antigravity, ask your coding agent to generate `./pw-suite/tests/recorded-session.spec.ts` from your `SESSION_ID`:

```text
Use Blackbox MCP to call get_session_semantic_actions for session <SESSION_ID>.
Inspect the booking and payment traces with get_trace, prune any stray
non-interactive clicks or retried failed requests, and write a Playwright test
at ./pw-suite/tests/recorded-session.spec.ts using @softprobe/e2e/playwright
that replays the booking flow against http://127.0.0.1:8080 and asserts the
confirmation email call (/v1/notifications/confirmation).
```

Export your Explorer query credentials (`SOFTPROBE_TOKEN` and `SOFTPROBE_WORKSPACE_ID`) and run the generated Playwright test in Terminal 2:

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

Notice that `toMatchObject(...)` pins values the test entered in the browser (`LHR`, `CDG`, `2026-12-07`, and `alex@example.com`) as exact strings, while checking server-supplied fields (`OfferRefID`, `OfferItemRefID`, `bookingId`, `confirmationNumber`, and `eventType`) with `expect.any(String)` so live replays stay deterministic without losing payload schema checks.

Run the generated Playwright test:

```bash
npx playwright test --config ./pw-suite/playwright.config.ts
```

You should see the test pass:

```text
Running 1 test using 1 worker
  1 passed (42.9s)
```

## 4. Catch a silent backend regression {#step-4}

Break the backend without changing the UI. In Terminal 1, stop the container with `Ctrl+C` and restart it with `-e OTA_FAULT_SKIP_EMAIL=true`:

```bash
docker run --rm --privileged --name demo-ota-tutorial \
	-p 8080:8080 \
	-e INGESTION_KEY="$INGESTION_KEY" \
	-e OTA_FAULT_SKIP_EMAIL=true \
	docker.io/softprobe/demo-ota:classic-blackbox
```

With `OTA_FAULT_SKIP_EMAIL=true`, `POST /api/flights/book` still calls `/ndc/v21.3/offerprice` and `/ndc/v21.3/ordercreate`, saves the order in PostgreSQL, returns `200 OK`, and navigates the browser to `/payment.html`. A DOM-only UI test stays green even though the customer never received a booking confirmation email.

Re-run the generated Playwright test in Terminal 2:

```bash
npx playwright test --config ./pw-suite/playwright.config.ts
```

The test fails with `TraceAssertionError`, lists the two airline NDC calls that did execute, and prints a direct Explorer link to the trace that missed `/v1/notifications/confirmation`:

```text
TraceAssertionError: No outbound HTTP call on trace 256b83b5d78cb26c312375e850d12791 matched (method=POST, url=/\/v1\/notifications\/confirmation$/, status=200) within 30000ms. Observed outbound calls: POST https://spair.softprobe.ai/ndc/v21.3/offerprice (status 200), POST /ndc/v21.3/ordercreate (status 200). Inspect trace at https://explorer.softprobe.ai/?trace=256b83b5d78cb26c312375e850d12791.
```

## Next steps {#next-steps}

- To integrate session-to-test generation into your own frontend and CI pipeline, see [How to generate UI tests from recorded sessions](/en/ui-testing/from-sessions).
- To write new `e2e` tests directly in plain English without recording a browser session first, see [How to write natural-language UI tests with `e2e`](/en/ui-testing/natural-language).
