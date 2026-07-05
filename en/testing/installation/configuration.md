---
title: Configuration
---

# Configuration

Softprobe uses one XDG namespace shared by `sp`, `sp code`, and the Java agent.

| Path | Purpose |
|------|---------|
| `~/.config/softprobe/config.jsonc` | Shared backend URL and credentials |
| `~/.config/softprobe/sp.jsonc` | CLI profiles and overrides |
| `~/.config/softprobe/spcode.jsonc` | Internal coding engine settings |
| `~/.local/share/softprobe/agent/sp-agent.jar` | Installed Java agent |
| `~/.local/share/softprobe/bin/spcode` | Internal coding engine binary |

Use `sp setup` for the backend URL. Use `sp code` for coding-engine and model-provider readiness.

### Spcode Service (Linux systemd)

When installed via [`sp setup --install-spcode-service`](./setup.md#spcode-service-linux-only), the **service** reads backend URL from root's XDG — not the invoking admin's home:

| Context | Config path |
|---------|-------------|
| Personal CLI / `sp code web` | `~/.config/softprobe/config.jsonc` |
| Spcode Service (`spcode-web.service`, runs as root) | `/root/.config/softprobe/config.jsonc` |

There is no sync between personal and service config after install. Change the service backend URL by uninstalling and reinstalling Spcode Service.
