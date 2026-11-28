---
title: Softprobe UI Testing
---

# Softprobe UI Testing

A booking page says “Success”. Did the app also ask the email service to send a confirmation? A screen check alone cannot answer that.

In the web example, the `e2e` runner uses an AI model to perform actions you describe, such as searching for a flight and booking it. Your test checks results you choose, such as whether flights appear.

**You can also check what happened behind the screen.** With Blackbox and backend tracing, the test can check for the confirmation request and link to the related trace if the request is missing. You can also add these checks to a Playwright test. This requires server-side setup and does not prove the email was delivered.

You can start with the web example without changing the app or setting up backend tracing. If your goal is only to check the screen, [ordinary Playwright tests](https://playwright.dev/docs/writing-tests) are another option.

Testing a mobile app? The [iOS and Android guide](/en/ui-testing/mobile) covers AI-assisted actions and generating tests from recorded sessions. Its current example includes backend checks and is not a standalone demo.

## Choose where to start

- **Try a web test:** [Search for flights and complete a booking](/en/ui-testing/classic-web-first-test). The first test checks the page; it does not send a session to Blackbox.
- **Check a backend request:** [Add checks to an existing Playwright test](/en/ui-testing/web#playwright-fixture) or follow the [backend-check tutorial](/en/ui-testing/tutorial). Both need backend tracing.
- **Test a mobile app:** [Choose a mobile workflow](/en/ui-testing/mobile#choose-workflow).

## See a flight booking

This travel demo searches from London to Paris. A UI test can check that flights appear, then complete a booking and check the payment success message.

[Write your first web UI test](/en/ui-testing/classic-web-first-test) to check this journey.

![Flight search results in the travel demo](/img/ui-testing/travel-search-results.png)

The video shows the same demo booking with fictional passenger details and a test card. It is a browser walkthrough, not a recording of a passing automated test.

<video controls playsinline preload="metadata" width="1280" height="720" poster="/img/ui-testing/travel-booking-confirmation.png" style="width: 100%; height: auto;">
  <source src="/videos/ui-testing/travel-booking.mp4" type="video/mp4">
  <track kind="captions" src="/videos/ui-testing/travel-booking.en.vtt" srclang="en" label="English" default>
  <track kind="captions" src="/videos/ui-testing/travel-booking.zh.vtt" srclang="zh" label="中文">
  <a href="/videos/ui-testing/travel-booking.mp4">Download the booking walkthrough</a>
</video>

<details>
<summary>Video description</summary>
<p>The traveler selects London Heathrow and Paris Charles de Gaulle, searches, and selects a flight. They enter fictional passenger and contact details, confirm the booking, and pay with a test card. The demo displays a booking reference and a payment success message. There is no audio. The video does not verify email delivery.</p>
</details>

## Check the page

Describe the steps in plain language and check the visible result. Start without changing the app or setting up backend tracing.

- [Write tests with Playwright](https://playwright.dev/docs/writing-tests) (external Playwright documentation)
- [Write your first web UI test](/en/ui-testing/classic-web-first-test)
- [Describe UI tests in plain English](/en/ui-testing/natural-language). For UI-only tests, leave out backend trace setup.

## Optional: check backend requests

A page can show “Success” even when the app did not request an email from its email service. Enable Softprobe tracing to check the server's request and inspect the related trace. A developer may need to enable tracing on the server. Checking the request does not prove the email was delivered.

- [Compare capture options](/en/ui-testing/frontend-instrumentation)
- [Follow the backend-check tutorial](/en/ui-testing/tutorial)
- [Generate a test from a recorded user flow](/en/ui-testing/from-sessions) (requires session capture)

Add the frontend SDK when you want to capture browser sessions, including manual test sessions, and use those recordings to generate tests.

## Choose a platform

- [Web testing](/en/ui-testing/web)
- [Mobile testing](/en/ui-testing/mobile)
