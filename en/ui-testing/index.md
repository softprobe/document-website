---
title: Softprobe UI Testing
---

# Softprobe UI Testing

Automate browser, iOS, and Android UI tests that also verify what your backend sent to external services. Softprobe UI Testing generates deterministic `@playwright/test`, `@softprobe/e2e/mobile`, and Maestro suites from recorded sessions or runs prompt-authored `agent.act` suites from `.e2e/cache/` in CI with zero LLM calls, asserting real outgoing HTTP requests such as invitation emails, payment charges, and webhooks.

Standard UI tests stop at the client screen and pass whenever a success banner renders, even if the backend silently dropped an outbound email or webhook. Softprobe UI Testing propagates W3C `traceparent` and `baggage` headers from web and mobile clients and checks the downstream `CLIENT` HTTP spans in [Softprobe Explorer](https://explorer.softprobe.ai) through `trace.outboundHttp`.

## Two ways to create UI tests {#two-ways}

1. **[Generate from a recorded session](/en/ui-testing/from-sessions).** Walk through your web app once with [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record) or your mobile app with [`@softprobe/react-native`](/en/blackbox/reference/softprobe-js#softprobe-react-native), `ai.softprobe:softprobe-otel-android`, or `SoftprobeOtelSwift`. Ask your coding agent to inspect the session with Blackbox MCP (`get_session_semantic_actions` and `get_trace`), prune stray actions, and generate a deterministic `@playwright/test`, `@softprobe/e2e/mobile`, or Maestro suite.
2. **[Write in plain English without recording first](/en/ui-testing/natural-language).** Author `await agent.act(...)` steps for web browsers with [`@softprobe/e2e`](/en/blackbox/reference/softprobe-js#softprobe-e2e) or unmodified iOS and Android builds with [`@softprobe/e2e/mobile`](/en/ui-testing/mobile). Record `.e2e/cache/` once locally, commit the cache files to Git, and replay every CI run through `softprobeCachedAgent()` with zero model calls and zero model API keys.

## Start here {#start-here}

- **[Tutorial: Build your first generated UI and backend test](/en/ui-testing/tutorial).** Start the pre-instrumented `docker.io/softprobe/demo-ota:classic-blackbox` flight-booking container, record one browser booking session, generate a `@playwright/test` + `@softprobe/e2e` test with your coding agent via Blackbox MCP, and watch `trace.outboundHttp` catch a dropped confirmation email.
- **[Generate tests from recorded sessions](/en/ui-testing/from-sessions).** Enable semantic action capture, inspect `get_session_semantic_actions` and `get_trace` via Blackbox MCP, bind `SP_SECRET_<SLOT>` environment variables, and run in CI.
- **[Write natural-language UI tests](/en/ui-testing/natural-language).** Author prompt-driven `agent.act` tests from scratch, cache steps locally into `.e2e/cache/`, and replay in CI with zero LLM calls.
- **[Test iOS and Android apps](/en/ui-testing/mobile).** Test unmodified `.apk` and `.app` binaries with `softprobeMobile` in proxy mode, attach OpenTelemetry extensions for React Native, Android, and Swift in session mode, or generate `@softprobe/e2e/mobile` and Maestro suites via Blackbox MCP.
- **[SDK reference](/en/blackbox/reference/softprobe-js#softprobe-e2e).** Lookup tables for `@softprobe/e2e`, `@softprobe/e2e/playwright`, `@softprobe/e2e/mobile`, `@softprobe/react-native`, and `@softprobe/web-record`.

## How Softprobe products fit together {#products}

| Product | Use when |
|---------|----------|
| **UI Testing** | You want repeatable `@playwright/test`, zero-LLM `e2e`, or Maestro tests across web, iOS, and Android that assert both UI state and backend outbound HTTP calls. |
| **[Blackbox](/en/blackbox/)** | You want full-payload session tracing across browser frontends, backends, and AI agents for debugging in Explorer or coding agents. |
| **[Lisa](/en/lisa/)** | You want an autonomous AI QA engineer to evaluate agent sessions against owner-approved policies and alert in Slack. |
| **[Arex](/en/arex/)** | You want backend service regression testing by replaying recorded inbound API traffic with mocked databases and upstream dependencies. |
