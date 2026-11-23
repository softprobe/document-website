---
title: Softprobe UI Testing
---

# Softprobe UI Testing

Automate browser tests that also verify what your backend sent to external services. Softprobe UI Testing generates `@playwright/test` and cached `e2e` suites from recorded browser sessions or plain-English prompts, replays them in CI with zero LLM calls, and asserts real outgoing HTTP requests such as invitation emails, payment charges, and webhooks.

Standard UI tests stop at the browser DOM and pass whenever a success banner renders, even if the backend silently dropped an outbound email or webhook. Softprobe UI Testing attaches a W3C `traceparent` header to every browser request and checks the downstream `CLIENT` HTTP spans in [Softprobe Explorer](https://explorer.softprobe.ai) through `trace.outboundHttp`.

## Two ways to create UI tests

1. **[Generate from a recorded session](/en/ui-testing/from-sessions).** Walk through your web app once with [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record). Export a `@playwright/test` `.spec.ts` suite or a pre-seeded `e2e` suite in one click from Explorer, through Blackbox MCP (`compile_session_test`), or from the terminal (`softprobe-compile-session`).
2. **[Write in plain English without recording first](/en/ui-testing/natural-language).** Author `await agent.act(...)` steps with `e2e` and [`@softprobe/e2e`](/en/blackbox/reference/softprobe-js#softprobe-e2e). Record `.e2e/cache/` once locally, commit the cache files to Git, and replay every CI run with zero model calls and zero model API keys.

## Start here

- **[Tutorial: Build your first generated UI and backend test](/en/ui-testing/tutorial).** Stand up a Node.js team-invitation web app, capture a browser session with password redaction, compile both Playwright and zero-LLM `e2e` suites, and watch `trace.outboundHttp` catch a silent backend email bug.
- **[Generate tests from recorded sessions](/en/ui-testing/from-sessions).** Enable semantic action capture, export tests from Explorer, Blackbox MCP, or the CLI, bind `SP_SECRET_<SLOT>` environment variables, and run in CI.
- **[Write natural-language UI tests](/en/ui-testing/natural-language).** Author prompt-driven `e2e` tests from scratch without recording a browser session first.
- **[SDK and CLI reference](/en/blackbox/reference/softprobe-js#softprobe-e2e).** Lookup tables for `@softprobe/e2e`, `@softprobe/e2e/playwright`, `@softprobe/web-record`, and `softprobe-compile-session`.

## How Softprobe products fit together

| Product | Use when |
|---------|----------|
| **UI Testing** | You want repeatable `@playwright/test` or zero-LLM `e2e` browser tests that assert both UI state and backend outbound HTTP calls. |
| **[Blackbox](/en/blackbox/)** | You want full-payload session tracing across browser frontends, backends, and AI agents for debugging in Explorer or coding agents. |
| **[Lisa](/en/lisa/)** | You want an autonomous AI QA engineer to evaluate agent sessions against owner-approved policies and alert in Slack. |
| **[Arex](/en/arex/)** | You want backend service regression testing by replaying recorded inbound API traffic with mocked databases and upstream dependencies. |
