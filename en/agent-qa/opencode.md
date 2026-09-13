---
title: OpenCode
---

# OpenCode install

Install Softprobe Agent QA for [OpenCode](https://opencode.ai) with the `@softprobe/opencode-plugin` package. Prefer the **copy/paste prompt** from Explorer ([Quick start](/en/agent-qa/getting-started)); this page is the full reference.

OpenCode loads plugins in two official ways: **npm packages** listed in config, or **local files** under a plugins directory. Softprobe uses the npm path. See OpenCode’s docs:

- [Config](https://opencode.ai/docs/config/) — `opencode.json` / `opencode.jsonc`, merge order, locations
- [Plugins](https://opencode.ai/docs/plugins/) — npm `plugin` field, Bun install on startup, local plugin dirs

## 1. Enable the plugin

Merge into your existing OpenCode config (**JSON or JSONC**). Prefer a project file if present; otherwise use the global config:

| Scope | Files |
|-------|--------|
| Project | `./opencode.json` or `./opencode.jsonc` |
| Global | `~/.config/opencode/opencode.json` or `~/.config/opencode/opencode.jsonc` |

OpenCode **merges** config sources (later sources override conflicting keys). Keep existing keys; if `plugin` already exists, append `@softprobe/opencode-plugin@latest` to that array.

```json
{
  "experimental": {
    "openTelemetry": true
  },
  "plugin": ["@softprobe/opencode-plugin@latest"]
}
```

OpenCode installs npm plugins automatically with Bun at startup (cached under `~/.cache/opencode/node_modules/`). Restart OpenCode after changing the config.

## 2. Credentials

Create `opencode-softprobe.json` in the OpenCode config directory (this is a **Softprobe** credentials file, not part of the OpenCode schema):

- Default: `$XDG_CONFIG_HOME/opencode` (or `~/.config/opencode`)
- Override directory with `OPENCODE_CONFIG_DIR`

```json
{
  "publicKey": "<agent-api-key>",
  "baseUrl": "https://explorer.softprobe.ai/api/thelake",
  "otlpEndpoint": "https://explorer.softprobe.ai/api/thelake/v1/traces",
  "environment": "Production"
}
```

| Field | Required | Meaning |
|-------|----------|---------|
| `publicKey` | Yes | Agent API key (`spk_…`) from Explorer **Agents → + Connect agent** |
| `baseUrl` | Yes | `https://explorer.softprobe.ai/api/thelake` |
| `otlpEndpoint` | No | Defaults to `{baseUrl}/v1/traces` |
| `environment` | No | Label matching the Agent environment in Explorer (e.g. `Production`) |
| `userId` | No | Optional end-user id on spans |

Or set environment variables (env wins when both key and base URL are set):

```bash
export SOFTPROBE_PUBLIC_KEY="spk_…"
export SOFTPROBE_BASE_URL="https://explorer.softprobe.ai/api/thelake"
export SOFTPROBE_OTLP_ENDPOINT="https://explorer.softprobe.ai/api/thelake/v1/traces"
export SOFTPROBE_ENVIRONMENT="Production"
```

The Connect Agent install prompt embeds your agent API key and these URLs. Do not commit credentials to source control.

## 3. Verify

1. Restart OpenCode.
2. Run one real chat turn (with tools if you use them).
3. In Explorer, open **Agents → + Connect agent** and **Check connection**, or browse **Sessions** for the new Session (range filter defaults to the last 7 days).

For Sessions to filter by Agent name, set span attribute **`sp.agent.name`** to the same name as the Explorer Agent.

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
| No Sessions appear | Plugin listed in `opencode.json` / `opencode.jsonc`, `experimental.openTelemetry` true, OpenCode restarted, then one real chat turn |
| Auth / ingest errors | `publicKey` and `baseUrl` match the values from Connect Agent; key was not rotated without updating the file |
| Wrong OpenCode config file | Edit the file you already use (`opencode.json` or `opencode.jsonc` under project or `~/.config/opencode`); see [OpenCode config](https://opencode.ai/docs/config/) |
| Wrong Softprobe credentials path | Confirm `~/.config/opencode/opencode-softprobe.json` (or `OPENCODE_CONFIG_DIR`); env overrides file when both key and base URL are set |
| Partial traces | Ensure the process stays alive long enough to flush; serverless/short-lived hosts may need an explicit flush |

Package source: [`@softprobe/opencode-plugin`](https://www.npmjs.com/package/@softprobe/opencode-plugin).
