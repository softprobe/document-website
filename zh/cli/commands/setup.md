::: warning CLI reference (English)
The `sp` CLI documentation is available in English. [Switch to English CLI docs](/en/cli/guide/overview).
:::

# sp setup

**When agents use this:** Validate prerequisites before `app create`, agent install, or replay.

## Synopsis

Lifecycle setup helpers. Today the main command is `doctor`.

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `doctor` | Config path, backend health, auth, app count, optional agent jar check |

## `setup doctor`

Orchestrates several read-only checks (no single backend “doctor” API):

```bash
sp setup doctor --json
sp setup doctor --agent-jar /path/to/sp-agent.jar --json
```

| Check | Source |
|-------|--------|
| Config | Active profile URL, token presence |
| Health | `GET /vi/health` |
| Auth | Token configured → `authenticated` / `missing` |
| Apps | `GET /api/applications/list` when token present → `appCount` |
| Agent jar | `--agent-jar` or default `${XDG_DATA_HOME}/softprobe/agent/sp-agent.jar` |
| Agent version | `GET /api/agent/java/manifest` when available; compares local jar sha256 |

Example success envelope:

```json
{
  "ok": true,
  "command": "setup doctor",
  "data": {
    "configPath": "/home/user/.config/softprobe/sp.jsonc",
    "profile": "default",
    "url": "http://127.0.0.1:8090",
    "health": "UP",
    "authState": "authenticated",
    "tokenConfigured": true,
    "appCount": 3,
    "agentJar": "/home/user/.local/share/softprobe/agent/sp-agent.jar",
    "agentJarExists": true,
    "remoteAgentSha256": "abc…",
    "localAgentSha256": "abc…",
    "agentVersionMatch": true,
    "nextActions": []
  }
}
```

When the local jar does not match the backend manifest, `nextActions` includes `sp agent download`.

## Related

- [agent](./agent.md) — download and JVM flags
- [Quickstart](/en/cli/guide/quickstart.md)
- [health](./health.md)
