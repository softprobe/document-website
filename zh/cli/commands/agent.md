# sp agent

**When agents use this:** Install a backend-compatible `sp-agent.jar` and get copy-paste JVM flags after `sp app create`.

## Synopsis

| Subcommand | Description |
|------------|-------------|
| `command` | Emit `-javaagent` and `sp.*` system properties for record mode |

## `agent command`

```bash
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

请从 [Java Agent 安装](/zh/testing/installation/agent) 下载 `sp-agent.jar`。不可变版本发布在 `https://install.softprobe.ai/artifacts/agent/<version>/sp-agent.jar`。

JSON 中的 `apiUrl` 来自 CLI 配置（`api_url` / `SP_API_URL`）。可通过 `sp config set-url`、`SP_API_URL` 或全局 `--api-url` 覆盖。

Agent 运行时解析顺序：JVM `-Dsp.api.url` → 环境变量 `SP_API_URL` → JAR 内嵌 `META-INF/sp/sp.agent.conf`。

When the default jar is missing:

```json
{
  "ok": false,
  "command": "agent command",
  "error": {
    "code": "USAGE",
    "message": "sp-agent.jar not found",
    "backend": {
      "nextActions": ["从 https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar 下载 sp-agent.jar"]
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
  "apiUrl": "http://127.0.0.1:8090",
  "jvmArgs": [
    "-javaagent:/home/user/.local/share/softprobe/agent/sp-agent.jar",
    "-Dsp.app.id=a1b2c3d4e5f67890",
    "-Dsp.api.url=http://127.0.0.1:8090",
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

## Related

- [Doctor](/zh/testing/installation/doctor) — `sp doctor`
- [app](./app.md) — create app and check heartbeat
- [record](./record.md) — list recorded cases
- [Concepts: Java agent](/en/cli/guide/concepts.md)
