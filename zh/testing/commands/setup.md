---
title: sp setup
---

# sp setup

命令参考。安装、Spcode Service 与运维说明见 [安装 SoftProbe](/zh/testing/installation/#spcode-service)。

```bash
sp setup
sp setup --api-url http://127.0.0.1:8090 --json
sp setup --install-spcode-service --json
sp setup --uninstall-spcode-service --json
sp setup doctor --json
```

| 参数 | 说明 |
|------|------|
| `--api-url` | 后端 URL |
| `--install-spcode-service` | 安装 Spcode Service（仅 Linux） |
| `--uninstall-spcode-service` | 卸载 Spcode Service |
| `--spcode-service-port` | 监听端口（默认 4096） |

## JSON 输出 (`setup`)

```json
{
  "ok": true,
  "command": "setup",
  "data": {
    "status": "configured",
    "profile": "default",
    "apiUrl": "http://127.0.0.1:8090",
    "spcodeServiceStatus": "skipped"
  }
}
```

当指定 `--install-spcode-service` 或 `--uninstall-spcode-service` 时：

```json
{
  "ok": true,
  "command": "setup",
  "data": {
    "spcodeServiceStatus": "installed",
    "spcodeServicePort": 4096
  }
}
```

## JSON 输出 (`setup doctor`)

验证 setup 配置与本地 agent jar：

```json
{
  "ok": true,
  "command": "setup doctor",
  "data": {
    "status": "healthy",
    "profile": "default",
    "apiUrl": "http://127.0.0.1:8090",
    "agentJar": "/home/user/.local/share/softprobe/agent/sp-agent.jar",
    "agentJarExists": true,
    "checks": [
      {
        "name": "config",
        "status": "healthy",
        "detail": "http://127.0.0.1:8090"
      },
      {
        "name": "agentJar",
        "status": "healthy",
        "detail": "/home/user/.local/share/softprobe/agent/sp-agent.jar"
      }
    ]
  }
}
```
