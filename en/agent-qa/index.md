---
title: Softprobe Agent QA
---

# Softprobe Agent QA

**Capture real agent sessions. Review steps and Findings. Improve agents with production evidence.**

Agent QA connects coding agents (starting with OpenCode) to Softprobe so every turn, model call, and tool use lands as a Session you can inspect in Explorer.

## What Agent QA does

- **Install with one OpenCode prompt** — paste from Explorer; the agent installs `@softprobe/opencode-plugin` and writes credentials (agent API key + Explorer gateway URLs)
- **Capture full Sessions** — user turns, generations, tools, retries, and errors
- **Review in Explorer** — Sessions, Steps, and Findings for production behavior
- **Optional Slack** — attach a channel after capture is verified

## What Agent QA is not

| Product | Use when… |
|---------|-----------|
| **[Agent Evaluation](/en/evaluation/)** | You run offline/CI suites, evaluators, and release gates |
| **[Testing](/en/testing/)** | Java record/replay regression with the JVM agent |
| **[Platform](/en/platform/)** | Istio/SESSIFY business-flow observability |

Agent QA is the **online capture and review** path for AI agents. Evaluation consumes evidence; Testing and Platform cover non-LLM services.

## Start here

1. [Quick start](/en/agent-qa/getting-started) — connect from Explorer
2. [OpenCode install](/en/agent-qa/opencode) — plugin, credentials, troubleshooting
3. [Concepts](/en/agent-qa/concepts) — Session and observation shape
