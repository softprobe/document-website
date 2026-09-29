---
title: sp agent：Java Agent 安装与启动命令
---

# sp agent：Java Agent 安装与启动命令

**AI 代理何时使用：** `sp app create` 之后，下载 `sp-agent.jar`，并拿到可直接粘贴的 JVM 参数。

## 概要 {#synopsis}

| 子命令 | 说明 |
|------------|-------------|
| `download [version]` | 下载 `sp-agent.jar`：指定的版本，或 `latest` |
| `command` | 输出录制模式的 `-javaagent` 和 `sp.*` 系统属性 |

## `agent download`

把 `sp-agent.jar` 下载到本地存储（或指定目录）：

```bash
sp agent download --json
sp agent download 2.0.0 --out-dir ./libs --json
```

| 参数 | 说明 |
|------|-------------|
| `--out-dir` | 安装目录（默认：`${XDG_DATA_HOME}/softprobe/agent`） |
| `--version` | 要下载的 Agent 版本，也可以直接写在命令后面，如 `sp agent download 2.0.0`。默认：设置了 `SOFTPROBE_AGENT_DOWNLOAD_VERSION` 时用它，否则用 `latest` |

下载的版本不会自动和后端配套。后端要求特定版本的 Agent 时，请显式指定版本。

### JSON 输出（`download`） {#json-output-download}

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

在 **SoftProbe Cloud** 上，先运行一次 `sp tenant key ensure`（或让本命令自动创建密钥）。输出会包含 Java Agent 使用的 `-Dsp.api.token=`。

```bash
sp tenant key ensure --json   # SaaS：每个租户一次
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar
sp agent command --app a1b2c3d4e5f67890 --json
sp agent command --app a1b2c3d4e5f67890 --agent-jar ./sp-agent.jar --app-jar target/app.jar --json
```

| 参数 | 说明 |
|------|-------------|
| `--app` | 必填。`sp app create` 注册的 `appId` |
| `--agent-jar` | 可选。默认：`$SP_AGENT_JAR`，其次 `${XDG_DATA_HOME}/softprobe/agent/sp-agent.jar` |
| `--app-jar` | 可选。拼在 `startCommand` 末尾的 `-jar …` |
| `--format` | `json`（默认）、`shell`、`docker`、`maven` |

`sp-agent.jar` 的下载见 [接入 Java Agent — 下载](/zh/testing/java-agent#download)。各固定版本发布在 `https://install.softprobe.ai/artifacts/agent/<version>/sp-agent.jar` 下。

JSON 输出中的 `apiUrl` 来自解析后的 CLI 配置档案（`api_url` / `SP_API_URL`）。可在 `agent command` 之前用 `sp config set-url`、`SP_API_URL` 或全局参数 `--api-url` 覆盖。

Agent 运行时的优先级（不是 CLI 的）：JVM `-Dsp.api.url` → 环境变量 `SP_API_URL` → Agent JAR 内置的 `META-INF/sp/sp.agent.conf`。

默认 jar 不存在时：

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

成功的 JSON 输出示例：

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
| `json` | 完整信封输出到 stdout |
| `shell` | 只有 `startCommandMultiline` |
| `docker` | `ENV JAVA_TOOL_OPTIONS='…'` |
| `maven` | `<argLine>…</argLine>` |

## 相关文档 {#related}

- [检查安装](/zh/testing/installation/#doctor) —— `sp doctor`
- [app](./app) —— 创建应用、检查心跳
- [record](./record) —— 列出已录制的用例
- [概念：Java Agent](/zh/testing/agents/concepts)
