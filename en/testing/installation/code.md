---
title: Launch Coding
---

# Launch Coding

Use `sp code` to start the Softprobe coding experience:

```bash
sp code
```

Arguments after `sp code` pass through to the internal engine unchanged:

```bash
sp code web --port 4096
```

If the internal engine is missing, not executable, or incompatible, `sp code` fails before launch and tells you to repair or upgrade the Softprobe install.

## Manual web UI vs Spcode Service

| Mode | Command | Config | Use case |
|------|---------|--------|----------|
| Manual (developer) | `sp code web` | Your `~/.config/softprobe/` | Local dev, your account |
| Spcode Service (Linux) | `spcode serve --hostname 0.0.0.0` via systemd | `/root/.config/softprobe/` | Team corp-network browser access |

Install Spcode Service with [`sp setup --install-spcode-service`](./#spcode-service). The service unit name is `spcode-web.service`.
