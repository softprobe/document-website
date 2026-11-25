---
title: Softprobe UI Testing
---

# Softprobe UI Testing

Automate browser, iOS, and Android UI tests that also verify what your backend sent to external services. Softprobe UI Testing generates `@playwright/test`, cached `e2e`, `@softprobe/e2e/mobile`, and Maestro suites from recorded sessions or plain-English prompts, replays them in CI with zero LLM calls, and asserts real outgoing HTTP requests such as invitation emails, payment charges, and webhooks.

Standard UI tests stop at the client screen and pass whenever a success banner renders, even if the backend silently dropped an outbound email or webhook. Softprobe UI Testing propagates W3C `traceparent` and `baggage` headers from web and mobile clients and checks the downstream `CLIENT` HTTP spans in [Softprobe Explorer](https://explorer.softprobe.ai) through `trace.outboundHttp`.

## Two ways to create UI tests

1. **[Generate from a recorded session](/en/ui-testing/from-sessions).** Walk through your web app once with [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record) or your mobile app with [`@softprobe/react-native`](/en/blackbox/reference/softprobe-js#softprobe-react-native), `ai.softprobe:softprobe-otel-android`, or `SoftprobeOtelSwift`. Ask your coding agent to read the session with Blackbox MCP (`get_session_semantic_actions`, `get_trace`, and `compile_session_test`), export from Explorer, or run `softprobe-compile-session` to generate a clean `@playwright/test`, `@softprobe/e2e`, `@softprobe/e2e/mobile`, or Maestro suite.
2. **[Write in plain English without recording first](/en/ui-testing/natural-language).** Author `await agent.act(...)` steps for web browsers with [`@softprobe/e2e`](/en/blackbox/reference/softprobe-js#softprobe-e2e) or unmodified iOS and Android builds with [`@softprobe/e2e/mobile`](/en/ui-testing/mobile). Record `.e2e/cache/` once locally, commit the cache files to Git, and replay every CI run with zero model calls and zero model API keys.

## Start here

- **[Tutorial: Build your first generated UI and backend test](/en/ui-testing/tutorial).** Start the pre-instrumented `docker.io/softprobe/demo-ota:classic-blackbox` flight-booking container, record one browser booking session, generate a Playwright + `@softprobe/e2e` test with your coding agent via Blackbox MCP, and watch `trace.outboundHttp` catch a dropped confirmation email.
- **[Generate tests from recorded sessions](/en/ui-testing/from-sessions).** Enable semantic action capture, inspect `get_session_semantic_actions` and `get_trace` via Blackbox MCP, bind `SP_SECRET_<SLOT>` environment variables, and run in CI.
- **[Write natural-language UI tests](/en/ui-testing/natural-language).** Author prompt-driven `e2e` tests from scratch without recording a browser session first.
- **[Test iOS and Android apps](/en/ui-testing/mobile).** Test unmodified `.apk` and `.app` binaries with `softprobeMobile` in proxy mode, or attach OpenTelemetry extensions for React Native, Android, and Swift in session mode.
- **[SDK and CLI reference](/en/blackbox/reference/softprobe-js#softprobe-e2e).** Lookup tables for `@softprobe/e2e`, `@softprobe/e2e/playwright`, `@softprobe/e2e/mobile`, `@softprobe/react-native`, `@softprobe/web-record`, and `softprobe-compile-session`.

## How Softprobe products fit together

| Product | Use when |
|---------|----------|
| **UI Testing** | You want repeatable `@playwright/test`, zero-LLM `e2e`, or Maestro tests across web, iOS, and Android that assert both UI state and backend outbound HTTP calls. |
| **[Blackbox](/en/blackbox/)** | You want full-payload session tracing across browser frontends, backends, and AI agents for debugging in Explorer or coding agents. |
| **[Lisa](/en/lisa/)** | You want an autonomous AI QA engineer to evaluate agent sessions against owner-approved policies and alert in Slack. |
| **[Arex](/en/arex/)** | You want backend service regression testing by replaying recorded inbound API traffic with mocked databases and upstream dependencies. |
