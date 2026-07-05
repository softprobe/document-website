---
title: Configuration
---

# Configuration

Softprobe uses one XDG namespace shared by `sp` and `sp code`.

| Path | Purpose |
|------|---------|
| `~/.config/softprobe/config.jsonc` | Shared backend URL and credentials |
| `~/.config/softprobe/sp.jsonc` | CLI-only defaults |
| `~/.config/softprobe/spcode.jsonc` | Internal coding engine AI/model/tool settings |
| `~/.local/share/softprobe/agent/sp-agent.jar` | Installed Java agent |
| `~/.local/share/softprobe/bin/spcode` | Internal coding engine binary |

Use `sp setup --backend-url ...` for the backend URL. Use `sp code web` to
start the web UI; it passes the resolved shared config to the internal engine.

Environment variables such as `SP_API_URL`, `SP_TOKEN`, and `SP_PROFILE` are
temporary overrides, not required setup steps.
