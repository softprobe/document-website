---
title: Softprobe Blackbox
---

# Softprobe Blackbox

Capture full-stack web and AI agent sessions into [Softprobe Explorer](https://explorer.softprobe.ai). Inspect browser DOM replay, HTTP request and response bodies, LLM generations, tool calls, and Findings in one place.

Blackbox connects browser frontends ([`@softprobe/web-record`](/en/agent-qa/reference/softprobe-js#softprobe-web-record)), Linux backends (OpenTelemetry eBPF Instrumentation), and AI frameworks ([Vercel AI SDK](/en/agent-qa/vercel-ai-sdk), [LangChain and LangGraph](/en/agent-qa/langchain), [OpenCode](/en/agent-qa/opencode), OpenAI, and standard OpenTelemetry GenAI) so every user journey becomes a correlated Session.

## Start here

1. **[Quick start](/en/agent-qa/getting-started).** Create an Agent in Explorer, get your Ingestion Key, and connect your app.
2. **[Full-stack web app demo](/en/agent-qa/application-session-capture).** Walk through a complete browser, Vercel AI, and Java backend capture with HTTP bodies in five minutes.
3. **[Concepts](/en/agent-qa/concepts).** Learn how Sessions, Steps, `gen_ai.conversation.id`, and Findings fit together.

## Instrument your app

| Stack | Integration guide | SDK / API reference |
|-------|-------------------|---------------------|
| **Browser + backend HTTP bodies** | [Full-stack web app demo](/en/agent-qa/application-session-capture#use-your-own-app) | [`@softprobe/web-record`](/en/agent-qa/reference/softprobe-js#softprobe-web-record) |
| **Vercel AI SDK (Node.js)** | [Vercel AI SDK](/en/agent-qa/vercel-ai-sdk) | [`@softprobe/vercel-ai-sdk`](/en/agent-qa/reference/softprobe-js#softprobe-vercel-ai-sdk) |
| **LangChain or LangGraph** | [LangChain and LangGraph](/en/agent-qa/langchain) | [`@softprobe/langchain`](/en/agent-qa/reference/softprobe-js#softprobe-langchain), [`softprobe.langchain`](/en/agent-qa/reference/softprobe-py#langchain-and-langgraph-softprobe-langchain) |
| **OpenCode** | [OpenCode](/en/agent-qa/opencode) | [`@softprobe/opencode-plugin`](/en/agent-qa/reference/softprobe-js#softprobe-opencode-plugin) |
| **Custom JS, Python, or OpenAI apps** | [Quick start](/en/agent-qa/getting-started#direct-otlp-export-for-existing-opentelemetry-apps) | [`@softprobe/tracing`](/en/agent-qa/reference/softprobe-js#softprobe-tracing), [`softprobe-py`](/en/agent-qa/reference/softprobe-py) |

## Investigate Sessions

After your app sends telemetry, connect [Blackbox MCP](/en/agent-qa/coding-agent-skills) in Claude Code, Codex, Cursor, OpenCode, or Antigravity to query Sessions, spans, and traces over OAuth.

## Other Softprobe products

| Product | Use when |
|---------|----------|
| **[Agent Evaluation](/en/evaluation/)** | You run offline or CI evaluation suites, evaluators, and release gates. |
| **[Testing](/en/testing/)** | You run Java record and replay regression tests with the JVM agent. |
| **[Platform](/en/platform/)** | You need Istio and SESSIFY business-flow observability. |
