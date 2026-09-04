---
title: Doctor
---

# Doctor

Use `sp doctor` to check a self-hosted Softprobe installation:

```bash
sp doctor
sp doctor --json
```

The doctor surface reports backend reachability and internal coding engine installation with remediation for failures.

When **`spcode-web.service`** is registered (Spcode Service installed via [`sp setup --install-spcode-service`](/en/testing/installation/#spcode-service)), `sp doctor` also checks that the service is healthy and can reach the configured Softprobe backend.

## JSON output

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

When a check fails:

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
