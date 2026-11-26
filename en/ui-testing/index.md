---
title: Softprobe UI Testing
---

# Softprobe UI Testing

Automate web, iOS, Android, and React Native UI tests that verify both the client screen and what your backend sent to external services. Softprobe UI Testing builds on [`e2e`](https://www.npmjs.com/package/e2e) and `@playwright/test` to propagate W3C `traceparent` and `baggage` headers, assert downstream backend `CLIENT` HTTP spans with `trace.outboundHttp`, and generate deterministic tests from recorded sessions via Blackbox MCP.

## 1. Why choose Softprobe UI Testing over `e2e` or Playwright directly {#why-softprobe}

`e2e` (`e2e-inc`) and Playwright verify what renders on the client screen, then stop at the browser or simulator boundary. If a form shows `"Invitation queued"` while your backend silently drops an email, webhook, or Stripe call, a client-only UI test passes.

`@softprobe/e2e` wraps `e2e` and `@playwright/test` so you keep every `e2e` workflow (`agent.act`, `.e2e/cache/` zero-LLM CI replay, `screen` assertions) while adding full-stack trace verification:

| Capability | `e2e` or Playwright directly | Softprobe UI Testing (`@softprobe/e2e`) |
|---|---|---|
| Plain-English `agent.act` & `.e2e/cache/` CI replay | Yes (`e2e`) | Yes (`softprobeCachedAgent` wraps `e2e`) |
| Assert backend emails, webhooks, & third-party HTTP calls | No | **Yes** (`trace.outboundHttp` / `trace.expectNoOutboundHttp`) |
| Link failures to full backend HTTP & LLM payloads | Client screenshot only | **Yes** (`explorerTraceUrl` in `softprobeReporter`) |
| Generate deterministic tests from real recorded sessions | No (author prompts manually) | **Yes** (Blackbox MCP + frontend instrumentation) |
| Standardize secret-slot redaction across sessions & cache | Manual setup | **Yes** (`SP_SECRET_<SLOT>` + `secrets-only` capture) |

## 2. Two ways to author tests & frontend instrumentation {#ways-to-test}

Softprobe separates **how you author a test** from **whether you instrument your frontend**:

| Authoring mode | Without frontend instrumentation (Zero-code / Proxy) | With frontend instrumentation (SDK) |
|---|---|---|
| **[Generate from recorded sessions](/en/ui-testing/from-sessions)** | Not available (requires SDK session capture) | Record a real user flow with `@softprobe/web-record`, `@softprobe/react-native`, Android, or Swift SDK. Coding agent reads Blackbox MCP (`get_session_semantic_actions` + `get_trace`) and writes deterministic Playwright, `@softprobe/e2e/mobile`, or Maestro tests. |
| **[Write in plain English (`agent.act`)](/en/ui-testing/natural-language)** | Use `softprobeWeb` or `softprobeMobile` proxy against an unmodified build. Run `agent.act` once locally to populate `.e2e/cache/`, then replay in CI with 0 LLM calls. | Same `agent.act` + `.e2e/cache/` CI replay, plus `softprobe.ui.action` spans, screenshots, and native `traceparent` without a mobile MITM proxy. |

Read **[With vs. without frontend instrumentation](/en/ui-testing/frontend-instrumentation)** for the full comparison, benefits of frontend SDKs, and four runnable examples.

## 3. Supported platforms {#platforms}

- **[Web (`/en/ui-testing/web`)](/en/ui-testing/web).** Deterministic `@playwright/test` via `@softprobe/e2e/playwright`, `e2e` `agent.act` via `softprobeWeb`, and session capture via `@softprobe/web-record`.
- **[iOS, Android & React Native (`/en/ui-testing/mobile`)](/en/ui-testing/mobile).** Zero-code `softprobeMobile` proxy mode for unmodified `.app` and `.apk` binaries, plus OpenTelemetry SDKs for React Native / Expo (`@softprobe/react-native`), native Android (`ai.softprobe:softprobe-otel-android`), and native iOS (`SoftprobeOtelSwift`).

## Start here {#start-here}

- **[Tutorial: Build your first generated UI and backend test](/en/ui-testing/tutorial).** Start the pre-instrumented `docker.io/softprobe/demo-ota:classic-blackbox` container, record one flight-booking session, generate a `@playwright/test` + `@softprobe/e2e` test via Blackbox MCP, and catch a dropped confirmation email.
- **[With vs. without frontend instrumentation](/en/ui-testing/frontend-instrumentation).** Compare proxy/zero-code capture against frontend SDK instrumentation with concrete benefits and working examples.
- **[Generate tests from recorded sessions](/en/ui-testing/from-sessions).** Enable semantic action capture, inspect `get_session_semantic_actions` and `get_trace` via Blackbox MCP, bind `SP_SECRET_<SLOT>`, and run in CI.
- **[Write natural-language UI tests](/en/ui-testing/natural-language).** Author prompt-driven `agent.act` tests from scratch, cache steps into `.e2e/cache/`, and replay in CI with zero LLM calls.
- **[Web testing guide](/en/ui-testing/web) · [Mobile testing guide](/en/ui-testing/mobile).** Platform-specific setup, CORS, simulators, and demo videos.

## How Softprobe products fit together {#products}

| Product | Use when |
|---------|----------|
| **UI Testing** | You want repeatable `@playwright/test`, zero-LLM `e2e`, or Maestro tests across web, iOS, Android, and React Native that assert both UI state and backend outbound HTTP calls. |
| **[Blackbox](/en/blackbox/)** | You want full-payload session tracing across browser frontends, backends, and AI agents for debugging in Explorer or coding agents. |
| **[Lisa](/en/lisa/)** | You want an autonomous AI QA engineer to evaluate agent sessions against owner-approved policies and alert in Slack. |
| **[Arex](/en/arex/)** | You want backend service regression testing by replaying recorded inbound API traffic with mocked databases and upstream dependencies. |
