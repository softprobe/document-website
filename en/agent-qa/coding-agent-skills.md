---
title: Investigate with a coding agent
---

# Investigate with a coding agent

Ask Cursor, Claude Code, Codex, OpenCode, or another coding agent to diagnose Softprobe Blackbox Sessions and traces. Evidence stays in your Softprobe workspace.

This is separate from **capture** (the `@softprobe/web-record` browser SDK, OBI, or AI framework SDKs). Capture records Sessions; Blackbox MCP lets your coding agent **manage Agents and investigate Sessions**.

## 1. Add Blackbox MCP

**Claude Code**

```bash
claude mcp remove blackbox 2>/dev/null; claude mcp add --transport http blackbox https://explorer.softprobe.ai/mcp
```

**Codex**

```bash
codex mcp add blackbox --url https://explorer.softprobe.ai/mcp
```

**Cursor (`.cursor/mcp.json`)**

```json
{"mcpServers":{"blackbox":{"url":"https://explorer.softprobe.ai/mcp"}}}
```

**OpenCode**

```bash
opencode mcp add blackbox --global --url https://explorer.softprobe.ai/mcp
```

## 2. Sign in and ask your agent

Complete the Explorer OAuth sign-in flow in your coding agent: open `/mcp` in Claude Code, run `codex mcp login blackbox`, open Cursor MCP settings, or run `opencode mcp auth blackbox`.

Examples:

- Use Blackbox: why did session `sess_…` fail? Check tool errors and the last generation.
- Blackbox: list Sessions from the last 24 hours with errors for agent `my-agent`.
- Blackbox: open trace `…` and summarize tool results vs the model’s final answer.

The first call opens Softprobe Explorer in the browser so you can sign in and click **Allow**. After that, the agent uses tools like `get_session`, `get_session_spans`, and `search_sessions`. Cite `session_id` / `trace_id` / `span_id` and link Explorer:

`https://explorer.softprobe.ai?session=<session_id>`

## Optional skill playbook

```bash
npx skills add softprobe/softprobe-skills -g -y \
  -a cursor -a claude-code -a codex -a opencode \
  -s softprobe-agent-qa
```

Source: [github.com/softprobe/softprobe-skills](https://github.com/softprobe/softprobe-skills) (Apache-2.0).

## Privacy

- Hosted MCP uses your Softprobe user login (OAuth). Tokens stay with your MCP client.
- Tools only **read** Sessions, observations, traces, and fixed log queries.
- They do not ingest telemetry or write scores.

## Troubleshoot

| Symptom | Fix |
|---------|-----|
| Browser auth loop | Finish Allow on the Softprobe consent page; ensure you’re signed into Explorer |
| Workspace picker / 409 | Pick a workspace in Explorer, or ask the agent to `list_workspaces` / `select_workspace` |
| MCP tools missing | Re-add `https://explorer.softprobe.ai/mcp` in your client |
| Confused with OpenCode capture | Capture uses `@softprobe/opencode-plugin` from Connect agent; this MCP only investigates |

## Next

- [Quick start](/en/agent-qa/getting-started) — connect an agent and verify capture
- [Concepts](/en/agent-qa/concepts) — Session and observation shape
- [Explorer](https://explorer.softprobe.ai)
