---
title: Investigate with a coding agent
---

# Use Blackbox MCP with a coding agent

Connect Claude Code, Codex, Cursor, OpenCode, or Antigravity (`agy`) to Softprobe Explorer. Sign in through the browser with your existing Explorer account. Blackbox MCP can query Sessions, inspect Session details, list and create Agent apps, and reveal an Agent's Ingestion Key when you request it.

This is separate from **capture** (the `@softprobe/web-record` browser SDK, OBI, or AI framework SDKs). Capture records Sessions; Blackbox MCP lets your coding agent **manage Agents and investigate Sessions**.

## 1. Add Blackbox MCP

Select your coding agent to add the Softprobe MCP server (`https://explorer.softprobe.ai/mcp`) as `blackbox`:

::: code-group

```bash [Claude Code]
claude mcp remove blackbox 2>/dev/null; claude mcp add --transport http blackbox https://explorer.softprobe.ai/mcp
```

```bash [Codex]
codex mcp add blackbox --url https://explorer.softprobe.ai/mcp
```

```json [Cursor]
{
  "mcpServers": {
    "blackbox": {
      "url": "https://explorer.softprobe.ai/mcp"
    }
  }
}
```

```bash [OpenCode]
opencode mcp add blackbox --global --url https://explorer.softprobe.ai/mcp
```

```json [Antigravity]
{
  "mcpServers": {
    "blackbox": {
      "url": "https://explorer.softprobe.ai/mcp"
    }
  }
}
```

:::

- **Cursor**: Save the JSON snippet in `.cursor/mcp.json` or `~/.cursor/mcp.json`, or select [Add Blackbox to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=Blackbox&config=eyJ1cmwiOiJodHRwczovL2V4cGxvcmVyLnNvZnRwcm9iZS5haS9tY3AifQ%3D%3D).
- **Antigravity (`agy`)**: Save the JSON snippet in `~/.gemini/config/mcp_config.json` (global) or `.agents/mcp_config.json` (workspace).

## 2. Sign in and verify access

Authenticate with your Explorer account in the browser:

::: code-group

```text [Claude Code]
/mcp
```

```bash [Codex]
codex mcp login blackbox
```

```bash [Cursor]
agent mcp enable blackbox && agent mcp login blackbox
```

```bash [OpenCode]
opencode mcp auth blackbox
```

```text [Antigravity]
/mcp
```

:::

- **Claude Code**: Run `/mcp` in Claude Code and authorize Blackbox with your Explorer account in the browser.
- **Codex**: Run `codex mcp login blackbox` and complete Explorer sign-in in the browser.
- **Cursor**: Run `agent mcp enable blackbox && agent mcp login blackbox` from the terminal (or open **Customize → MCPs** in Cursor and choose **Sign in**). You can manage and inspect the server from the terminal with `agent mcp`:

| Command | Purpose |
|---------|---------|
| `agent mcp list` | Display configured servers, transport types, and current status |
| `agent mcp list-tools blackbox` | List tools and parameters exposed by Blackbox MCP |
| `agent mcp login blackbox` | Authenticate with Blackbox MCP through the browser OAuth flow |
| `agent mcp enable blackbox` | Approve and mount Blackbox MCP for the agent |
| `agent mcp disable blackbox` | Unload Blackbox MCP so the agent ignores it |

- **OpenCode**: Run `opencode mcp auth blackbox` and complete Explorer sign-in in the browser.
- **Antigravity (`agy`)**: Run `/mcp` in `agy`, select `blackbox`, and choose **Authenticate** to sign in through the browser (or open **MCP Servers** in the Antigravity app or IDE).

Then ask your coding agent to call `list_workspaces` to confirm access. If you have multiple workspaces, ask it to call `select_workspace` with the target `workspace_id` to switch.

### Staging / development (`blackbox-staging`)

To use staging alongside production without overwriting your production login, register `https://explorer-staging.softprobe.ai/mcp` under `blackbox-staging`:

::: code-group

```bash [Claude Code]
claude mcp remove blackbox-staging 2>/dev/null; claude mcp add --transport http blackbox-staging https://explorer-staging.softprobe.ai/mcp
```

```bash [Codex]
codex mcp add blackbox-staging --url https://explorer-staging.softprobe.ai/mcp
```

```json [Cursor]
{
  "mcpServers": {
    "blackbox-staging": {
      "url": "https://explorer-staging.softprobe.ai/mcp"
    }
  }
}
```

```bash [OpenCode]
opencode mcp add blackbox-staging --global --url https://explorer-staging.softprobe.ai/mcp
```

```json [Antigravity]
{
  "mcpServers": {
    "blackbox-staging": {
      "url": "https://explorer-staging.softprobe.ai/mcp"
    }
  }
}
```

:::

Sign in to `blackbox-staging` with the same client command using `blackbox-staging` as the server name (for example, `codex mcp login blackbox-staging`, `opencode mcp auth blackbox-staging`, or `/mcp` in Claude Code or Antigravity).

## 3. Ask your agent

Examples:

- Use Blackbox: why did session `sess_…` fail? Check tool errors and the last generation.
- Blackbox: list Sessions from the last 24 hours with errors for agent `my-agent`.
- Blackbox: open trace `…` and summarize tool results vs the model’s final answer.

The agent can use `search_sessions`, `get_session`, and `get_session_spans` to investigate telemetry. It can use `list_agents` and `create_agent` to manage Agent apps. `get_agent_api_key` reveals an Agent credential only when requested. Cite `session_id` / `trace_id` / `span_id` and link Explorer:

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
- Session, trace, and log tools are read-only.
- Agent tools use your selected workspace membership. `create_agent` adds an Agent app; `get_agent_api_key` returns that Agent's key only when requested.
- Ingestion Keys can only send telemetry. They cannot use MCP or read Sessions.

## Troubleshoot

| Symptom | Fix |
|---------|-----|
| Browser auth loop | Finish Allow on the Softprobe consent page; ensure you’re signed into Explorer |
| Workspace picker / 409 | Pick a workspace in Explorer, or ask the agent to `list_workspaces` / `select_workspace` |
| MCP tools missing | Re-add `https://explorer.softprobe.ai/mcp` in your client, then complete browser sign-in |
| Confused with OpenCode capture | Capture uses `@softprobe/opencode-plugin` from Connect agent; MCP manages Agent records and investigates Sessions but does not capture telemetry |

## Next

- [Quick start](/en/agent-qa/getting-started) — connect an agent and verify capture
- [Concepts](/en/agent-qa/concepts) — Session and observation shape
- [Explorer](https://explorer.softprobe.ai)
