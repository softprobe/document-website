---
title: Softprobe UI Testing
---

# Softprobe UI Testing

Test your app from the user's point of view: follow a flow in the browser and check what appears on the page. Checking requests sent by the server and recording real user sessions are optional.

## Check the page

If you only need to check pages and user actions, use Playwright. You do not need to change your app or set up Softprobe.

- [Write tests with Playwright](https://playwright.dev/docs/writing-tests)
- [Describe UI tests in plain English](/en/ui-testing/natural-language). For UI-only tests, leave out backend trace setup.

## Optional: check backend requests

A page can show “Success” even when the app did not send an email or call the payment service. Turn on Softprobe tracing when you need to check requests sent by your app. The frontend code can stay unchanged; a developer may need to enable tracing on the server.

- [Compare capture options](/en/ui-testing/frontend-instrumentation)
- [Follow the backend-check tutorial](/en/ui-testing/tutorial)
- [Generate a test from a recorded user flow](/en/ui-testing/from-sessions) (requires session capture)

Add the frontend SDK only when you need to capture real user sessions and generate tests from them.

## Choose a platform

- [Web testing](/en/ui-testing/web)
- [Mobile testing](/en/ui-testing/mobile)
