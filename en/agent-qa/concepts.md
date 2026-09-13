---
title: Concepts
---

# Concepts

Short vocabulary for Softprobe Agent QA Sessions and observations.

## Session

A **Session** is one agent run as seen in Explorer: identity (agent name, environment), timing, and an ordered list of **Steps**. OpenCode maps a coding-agent conversation (including nested sub-agents when linked) into a Session.

## Observation / Step

Telemetry is stored as OTLP spans and shown as Steps. Softprobe LLM shape:

| Kind | Role |
|------|------|
| **Agent** | Turn / orchestration root (`opencode.turn`) |
| **Generation** | Model call with input/output and usage |
| **Tool** | Tool invocation with arguments and result |

Typical topology: **agent → generation → tool** (tools may nest under generations or the agent turn depending on the framework).

## Finding

A **Finding** is a policy or review signal attached to a Session (or Steps within it). Findings can route to Slack when a channel is attached to the Agent.

## Agent (product entity)

In Explorer, an **Agent** is the named capture source you connect: framework (e.g. OpenCode), environment, capture status, optional Slack channel, assigned Policies, and a per-agent API key (`spk_…`) used for ingest through the Explorer gateway (`https://explorer.softprobe.ai/api/thelake`).

## Related products

- [Agent Evaluation](/en/evaluation/) — offline/CI suites and gates over evidence
- [OpenCode install](/en/agent-qa/opencode) — how capture is installed
