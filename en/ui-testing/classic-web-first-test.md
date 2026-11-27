---
title: Test a travel website with plain English
---

# Test a travel website with plain English

In this tutorial, you will write one test that searches for a flight from London to Paris, checks the results, and completes a booking. The test uses `agent.act()` to describe the actions in plain English.

You will test a demo website without changing its code. This example checks the screen and does not send a session to Blackbox. When you need to check server requests too, Softprobe can connect the test to backend traces.

## Before you start

You need Docker, Node.js 22.13 or newer, and an OpenAI API key with access to a model. The first test run uses the model and may incur charges. Later runs can reuse the local cache.

## 1. Start the demo

Run this in a terminal:

```bash
docker run -d --rm --name travel-ui-tutorial \
	-e TRAVEL_AGENT_PORT=18080 \
	-p 127.0.0.1:18080:18080 \
	docker.io/softprobe/demo-ota:v1.3.1
```

Open [http://127.0.0.1:18080](http://127.0.0.1:18080) in a browser. You should see **Flight Search**, with departure and arrival airport fields. If port 18080 is in use, choose an available port and replace `18080` in both the Docker command and the test configuration below.

## 2. Set up the test

Create a new folder and install the test tools:

```bash
mkdir travel-ui-test && cd travel-ui-test
npm init -y
npm pkg set type=module
npm install -D @softprobe/e2e@0.2.8 e2e@0.24.0 @e2e-dev/web@0.16.1 @playwright/test @ai-sdk/openai@4 ai@^7 zod
npx playwright install chromium
```

Create `e2e.config.ts` in the folder:

```ts
import { openai } from "@ai-sdk/openai";
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
			model: openai("gpt-5.4-mini"),
		}),
	},
	targets: [{
		name: "web",
		engine: softprobeWeb(),
		app: { url: "http://127.0.0.1:18080", identity: "travel-demo" },
	}],
} satisfies E2EConfig;
```

## 3. Write the test

Create a `tests` folder, then create `tests/booking.e2e.ts`:

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

The checks confirm that at least one flight can be selected, a booking reference appears, and the demo reports a successful payment. The example uses fictional passenger details and a test card. It does not check whether an email arrives.

![Flight search results in the demo](/img/ui-testing/travel-search-results.png)

Flights and prices can differ on your screen. This screenshot shows the demo page, not a test result.

![Successful demo payment with a booking reference](/img/ui-testing/travel-booking-confirmation.png)

The demo displays a payment success message and booking reference. The screenshot is an application walkthrough, not a test result.

## 4. Run the test

Set `OPENAI_API_KEY` in your terminal environment. In Bash, you can enter the key without displaying it:

```bash
read -r -s -p "OpenAI API key: " OPENAI_API_KEY; echo
export OPENAI_API_KEY
```

Run the test:

```bash
E2E_TELEMETRY_DISABLED=1 npx e2e run
```

The first run asks the model to perform the action. A passing run reports the test as passed. If the test fails, check the runner output and confirm that the demo page is reachable.

## About the local cache

The runner can save action steps in `.e2e/cache/` and replay them on a later run. The demo changes flight details and prices, so a cached step may not replay and the model may be called again. Keep the model key available for this example. The cache is local and is not uploaded to Blackbox. Review cache files for sensitive information before sharing or committing them.

When finished, stop the demo:

```bash
docker stop travel-ui-tutorial
```

To check a request sent by the backend as well, see [Write natural-language UI tests with backend checks](/en/ui-testing/natural-language).
