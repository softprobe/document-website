# sp agent

**When agents use this:** Install a backend-compatible `sp-agent.jar` and get copy-paste JVM flags after `sp app create`.

## Synopsis

| Subcommand | Description |
|------------|-------------|
| `download` | Fetch `sp-agent.jar` from install artifacts; default install dir under XDG data home |
| `command` | Emit `-javaagent` and `sp.*` system properties for record mode |

## `agent download`

```bash
sp agent download --json
sp agent download --version v4.3.5 --json
sp agent download --out-dir "${XDG_DATA_HOME:-$HOME/.local/share}/softprobe/agent" --json
```

Default install directory: `${XDG_DATA_HOME:-~/.local/share}/softprobe/agent`.

Without `--version`, `sp agent download` downloads `https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar`. Use `--version vX.Y.Z` or `--version X.Y.Z` to download an exact agent release.

Writes:

- `sp-agent.jar`

Example envelope:

```json
{
  "ok": true,
  "command": "agent download",
  "data": {
    "dir": "/home/user/.local/share/softprobe/agent",
    "path": "/home/user/.local/share/softprobe/agent/sp-agent.jar",
    "version": "3.9.56",
    "sizeBytes": 27055970
  }
}
```

## `agent command`

On **Softprobe Cloud**, run `sp tenant key ensure` once (or let this command auto-create the key). The output includes `-Dsp.api.token=` for the Java agent.

```bash
sp tenant key ensure --json   # SaaS: once per tenant
sp agent download --json
sp agent command --app a1b2c3d4e5f67890 --json
sp agent command --app a1b2c3d4e5f67890 --agent-jar /opt/softprobe/sp-agent.jar --app-jar target/app.jar --json
```

| Flag | Description |
|------|-------------|
| `--app` | Required. Registered `appId` from `sp app create` |
| `--agent-jar` | Optional. Default: `$SP_AGENT_JAR`, then `${XDG_DATA_HOME}/softprobe/agent/sp-agent.jar` |
| `--app-jar` | Optional. Trailing `-jar …` in `startCommand` |
| `--storage-host` | Override `-Dsp.storage.service.host=` |
| `--config-host` | Override `-Dsp.config.service.host=` (defaults to storage host) |
| `--format` | `json` (default), `shell`, `docker`, `maven` |

Host inference from profile URL:

- `http://127.0.0.1:8090` → `127.0.0.1:8090`
- `https://api.example.com` → `api.example.com` (no default port)

When the default jar is missing:

```json
{
  "ok": false,
  "command": "agent command",
  "error": {
    "code": "USAGE",
    "message": "sp-agent.jar not found; run sp agent download",
    "backend": {
      "nextActions": ["sp agent download"]
    }
  }
}
```

Example success `data` (abbreviated):

```json
{
  "appId": "a1b2c3d4e5f67890",
  "agentJar": "/home/user/.local/share/softprobe/agent/sp-agent.jar",
  "agentJarExists": true,
  "storageHost": "127.0.0.1:8090",
  "configHost": "127.0.0.1:8090",
  "jvmArgs": [
    "-javaagent:/home/user/.local/share/softprobe/agent/sp-agent.jar",
    "-Dsp.app.id=a1b2c3d4e5f67890",
    "-Dsp.storage.service.host=127.0.0.1:8090",
    "-Dsp.config.service.host=127.0.0.1:8090",
    "-Dsp.api.token=…"
  ],
  "startCommand": "java -javaagent:… -Dsp.app.id=… …",
  "startCommandMultiline": "java \\\n  -javaagent:… \\\n  …",
  "dockerJavaToolOptions": "-javaagent:… …",
  "mavenArgLine": "-javaagent:… …",
  "nextActions": [
    "Run startCommand (or paste startCommandMultiline into a run script)",
    "Send traffic, then: sp record case list --app a1b2c3d4e5f67890 --since -1h --json"
  ]
}
```

| `--format` | stdout |
|------------|--------|
| `json` | Full envelope on stdout |
| `shell` | `startCommandMultiline` only |
| `docker` | `ENV JAVA_TOOL_OPTIONS='…'` |
| `maven` | `<argLine>…</argLine>` |

## REST mapping

| Subcommand | Method | Path |
|------------|--------|------|
| `download` | GET | `/api/agent/java/download` |

## Related

- [setup doctor](./setup.md)
- [app](./app.md) — create app and check heartbeat
- [record](./record.md) — list recorded cases
- [Concepts: Java agent](/en/cli/guide/concepts.md)
