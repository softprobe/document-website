---
title: Self-host Blackbox
---

# Self-host Blackbox

Run Blackbox Explorer locally with Docker Compose in `AUTH_MODE=local`. No Supabase project or Cloudflare account is required.

If you want a managed setup with team workspaces, OAuth sign-in, and zero infrastructure to maintain, use [Softprobe Explorer Cloud](https://explorer.softprobe.ai) instead.

| Option | Endpoint | Auth | Best for |
|--------|----------|------|----------|
| **Managed Cloud** | `https://explorer.softprobe.ai` | Browser OAuth and team workspaces | Zero-ops teams and shared production debugging |
| **Self-hosted** | `http://127.0.0.1:8787` | `AUTH_MODE=local` (single local workspace) | Local evaluation, air-gapped CI, and self-managed hosts |

## 1. Start the local stack

Clone the repository and start Explorer with Docker Compose:

```bash
git clone https://github.com/softprobe/sp-llm.git
cd sp-llm
docker compose up -d
```

Explorer starts in `AUTH_MODE=local` and opens directly into a local workspace at `http://127.0.0.1:8787` without a login screen.

## 2. Send telemetry to your local Explorer

Open `http://127.0.0.1:8787`, go to **Agents**, and create an Agent to get an Ingestion Key (`spk_...`). Point your OpenTelemetry trace exporter at the local ingest endpoint:

```bash
export OTEL_SERVICE_NAME="my-agent"
export INGESTION_KEY="spk_REPLACE_WITH_INGESTION_KEY"
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="http://127.0.0.1:8787/api/thelake/v1/traces"
export OTEL_EXPORTER_OTLP_TRACES_HEADERS="Authorization=Bearer ${INGESTION_KEY}"
export OTEL_EXPORTER_OTLP_TRACES_PROTOCOL="http/protobuf"
```

Run your application or agent, then open `http://127.0.0.1:8787` to inspect captured Sessions, spans, and traces.

## 3. Connect local MCP

Connect your coding agent to the local MCP server at `http://127.0.0.1:8787/mcp` under `blackbox-local`:

::: code-group

```bash [Claude Code]
claude mcp remove blackbox-local 2>/dev/null; claude mcp add --transport http blackbox-local http://127.0.0.1:8787/mcp
```

```bash [Codex]
codex mcp add blackbox-local --url http://127.0.0.1:8787/mcp
```

```json [Cursor]
{
  "mcpServers": {
    "blackbox-local": {
      "url": "http://127.0.0.1:8787/mcp"
    }
  }
}
```

```json [Antigravity]
{
  "mcpServers": {
    "blackbox-local": {
      "url": "http://127.0.0.1:8787/mcp"
    }
  }
}
```

```bash [OpenCode]
opencode mcp add blackbox-local --global --url http://127.0.0.1:8787/mcp
```

```json [VS Code / Copilot]
{
  "servers": {
    "blackbox-local": {
      "type": "http",
      "url": "http://127.0.0.1:8787/mcp"
    }
  }
}
```

```json [Gemini CLI]
{
  "mcpServers": {
    "blackbox-local": {
      "httpUrl": "http://127.0.0.1:8787/mcp"
    }
  }
}
```

```json [Windsurf]
{
  "mcpServers": {
    "blackbox-local": {
      "serverUrl": "http://127.0.0.1:8787/mcp"
    }
  }
}
```

:::

When `AUTH_MODE=local` is enabled, local MCP requests use the local workspace directly and do not require OAuth sign-in. Ask your coding agent to call `list_agents` or `search_sessions` to confirm the connection.

## Switch to Managed Cloud

When you are ready for shared team workspaces, hosted storage, and OAuth-backed MCP access without running containers, sign in at [explorer.softprobe.ai](https://explorer.softprobe.ai) and follow the [Quick start](/en/agent-qa/getting-started).

## Next

- [Quick start](/en/agent-qa/getting-started)
- [Investigate with a coding agent](/en/agent-qa/coding-agent-skills)
- [End-to-end session tracing](/en/agent-qa/end-to-end-session-tracing)
