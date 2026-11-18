---
title: Investigate with a coding agent
---

# Use Blackbox with a coding agent

Install the Blackbox plugin (`softprobe-blackbox@softprobe`) from the Softprobe plugin marketplace ([`softprobe/softprobe-plugin`](https://github.com/softprobe/softprobe-plugin)) to connect your AI coding agent to Softprobe Explorer. Sign in through the browser with your existing Explorer account. Blackbox gives your agent 17 MCP tools and investigation skills to query Sessions, inspect spans and traces, read correlated logs, manage Agent apps, and retrieve Ingestion Keys when requested.

This is separate from **capture** (the `@softprobe/web-record` browser SDK, OBI, or AI framework SDKs). Capture records Sessions. The Blackbox plugin lets your coding agent **manage Agents and investigate Sessions**.

## 1. Install the Blackbox plugin (Recommended)

`softprobe/softprobe-plugin` is Softprobe's multi-product plugin marketplace (Apache-2.0). Installing `softprobe-blackbox@softprobe` configures both the Blackbox skills and the hosted MCP server (`https://explorer.softprobe.ai/mcp`).

::: code-group

```text [Claude Code]
/plugin marketplace add softprobe/softprobe-plugin
/plugin install softprobe-blackbox@softprobe
```

```bash [OpenCode]
opencode plugin @softprobe/opencode-blackbox -g
```

```bash [Gemini CLI]
gemini extensions install https://github.com/softprobe/softprobe-plugin
```

```bash [Cursor]
npx skills add softprobe/softprobe-plugin -g -y -a cursor
```

```bash [Codex]
npx skills add softprobe/softprobe-plugin -g -y -a codex
```

```bash [Antigravity]
npx skills add softprobe/softprobe-plugin -g -y -a antigravity
```

:::

- **Claude Code**: Run `/plugin marketplace add softprobe/softprobe-plugin` and `/plugin install softprobe-blackbox@softprobe` inside Claude Code.
- **Cursor**: Add `softprobe/softprobe-plugin` in **Settings → Plugins** and install `softprobe-blackbox@softprobe`, or install the skills with `npx skills add softprobe/softprobe-plugin -g -y -a cursor`. If your Cursor version does not auto-mount the plugin's MCP server, also add the [manual MCP fallback](#manual-fallback-direct-hosted-mcp).
- **OpenAI Codex CLI**: Enable `softprobe-blackbox@softprobe` from `softprobe/softprobe-plugin` in your Codex plugin configuration, or run `npx skills add softprobe/softprobe-plugin -g -y -a codex` and add the [manual MCP fallback](#manual-fallback-direct-hosted-mcp).
- **VS Code / GitHub Copilot**: Add `softprobe/softprobe-plugin` as an agent plugin marketplace in VS Code and install `softprobe-blackbox@softprobe`, or add `https://explorer.softprobe.ai/mcp` to `.vscode/mcp.json` via the [manual MCP fallback](#manual-fallback-direct-hosted-mcp).
- **Gemini CLI**: Run `gemini extensions install https://github.com/softprobe/softprobe-plugin` in your terminal.
- **Antigravity (`agy`)**: Install `softprobe-blackbox@softprobe` from `softprobe/softprobe-plugin` or run `npx skills add softprobe/softprobe-plugin -g -y -a antigravity`, then ensure `blackbox` is configured in `~/.gemini/config/mcp_config.json` or `.agents/mcp_config.json`.
- **OpenCode**: Run `opencode plugin @softprobe/opencode-blackbox -g` in your terminal.
- **Windsurf**: Install `softprobe-blackbox@softprobe` from `softprobe/softprobe-plugin`, or add `https://explorer.softprobe.ai/mcp` to `~/.codeium/windsurf/mcp_config.json` via the [manual MCP fallback](#manual-fallback-direct-hosted-mcp).

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

- **Claude Code**: Run `/mcp` in Claude Code and authorize `blackbox` with your Explorer account in the browser.
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
- **VS Code / GitHub Copilot, Gemini CLI, and Windsurf**: Trigger any Blackbox MCP tool or open your client's MCP panel to complete the browser OAuth sign-in flow.

Then ask your coding agent to call `whoami` or `list_workspaces` to confirm access. If you have multiple workspaces, ask it to call `select_workspace` with the target `workspace_id` to switch.

## 3. Available Blackbox MCP tools

Blackbox exposes 17 MCP tools across account context, telemetry investigation, and Agent management:

| Category | Tools | Purpose |
|----------|-------|---------|
| **Account & workspace** | `whoami`, `list_workspaces`, `select_workspace` | Check signed-in user, list accessible workspaces, and switch the active workspace |
| **Sessions** | `search_sessions`, `get_session`, `get_session_spans` | Search Sessions by agent, status, or time range, and inspect Session metadata and spans |
| **Spans & traces** | `search_spans`, `get_span`, `search_traces`, `get_trace`, `list_trace_tags`, `list_trace_tag_values` | Filter GenAI, tool, and HTTP spans, inspect full distributed traces, and discover trace tag keys and values |
| **Logs** | `logs_by_session`, `logs_by_trace` | Read structured logs correlated to a Session or trace |
| **Agents & keys** | `list_agents`, `create_agent`, `get_ingestion_key` | List Agent apps, create a new Agent app, and reveal an Agent's Ingestion Key when requested |

## 4. Ask your agent

Examples:

- Use Blackbox: why did session `sess_…` fail? Check tool errors, logs, and the last generation.
- Blackbox: list Sessions from the last 24 hours with errors for agent `my-agent`.
- Blackbox: open trace `…` and summarize tool results versus the model's final answer.
- Blackbox: create an Agent app named `checkout-bot` and show its Ingestion Key.

The agent cites `session_id`, `trace_id`, or `span_id` and links directly to Explorer:

`https://explorer.softprobe.ai?session=<session_id>`

## Manual fallback: Direct hosted MCP

If your client or environment does not support native plugin installation, add the hosted MCP server (`https://explorer.softprobe.ai/mcp`) directly as `blackbox`:

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

```json [VS Code / Copilot]
{
  "servers": {
    "blackbox": {
      "type": "http",
      "url": "https://explorer.softprobe.ai/mcp"
    }
  }
}
```

```json [Gemini CLI]
{
  "mcpServers": {
    "blackbox": {
      "httpUrl": "https://explorer.softprobe.ai/mcp"
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

```json [Windsurf]
{
  "mcpServers": {
    "blackbox": {
      "serverUrl": "https://explorer.softprobe.ai/mcp"
    }
  }
}
```

:::

- **Cursor**: Save the JSON snippet in `.cursor/mcp.json` or `~/.cursor/mcp.json`, or select [Add Blackbox to Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=Blackbox&config=eyJ1cmwiOiJodHRwczovL2V4cGxvcmVyLnNvZnRwcm9iZS5haS9tY3AifQ%3D%3D).
- **VS Code / GitHub Copilot**: Save the JSON snippet in `.vscode/mcp.json` (workspace) or your VS Code user `mcp.json`.
- **Gemini CLI**: Save the JSON snippet in `~/.gemini/settings.json` or `.gemini/settings.json`.
- **Antigravity (`agy`)**: Save the JSON snippet in `~/.gemini/config/mcp_config.json` (global) or `.agents/mcp_config.json` (workspace).
- **Windsurf**: Save the JSON snippet in `~/.codeium/windsurf/mcp_config.json`.

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

```json [VS Code / Copilot]
{
  "servers": {
    "blackbox-staging": {
      "type": "http",
      "url": "https://explorer-staging.softprobe.ai/mcp"
    }
  }
}
```

```bash [Gemini CLI]
{
  "mcpServers": {
    "blackbox-staging": {
      "httpUrl": "https://explorer-staging.softprobe.ai/mcp"
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

```json [Windsurf]
{
  "mcpServers": {
    "blackbox-staging": {
      "serverUrl": "https://explorer-staging.softprobe.ai/mcp"
    }
  }
}
```

:::

Sign in to `blackbox-staging` with the same client command using `blackbox-staging` as the server name (for example, `codex mcp login blackbox-staging`, `opencode mcp auth blackbox-staging`, or `/mcp` in Claude Code or Antigravity).

### Self-hosted local MCP (`blackbox-local`)

If you run Blackbox locally with `docker compose up -d` (`AUTH_MODE=local`), connect your coding agent to `http://127.0.0.1:8787/mcp` without OAuth login. See [Self-host Blackbox](/en/agent-qa/self-hosting#_3-connect-local-mcp) for copy-pasteable client snippets.

## Privacy

- Hosted MCP uses your Softprobe user login (OAuth). Tokens stay with your MCP client.
- Session, span, trace, and log tools are read-only.
- Agent tools use your selected workspace membership. `create_agent` adds an Agent app, and `get_ingestion_key` returns that Agent's Ingestion Key only when requested.
- Ingestion Keys can only send telemetry. They cannot use MCP or read Sessions.

## Troubleshoot

| Symptom | Fix |
|---------|-----|
| Browser auth loop | Finish Allow on the Softprobe consent page and confirm you are signed into Explorer |
| Workspace picker / 409 | Use the workspace picker at the bottom of Explorer's sidebar, or ask the agent to call `list_workspaces` and `select_workspace` |
| MCP tools missing | Reinstall `softprobe-blackbox@softprobe` from `softprobe/softprobe-plugin` or add `https://explorer.softprobe.ai/mcp` manually, then complete browser sign-in |
| Confused with OpenCode capture | Capture uses `@softprobe/opencode-plugin` from Connect agent. Blackbox (`@softprobe/opencode-blackbox` and MCP) manages Agent records and investigates Sessions without capturing telemetry |

## Next

- [Quick start](/en/agent-qa/getting-started): connect an agent and verify capture
- [Concepts](/en/agent-qa/concepts): Session and observation shape
- [Explorer](https://explorer.softprobe.ai)
