---
title: Softprobe UI Testing
---

# Softprobe UI Testing

Describe browser actions in plain language and an AI agent performs them. Your test checks the results you specify, such as whether a flight search shows results. Start with a flight-booking example that runs without changing the app or setting up backend tracing.

Testing a mobile app? See [iOS and Android testing](/en/ui-testing/mobile).

With Softprobe Blackbox and backend tracing, a test can also check a request behind the screen and link it to a trace. For example, you can check whether the server requested a confirmation email after booking. This requires server-side setup and does not prove the email was delivered.

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

- [Write tests with Playwright](https://playwright.dev/docs/writing-tests)
- [Write your first web UI test](/en/ui-testing/classic-web-first-test)
- [Describe UI tests in plain English](/en/ui-testing/natural-language). For UI-only tests, leave out backend trace setup.

## Optional: check backend requests

A page can show “Success” even when the app did not request an email from its email service. Enable Softprobe tracing to check the server's request and inspect the related trace. A developer may need to enable tracing on the server. Checking the request does not prove the email was delivered.

- [Compare capture options](/en/ui-testing/frontend-instrumentation)
- [Follow the backend-check tutorial](/en/ui-testing/tutorial)
- [Generate a test from a recorded user flow](/en/ui-testing/from-sessions) (requires session capture)

Add the frontend SDK only when you need to capture real user sessions and generate tests from them.

## Choose a platform

- [Web testing](/en/ui-testing/web)
- [Mobile testing](/en/ui-testing/mobile)
