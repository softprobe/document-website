---
title: sp setup
---

# sp setup

Command reference. Install flow, Spcode Service, and systemd ops are documented in [Install Softprobe](/en/testing/installation/#spcode-service).

```bash
sp setup
sp setup --backend-url http://127.0.0.1:8090
sp setup --install-spcode-service
sp setup --uninstall-spcode-service
```

| Flag | Description |
|------|-------------|
| `--backend-url` | Softprobe backend URL |
| `--install-spcode-service` | Install Spcode Service (Linux only) |
| `--uninstall-spcode-service` | Remove Spcode Service |
| `--spcode-service-port` | Listen port (default 4096) |

With `--json`, responses may include `spcodeServiceStatus` and `spcodeServicePort`.
