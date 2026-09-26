---
title: Investigate with a coding agent
---

# Investigate with a coding agent

Ask Cursor, Claude Code, Codex, OpenCode, or another coding agent to diagnose Softprobe Agent QA Sessions and traces. Evidence stays in your Softprobe workspace; access is **read-only**.

This is separate from **capture** (Connect agent / OpenCode plugin). Capture records Sessions; this flow **investigates** them.

## 1. Add Softprobe MCP

**Claude Code**

```bash
claude mcp add --transport http softprobe https://explorer.softprobe.ai/mcp
```

**Cursor**

Add an MCP server with URL:

`https://explorer.softprobe.ai/mcp`

(or `cursor --add-mcp '{"name":"softprobe","url":"https://explorer.softprobe.ai/mcp"}'`)

## 2. Ask your agent

Examples:

- Use Softprobe: why did session `sess_…` fail? Check tool errors and the last generation.
- Softprobe: list Sessions from the last 24 hours with errors for agent `my-agent`.
- Softprobe: open trace `…` and summarize tool results vs the model’s final answer.

The first call opens Softprobe in the browser so you can sign in and Allow. After that, the agent uses tools like `get_session` and `search_sessions`. Cite `session_id` / `trace_id` / `span_id` and link Explorer:

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
