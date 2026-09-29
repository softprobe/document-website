# sp agent

**When agents use this:** Download `sp-agent.jar` and get copy-paste JVM flags after `sp app create`.

## Synopsis

| Subcommand | Description |
|------------|-------------|
| `download [version]` | Download `sp-agent.jar`: the given version, or `latest` |
| `command` | Emit `-javaagent` and `sp.*` system properties for record mode |

## `agent download`

Download `sp-agent.jar` to local storage (or specified directory):

```bash
sp agent download --json
sp agent download 2.0.0 --out-dir ./libs --json
```

| Flag | Description |
|------|-------------|
| `--out-dir` | Install directory (default: `${XDG_DATA_HOME}/softprobe/agent`) |
| `--version` | Agent version to download. Same as passing it as the argument, e.g. `sp agent download 2.0.0`. Default: `SOFTPROBE_AGENT_DOWNLOAD_VERSION` if set, otherwise `latest` |

The version is not matched to your backend automatically. If your backend needs a specific agent version, pass it explicitly.

### JSON output (`download`)

```json
{
  "ok": true,
  "command": "agent download",
  "data": {
    "dir": "/home/user/.local/share/softprobe/agent",
    "path": "/home/user/.local/share/softprobe/agent/sp-agent.jar",
    "version": "latest",
    "sizeBytes": 33554432
  }
}
```

## `agent command`

On **Softprobe Cloud**, run `sp tenant key ensure` once (or let this command auto-create the key). The output includes `-Dsp.api.token=` for the Java agent.

```bash
sp tenant key ensure --json   # SaaS: once per tenant
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar
sp agent command --app a1b2c3d4e5f67890 --json
sp agent command --app a1b2c3d4e5f67890 --agent-jar ./sp-agent.jar --app-jar target/app.jar --json
```

| Flag | Description |
|------|-------------|
| `--app` | Required. Registered `appId` from `sp app create` |
| `--agent-jar` | Optional. Default: `$SP_AGENT_JAR`, then `${XDG_DATA_HOME}/softprobe/agent/sp-agent.jar` |
| `--app-jar` | Optional. Trailing `-jar …` in `startCommand` |
| `--format` | `json` (default), `shell`, `docker`, `maven` |

Download `sp-agent.jar` from [Attach the Java agent — download](/en/testing/java-agent#download). Available immutable versions are published under `https://install.softprobe.ai/artifacts/agent/<version>/sp-agent.jar`.

`apiUrl` in the JSON output comes from the resolved CLI profile (`api_url` / `SP_API_URL`). Override with `sp config set-url`, `SP_API_URL`, or the global `--api-url` flag before `agent command`.

Precedence for the agent at runtime (not the CLI): JVM `-Dsp.api.url` → env `SP_API_URL` → bundled `META-INF/sp/sp.agent.conf` in the agent JAR.

When the default jar is missing:

```json
{
  "ok": false,
  "command": "agent command",
  "error": {
    "code": "USAGE",
    "message": "sp-agent.jar not found",
    "backend": {
      "nextActions": ["Download sp-agent.jar from https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar"]
    }
  }
}
```

Example success JSON output:

```json
{
  "ok": true,
  "command": "agent command",
  "data": {
    "appId": "a1b2c3d4e5f67890",
    "agentJar": "/home/user/.local/share/softprobe/agent/sp-agent.jar",
    "agentJarExists": true,
    "apiUrl": "http://127.0.0.1:8090",
    "jvmArgs": [
      "-javaagent:/home/user/.local/share/softprobe/agent/sp-agent.jar",
      "-Dsp.app.id=a1b2c3d4e5f67890",
      "-Dsp.api.url=http://127.0.0.1:8090"
    ],
    "startCommand": "java -javaagent:/home/user/.local/share/softprobe/agent/sp-agent.jar -Dsp.app.id=a1b2c3d4e5f67890 -Dsp.api.url=http://127.0.0.1:8090 -jar target/app.jar",
    "startCommandMultiline": "java \\\n  -javaagent:/home/user/.local/share/softprobe/agent/sp-agent.jar \\\n  -Dsp.app.id=a1b2c3d4e5f67890 \\\n  -Dsp.api.url=http://127.0.0.1:8090 \\\n  -jar target/app.jar",
    "dockerJavaToolOptions": "-javaagent:/home/user/.local/share/softprobe/agent/sp-agent.jar -Dsp.app.id=a1b2c3d4e5f67890 -Dsp.api.url=http://127.0.0.1:8090",
    "mavenArgLine": "-javaagent:/home/user/.local/share/softprobe/agent/sp-agent.jar -Dsp.app.id=a1b2c3d4e5f67890 -Dsp.api.url=http://127.0.0.1:8090",
    "nextActions": [
      "Add -jar your-app.jar to startCommand when starting the service",
      "Run startCommand (or paste startCommandMultiline into a run script)",
      "Send traffic, then: sp record case list --app a1b2c3d4e5f67890 --since -1h --json",
      "Verify heartbeat: sp app status a1b2c3d4e5f67890 --json"
    ]
  }
}
```

| `--format` | stdout |
|------------|--------|
| `json` | Full envelope on stdout |
| `shell` | `startCommandMultiline` only |
| `docker` | `ENV JAVA_TOOL_OPTIONS='…'` |
| `maven` | `<argLine>…</argLine>` |

## Related

- [Check the installation](/en/testing/installation/#doctor) — `sp doctor`
- [app](./app) — create app and check heartbeat
- [record](./record) — list recorded cases
- [Concepts: Java agent](/en/testing/agents/concepts)
