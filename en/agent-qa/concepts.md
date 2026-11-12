---
title: Concepts
---

# Concepts

Core terms for Softprobe Blackbox Sessions, Steps, and OpenTelemetry trace ingestion.

## Session

A **Session** is one user or agent journey in Explorer. It groups spans by conversation identity, timing, and an ordered list of **Steps**.

Blackbox resolves Session identity from OpenTelemetry `gen_ai.conversation.id` or `session.id`, and correlates backend HTTP spans recorded by OpenTelemetry eBPF Instrumentation (OBI) when they share the same W3C `trace_id`. OpenCode maps a coding-agent conversation and linked sub-agent tasks into one Session. LangChain and LangGraph use your application's thread, chat, or session ID, such as `configurable.thread_id`. Softprobe does not invent replacement conversation UUIDs when your app provides one.

## Observation and step

Blackbox stores telemetry as OTLP spans and displays them as Steps. Each Step preserves its emitter's OpenTelemetry `service.name` and span kind (`INTERNAL`, `SERVER`, `CLIENT`, `PRODUCER`, or `CONSUMER`):

| Kind | Role |
|------|------|
| **Agent** | Turn or agent orchestration root (`invoke_agent`, `opencode.turn`) |
| **Generation** | Model call with messages, model metadata, and token usage (`chat`, `generate_content`) |
| **Tool** | Tool invocation with arguments and result (`execute_tool`) |
| **Chain, Retriever, Embedding, Guardrail, Evaluator** | Workflow, retrieval, vector, safety, and scoring spans |

A typical agent turn follows `agent` to `generation` to `tool`, with tools nested under either the generation or the agent turn depending on the framework.

Session token totals sum only leaf usage spans so parent agent rollups are never double-counted. When reasoning models report `total_tokens` greater than `input_tokens + output_tokens`, Blackbox preserves the reported `total_tokens`. Browser DOM recording and HTTP body capture spans attach replay and payload context without inflating Session step counts.

## OpenTelemetry GenAI compatibility

Blackbox natively ingests standard OpenTelemetry traces over OTLP HTTP at `https://explorer.softprobe.ai/api/thelake/v1/traces` without custom Softprobe span attributes:

- **OpenTelemetry GenAI semantic conventions (`gen_ai.*`).** Classifies `gen_ai.operation.name`, `gen_ai.agent.name`, `gen_ai.conversation.id`, `gen_ai.request.model`, `gen_ai.provider.name`, `gen_ai.tool.name`, `gen_ai.usage.*`, `session.id`, and `user.id`.
- **Arize OpenInference (`openinference.*`).** Classifies `openinference.span.kind` (`AGENT`, `LLM`, `TOOL`, `CHAIN`, `RETRIEVER`, `EMBEDDING`, `GUARDRAIL`, `EVALUATOR`), `llm.*` model and token attributes, `session.id`, and `user.id`.
- **Traceloop OpenLLMetry (`traceloop.*`).** Classifies `traceloop.span.kind` (`workflow`, `agent`, `task`, `tool`), `traceloop.entity.*`, `traceloop.association.properties.*`, and `gen_ai.*` model attributes.
- **Softprobe and framework SDKs.** Works alongside `@softprobe/opencode-plugin`, `softprobe[langchain]`, `@softprobe/langchain`, `@softprobe/vercel-ai-sdk` (and Vercel AI `ai.*` spans), `@softprobe/web-record`, and official OBI.

Assign a distinct `serviceName` or `OTEL_SERVICE_NAME` to each browser app, AI agent service, and backend service so Explorer's **Graph** and **Span Detail** views separate every tier and outbound peer target.

## Finding

A **Finding** is a policy or review signal attached to a Session or its Steps. Findings route to Slack when a channel is attached to the Agent.

## Agent

In Explorer, an **Agent** is the named capture target you connect. It holds the integration type, environment label, capture status, optional Slack channel, assigned Policies, and an ingest-only API key (`spk_...`).

## Related guides

- [Agent Evaluation](/en/evaluation/). Run offline and CI evaluation suites and release gates over captured evidence.
- [Capture a web app session with HTTP bodies](/en/agent-qa/application-session-capture). Connect browser, AI server, and backend tiers with distinct `service.name` values.
- [OpenCode install](/en/agent-qa/opencode). Configure OpenCode plugin capture.
- [LangChain install](/en/agent-qa/langchain). Configure LangChain and LangGraph callback or OpenTelemetry capture.
- [Investigate with a coding agent](/en/agent-qa/coding-agent-skills). Query Sessions from Cursor, Claude Code, Codex, OpenCode, or Antigravity.
