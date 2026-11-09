---
title: Softprobe Agent QA
---

# Softprobe Agent QA

**Capture real agent sessions. Review steps and Findings. Improve agents with production evidence.**

Agent QA connects coding agents (OpenCode and LangChain / LangGraph) to Softprobe so every turn, model call, and tool use lands as a Session you can inspect in Explorer. It also supports [web application capture](/en/agent-qa/application-session-capture), which connects a visitor's browser activity to the backend requests it triggers.

## What Agent QA does

- **Install with one Explorer prompt** — paste into OpenCode or a coding agent (Cursor / Codex / Claude Code) for LangChain
- **Capture full Sessions** — user turns, generations, tools, retries, and errors
- **Review in Explorer** — Sessions, Steps, and Findings for production behavior
- **Capture web application sessions** — see a visitor's browser session and related backend activity together in Explorer
- **Optional Slack** — attach a channel after capture is verified

## What Agent QA is not

| Product | Use when… |
|---------|-----------|
| **[Agent Evaluation](/en/evaluation/)** | You run offline/CI suites, evaluators, and release gates |
| **[Testing](/en/testing/)** | Java record/replay regression with the JVM agent |
| **[Platform](/en/platform/)** | Istio/SESSIFY business-flow observability |

Today, Agent QA is the **online capture and review** path for AI and web applications. Agent Evaluation consumes evidence; Testing and Platform document their own capture flows.

## Start here

1. [Capture web application sessions](/en/agent-qa/application-session-capture) — connect browser activity to backend HTTP bodies
2. [Quick start](/en/agent-qa/getting-started) — connect from Explorer
3. [OpenCode install](/en/agent-qa/opencode) — plugin, credentials, troubleshooting
4. [LangChain install](/en/agent-qa/langchain) — callback handler (Python / TypeScript)
5. [Investigate with a coding agent](/en/agent-qa/coding-agent-skills) — diagnose Sessions in Cursor, Claude Code, Codex, OpenCode
6. [Concepts](/en/agent-qa/concepts) — Session and observation shape
