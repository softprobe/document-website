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
