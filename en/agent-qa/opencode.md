---
title: OpenCode
---

# OpenCode install

Install Softprobe Blackbox for [OpenCode](https://opencode.ai) with the `@softprobe/opencode-plugin` package. Prefer the **copy/paste prompt** from Explorer ([Quick start](/en/agent-qa/getting-started)); this page is the full reference. That prompt tells the coding agent to complete the config steps directly and to fetch docs or inspect packages/binaries only when stuck.

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
  "ingestionKey": "<Ingestion Key>",
  "baseUrl": "https://explorer-staging.softprobe.ai/api/thelake",
  "otlp": {
    "tracesEndpoint": "https://explorer-staging.softprobe.ai/api/thelake/v1/traces",
    "protocol": "http/protobuf"
  },
  "resourceAttributes": {
    "deployment.environment.name": "staging"
  }
}
```

| Field | Required | Meaning |
|-------|----------|---------|
| `ingestionKey` | Yes | Ingestion Key (`spk_…`) from Explorer **Agents → + Connect agent** |
| `baseUrl` | Yes | Softprobe API base; use `https://explorer-staging.softprobe.ai/api/thelake` for staging |
| `otlp.tracesEndpoint` | No | Full OTLP traces URL, used as written. `otlp.endpoint` can instead hold a generic OTLP base URL, which gets `/v1/traces` appended. |
| `otlp.protocol` | No | The Softprobe exporter supports `http/protobuf`. |
| `otlp.headers` | No | Additional OTLP request headers; these are not sent to the score API. |
| `resourceAttributes` | No | OpenTelemetry resource attributes, such as `deployment.environment.name: staging` |
| `userId` | No | Optional end-user id on spans |

Server SDK environment variables can configure the same OTLP settings. The Ingestion Key is sent through standard OTLP headers:

```bash
export INGESTION_KEY="spk_…"
export SOFTPROBE_BASE_URL="https://explorer-staging.softprobe.ai/api/thelake"
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="https://explorer-staging.softprobe.ai/api/thelake/v1/traces"
export OTEL_EXPORTER_OTLP_TRACES_HEADERS="Authorization=Bearer ${INGESTION_KEY}"
export OTEL_EXPORTER_OTLP_TRACES_PROTOCOL="http/protobuf"
export OTEL_RESOURCE_ATTRIBUTES="deployment.environment.name=staging"
```

Explicit fields in `opencode-softprobe.json` override environment values; environment values fill fields omitted from the file. Do not commit credentials to source control. `SOFTPROBE_BASE_URL` also selects the environment for score writes, while the OTLP endpoint controls trace export.

## 3. Verify

1. **You** restart OpenCode (required so the plugin loads in your interactive session). Restart is a user step — the Connect Agent paste prompt does not ask the coding agent to restart.
2. Ensure a Session was traced: the install prompt has OpenCode run `opencode run "What is 1+2?"`, or run one real chat turn yourself (with tools if you use them).
3. In Explorer, open **Agents → + Connect agent** and **Check connection**, or browse **Sessions** for the new Session (range filter defaults to the last 7 days).

Sessions are matched to the Explorer Agent via the Ingestion Key; you do not set an agent name in credentials.

## What is traced

- User turns (`opencode.turn` / agent) with prompt text
- Model generations with completions, usage, and cost
- Tool executions with arguments and results
- Retries, reasoning, compaction events
- Failed steps and session errors / aborts
- Sub-agent (`task`) work nested under the parent turn (same product session id;
  span parent links to the dispatching task when linkage is unambiguous)

## Troubleshooting

| Symptom | Check |
|---------|--------|
| No Sessions appear | Plugin listed in `opencode.json` / `opencode.jsonc`, `experimental.openTelemetry` true, you restarted OpenCode, then `opencode run "What is 1+2?"` or one real chat turn |
| Auth / ingest errors | `ingestionKey` and `baseUrl` match the values from Connect Agent; the key was not rotated without updating the file |
| Wrong OpenCode config file | Edit the file you already use (`opencode.json` or `opencode.jsonc` under project or `~/.config/opencode`); see [OpenCode config](https://opencode.ai/docs/config/) |
| Wrong Softprobe credentials path | Confirm `~/.config/opencode/opencode-softprobe.json` (or `OPENCODE_CONFIG_DIR`); matching environment values override file values |
| Partial traces | Ensure the process stays alive long enough to flush; serverless/short-lived hosts may need an explicit flush |

Package source: [`@softprobe/opencode-plugin`](https://www.npmjs.com/package/@softprobe/opencode-plugin).
