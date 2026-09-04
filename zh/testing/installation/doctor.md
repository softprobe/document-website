---
title: Doctor
---

# Doctor

使用 `sp doctor` 检查自托管 Softprobe 安装状态：

```bash
sp doctor
sp doctor --json
```

检查项包括后端可达性和内部编码引擎安装状态。

若已通过 [`sp setup --install-spcode-service`](/zh/testing/installation/#spcode-service) 安装 **Spcode Service**（`spcode-web.service` 已注册），`sp doctor` 还会检查服务是否健康，以及能否访问已配置的 Softprobe 后端。

## JSON 输出

```json
{
  "ok": true,
  "command": "doctor",
  "data": {
    "status": "healthy",
    "url": "http://127.0.0.1:8090",
    "checks": [
      {
        "name": "backend",
        "status": "healthy",
        "detail": "backend is reachable"
      },
      {
        "name": "spcode",
        "status": "healthy",
        "detail": "/home/user/.local/share/softprobe/bin/spcode"
      }
    ]
  }
}
```

当检查失败时：

```json
{
  "ok": true,
  "command": "doctor",
  "data": {
    "status": "failed",
    "url": "http://127.0.0.1:8090",
    "checks": [
      {
        "name": "backend",
        "status": "failed",
        "detail": "backend is unreachable",
        "remediation": "Check the API URL and that sp-backend is running"
      },
      {
        "name": "spcode",
        "status": "healthy",
        "detail": "/home/user/.local/share/softprobe/bin/spcode"
      }
    ]
  }
}
```
