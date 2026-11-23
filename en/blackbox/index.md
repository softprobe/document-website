---
title: Softprobe Blackbox
---

# Softprobe Blackbox

Capture full-stack web and AI agent sessions into [Softprobe Explorer](https://explorer.softprobe.ai). Inspect browser DOM replay, HTTP request and response bodies, LLM generations, tool calls, and Findings in one place.

Blackbox connects browser frontends ([`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record)), Linux backends (OpenTelemetry eBPF Instrumentation), and AI frameworks ([Vercel AI SDK](/en/blackbox/vercel-ai-sdk), [LangChain and LangGraph](/en/blackbox/langchain), [OpenCode](/en/blackbox/opencode), OpenAI, and standard OpenTelemetry GenAI) so every user journey becomes a correlated Session.

## Start here

1. **[Quick start](/en/blackbox/getting-started).** Use Managed Cloud (`https://explorer.softprobe.ai`) with zero setup, create an Agent, and connect your app.
2. **[Self-host Blackbox](/en/blackbox/self-hosting).** Run Explorer locally with `docker compose up -d` (`AUTH_MODE=local`) and connect local MCP at `http://127.0.0.1:8787/mcp`.
3. **[End-to-end session tracing with payloads](/en/blackbox/end-to-end-session-tracing).** Run the three-tier Travel OTA demo (browser, Vercel AI, and Java backend with OBI) in one Docker Compose command.
4. **[Concepts](/en/blackbox/concepts).** Learn how Sessions, Steps, `gen_ai.conversation.id`, and Findings fit together.

## Instrument your app

| Stack | Integration guide | SDK / API reference |
|-------|-------------------|---------------------|
| **Browser + backend HTTP bodies** | [End-to-end session tracing](/en/blackbox/end-to-end-session-tracing#use-your-own-app) | [`@softprobe/web-record`](/en/blackbox/reference/softprobe-js#softprobe-web-record) |
| **Vercel AI SDK (Node.js)** | [Vercel AI SDK](/en/blackbox/vercel-ai-sdk) | [`@softprobe/vercel-ai-sdk`](/en/blackbox/reference/softprobe-js#softprobe-vercel-ai-sdk) |
| **LangChain or LangGraph** | [LangChain and LangGraph](/en/blackbox/langchain) | [`@softprobe/langchain`](/en/blackbox/reference/softprobe-js#softprobe-langchain), [`softprobe.langchain`](/en/blackbox/reference/softprobe-py#langchain-and-langgraph-softprobe-langchain) |
| **OpenCode** | [OpenCode](/en/blackbox/opencode) | [`@softprobe/opencode-plugin`](/en/blackbox/reference/softprobe-js#softprobe-opencode-plugin) |
| **Custom JS, Python, or OpenAI apps** | [Quick start](/en/blackbox/getting-started#direct-otlp-export-for-existing-opentelemetry-apps) | [`@softprobe/tracing`](/en/blackbox/reference/softprobe-js#softprobe-tracing), [`softprobe-py`](/en/blackbox/reference/softprobe-py) |

## Investigate Sessions

After your app sends telemetry, connect [Blackbox MCP](/en/blackbox/coding-agent-skills) in Claude Code, Codex, Cursor, OpenCode, or Antigravity to query Sessions, spans, and traces over OAuth. You can also [generate UI tests from recorded sessions](/en/ui-testing/from-sessions) in `@playwright/test` or `e2e` and verify backend outbound HTTP calls in CI.

## Other Softprobe products

| Product | Use when |
|---------|----------|
| **[UI Testing](/en/ui-testing/)** | You want repeatable `@playwright/test` or zero-LLM `e2e` browser tests generated from recorded sessions or plain English. |
| **[Lisa](/en/lisa/)** | You want an AI QA agent to evaluate sessions against owner-approved policies. |
| **[Arex](/en/arex/)** | You run Java record and replay regression tests with the JVM agent. |
