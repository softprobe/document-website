# sp agent

**When agents use this:** Install a backend-compatible `sp-agent.jar` and get copy-paste JVM flags after `sp app create`.

## Synopsis

| Subcommand | Description |
|------------|-------------|
| `download [version]` | 下载匹配当前后端版本的 `sp-agent.jar` |
| `command` | 生成录制模式所需的 `-javaagent` 与 `sp.*` JVM 启动参数 |

## `agent download`

下载 `sp-agent.jar` 到本地存储目录（或指定目录）：

```bash
sp agent download --json
sp agent download 2.0.0 --out-dir ./libs --json
```

| Flag | Description |
|------|-------------|
| `--out-dir` | 安装目录（默认：`${XDG_DATA_HOME}/softprobe/agent`） |
| `--version` | 指定 agent 版本（默认：latest） |

### JSON 输出 (`download`)

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

在 **Softprobe Cloud** 上，先运行一次 `sp tenant key ensure`（或让本命令自动创建 key）。输出中会包含供 Java agent 使用的 `-Dsp.api.token=`。

```bash
sp tenant key ensure --json   # SaaS：每个租户一次
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

请从 [下载 Java Agent](/zh/testing/download-java-agent) 下载 `sp-agent.jar`。不可变版本发布在 `https://install.softprobe.ai/artifacts/agent/<version>/sp-agent.jar`。

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

成功时的 JSON 输出示例：

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
      "启动服务时在 startCommand 后添加 -jar your-app.jar",
      "运行 startCommand（或复制 startCommandMultiline 粘贴到启动脚本中）",
      "发送流量，然后运行：sp record case list --app a1b2c3d4e5f67890 --since -1h --json",
      "检查心跳状态：sp app status a1b2c3d4e5f67890 --json"
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

- [Doctor](/zh/testing/installation/doctor) — `sp doctor`
- [app](./app) — create app and check heartbeat
- [record](./record) — list recorded cases
- [Concepts: Java agent](/zh/testing/agents/concepts)
