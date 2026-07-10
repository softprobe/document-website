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

When installed via [`sp setup --install-spcode-service`](./#spcode-service), the **service** runs as root and uses **two** config namespaces:

| Context | Path | Purpose |
|---------|------|---------|
| Personal CLI / `sp code web` | `~/.config/softprobe/config.jsonc` | Your Softprobe backend URL |
| Spcode Service backend | `/root/.config/softprobe/config.jsonc` | Softprobe API URL for the shared workbench |
| Spcode Service coding engine | `/root/.config/spcode/opencode.jsonc` | MCP servers and engine settings (optional; create after install) |
| Spcode Service agent instructions | `/root/.config/spcode/AGENTS.md` | Global agent instructions (optional; create after install) |

There is no sync between personal and service config after install. Change the service backend URL by uninstalling and reinstalling Spcode Service.

How to add MCP and `AGENTS.md` for the shared workbench: [Spcode Service — MCP and agent instructions](./#spcode-service-mcp-agents).
