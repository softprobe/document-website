---
title: sp setup
---

# sp setup

Command reference. Install flow, Spcode Service, and systemd ops are documented in [Install Softprobe](/en/testing/installation/#spcode-service).

```bash
sp setup
sp setup --api-url http://127.0.0.1:8090 --json
sp setup --install-spcode-service --json
sp setup --uninstall-spcode-service --json
sp setup doctor --json
```

| Flag | Description |
|------|-------------|
| `--api-url` | Softprobe API URL (backend base URL) |
| `--install-spcode-service` | Install Spcode Service (Linux only) |
| `--uninstall-spcode-service` | Remove Spcode Service |
| `--spcode-service-port` | Listen port (default 4096) |

## JSON output (`setup`)

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

When `--install-spcode-service` or `--uninstall-spcode-service` is provided:

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

## JSON output (`setup doctor`)

Validate setup configuration and local agent jar:

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
