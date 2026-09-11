---
title: OpenCode
---

# OpenCode install

Install Softprobe Agent QA for [OpenCode](https://opencode.ai) with the `@softprobe/opencode-plugin` package. Prefer the **copy/paste prompt** from Explorer ([Quick start](/en/agent-qa/getting-started)); this page is the full reference.

## 1. Enable the plugin

In `opencode.json` or `opencode.jsonc`:

```json
{
  "experimental": {
    "openTelemetry": true
  },
  "plugin": ["@softprobe/opencode-plugin@latest"]
}
```

Restart OpenCode after changing the config.

## 2. Credentials

Create `opencode-softprobe.json` in the OpenCode config directory:

- OpenCode: `$XDG_CONFIG_HOME/opencode` (or `~/.config/opencode`)
- Softprobe spcode: `$XDG_CONFIG_HOME/spcode` (or `~/.config/spcode`)
- Override directory with `OPENCODE_CONFIG_DIR`

When both `spcode` and `opencode` credential files exist, **spcode wins**.

```json
{
  "publicKey": "<softprobe-bearer-token>",
  "baseUrl": "https://thelake.softprobe.ai",
  "otlpEndpoint": "https://thelake.softprobe.ai/v1/traces",
  "environment": "production",
  "userId": "your-user-id"
}
```

`publicKey` and `baseUrl` are required. `otlpEndpoint` defaults to `{baseUrl}/v1/traces`.

Or set environment variables (env wins when both key and base URL are set):

```bash
export SOFTPROBE_PUBLIC_KEY="..."
export SOFTPROBE_BASE_URL="https://thelake.softprobe.ai"
export SOFTPROBE_OTLP_ENDPOINT="https://thelake.softprobe.ai/v1/traces"
export SOFTPROBE_ENVIRONMENT="production"
export SOFTPROBE_USER_ID="your-user-id"
```

::: tip Shared smoke tenant
Explorer’s Connect prompt currently embeds the Softprobe production smoke token for the default tenant. Per-tenant credentials will replace this when user management is ready. Do not commit credentials to source control.
:::

## 3. Verify

1. Restart OpenCode.
2. Run one real chat turn (with tools if you use them).
3. In Explorer, open **Agents** → **+ Connect agent** (or your Agent) and **Check connection**, or browse **Sessions** for the new Session.

## What is traced

- User turns (`opencode.turn` / agent) with prompt text
- Model generations with completions, usage, and cost
- Tool executions with arguments and results
- Retries, reasoning, compaction events
- Failed steps and session errors / aborts
- Sub-agent (`task`) sessions nested under the parent turn when linkage is unambiguous

## Troubleshooting

| Symptom | Check |
|---------|--------|
| No Sessions appear | Plugin listed in `opencode.json`, `experimental.openTelemetry` true, OpenCode restarted |
| Auth / ingest errors | `publicKey` and `baseUrl` in `opencode-softprobe.json` or `SOFTPROBE_*` env |
| Wrong config file | Confirm path under `~/.config/opencode` (or `spcode`); env overrides file when both key and base URL are set |
| Partial traces | Ensure the process stays alive long enough to flush; serverless/short-lived hosts may need an explicit flush |

Package source: [`@softprobe/opencode-plugin`](https://www.npmjs.com/package/@softprobe/opencode-plugin).
