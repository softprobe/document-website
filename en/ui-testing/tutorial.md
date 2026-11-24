---
title: Build a UI test from a recorded session
---

# Build a UI test from a recorded session

Record a real flight-booking flow, inspect the browser actions and backend calls in Softprobe Explorer, then turn that flow into a repeatable Playwright test. The test checks both what the customer sees and whether the backend sends the booking confirmation.

Before you start, install Docker and Node.js 22.13 or newer. The public demo **Ingestion Key** below can send telemetry for its bound demo Agent; it cannot read sessions. To query traces from the test, use a **Softprobe API Key** with read access to the demo workspace as `SOFTPROBE_API_KEY`.

Backend spans use OBI and require a supported Linux environment: `amd64` or `arm64`, Linux kernel 5.8 or newer (RHEL-family 4.18+ with the required eBPF backports), BTF enabled, and the required eBPF privileges. The `--privileged` flag below grants the container the needed privileges, but the Docker host must still expose a supported Linux kernel. See the [OBI compatibility requirements](https://opentelemetry.io/docs/zero-code/obi/#compatibility).

## 1. Start the pre-instrumented demo app

Start `docker.io/softprobe/demo-ota:classic-blackbox` in Terminal 1:

```bash
export INGESTION_KEY="spk_UIKFA-detIGQsdXzGszOM6Xb0UTpmbBD"

docker run --rm --privileged --name demo-ota-tutorial \
	-p 8080:8080 \
	-e INGESTION_KEY="$INGESTION_KEY" \
	docker.io/softprobe/demo-ota:classic-blackbox
```

The container serves the flight-booking app on port `8080`, runs the Java backend and local PostgreSQL, sends browser telemetry with `@softprobe/web-record`, and captures backend spans with OBI.

In Terminal 2, wait for the app to answer:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/index.html
```

Continue when the response is `200`.

## 2. Record and inspect a booking session

Open `http://127.0.0.1:8080` in Chrome and book a flight:

1. Select **London Heathrow (LHR)** in **Departure Airport** and **Paris Charles de Gaulle (CDG)** in **Arrival Airport**.
2. Pick a future **Departure** date and click **Search**.
3. On `list.html`, click **Select** on the first flight.
4. On `detail.html`, click **Book** on the first fare option.
5. On `booking.html`, enter these synthetic details and click **Confirm Booking**: Last Name `Demo`, First Name `Alex`, Document Type `Passport`, Document Number `DEMO000001`, Phone Number `+12025550100`, and Email Address `alex@example.com`.
6. After `payment.html` loads, open the browser DevTools console and run `await window.__softprobeSession.flush(); window.__softprobeSession.sessionId`. Save the returned value as `SESSION_ID`.

Open **Sessions** in [Softprobe Explorer](https://explorer.softprobe.ai), find that session, and inspect its UI actions and related traces. You should see browser `softprobe.ui.action` spans together with `travel-ota` server spans, PostgreSQL queries, airline NDC calls, and the confirmation request. Use the recorded action order and locators as the outline for the Playwright test below. Keep `SESSION_ID` to reopen or query this recording; the test creates a fresh trace when it runs.

If you use Blackbox MCP, ask your coding agent to call `get_session_semantic_actions` with `SESSION_ID`. Its timeline includes flow segments, UI locators, and the trace IDs caused by each action; call `get_trace` on the relevant IDs when you need full request and response details.

Server spans can arrive shortly after the browser flush. If the session first shows UI actions without the backend calls, refresh the session view and continue when the booking and confirmation spans appear.

## 3. Write a Playwright test from the recorded flow

Create a test project in Terminal 2 and install the published SDK and Playwright versions:

```bash
mkdir softprobe-ui-tutorial && cd softprobe-ui-tutorial
npm init -y
npm pkg set type=module
npm install -D @softprobe/e2e@0.2.7 @playwright/test@1.64.1
npx playwright install chromium
mkdir tests
```

Create `playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	timeout: 120_000,
	use: { baseURL: "http://127.0.0.1:8080" },
});
```

Create `tests/booking.spec.ts`. The browser steps follow the session you recorded. `trace.outboundHttp` checks that the booking request caused both airline calls and the confirmation request:

```ts
import { expect, test } from "@softprobe/e2e/playwright";

test.use({ softprobe: { pollTimeoutMs: 60_000 } });

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
	await trace.outboundHttp({
		triggeredBy,
		method: "POST",
		url: /\/ndc\/v21\.3\/offerprice$/,
		status: 200,
	});

	await trace.outboundHttp({
		triggeredBy,
		method: "POST",
		url: /\/ndc\/v21\.3\/ordercreate$/,
		status: 200,
	});
	await trace.outboundHttp({
		triggeredBy,
		method: "POST",
		url: /\/v1\/notifications\/confirmation$/,
		status: 200,
	});
});
```

Each awaited `trace.outboundHttp` call verifies that the matching backend request completed with HTTP `200`. This example checks call presence and status; the pinned OBI version does not expose request bodies for the Java HTTP/2 airline calls.

Ask the demo workspace administrator for a Softprobe API Key with read access, then set it in Terminal 2 and run the test:

```bash
export SOFTPROBE_API_KEY="YOUR_SOFTPROBE_API_KEY"
npx playwright test
```

The test should pass. The Playwright fixture creates a trace for the browser requests and queries Blackbox for the backend calls they caused. The API Key resolves the workspace; you do not need to set a Workspace ID.

The fixture polls for backend spans for up to 60 seconds because OBI may export them shortly after the browser request. The Playwright test timeout is 120 seconds to allow that query to finish.

## 4. Catch a silent backend regression

In Terminal 1, stop the container with `Ctrl+C`, then restart it with the confirmation fault enabled:

```bash
docker run --rm --privileged --name demo-ota-tutorial \
	-p 8080:8080 \
	-e INGESTION_KEY="$INGESTION_KEY" \
	-e OTA_FAULT_SKIP_EMAIL=true \
	docker.io/softprobe/demo-ota:classic-blackbox
```

The booking still returns successfully and reaches `payment.html`, but the backend skips the confirmation request. Run the same Playwright test again:

```bash
npx playwright test
```

The test should fail at the confirmation `trace.outboundHttp` assertion because Blackbox has no matching call. It will still show the airline calls that ran. This catches a backend regression that a page-only assertion would miss.

Stop the fault-mode container and restart it without `OTA_FAULT_SKIP_EMAIL=true` before continuing.

## Next steps

- [Use a recorded session as a test plan](/en/ui-testing/from-sessions)
- [Write natural-language UI tests with `e2e`](/en/ui-testing/natural-language)
- [JavaScript and TypeScript SDK reference](/en/blackbox/reference/softprobe-js#softprobe-e2e)
