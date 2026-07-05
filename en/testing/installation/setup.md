---
title: Setup
---

# Setup

`sp setup` configures the self-hosted or on-prem Softprobe backend URL. On **Linux**, it can optionally install **Spcode Service** — a long-running team web UI via systemd.

```bash
sp setup
sp setup --backend-url http://127.0.0.1:8090
sp setup --backend-url http://sp-backend.corp:8090 --install-spcode-service
sp setup --uninstall-spcode-service
```

| Flag | Description |
|------|-------------|
| `--backend-url` | Softprobe backend URL (prompts when omitted) |
| `--install-spcode-service` | Install `spcode-web.service` (**Linux only**) |
| `--uninstall-spcode-service` | Stop and remove Spcode Service |
| `--spcode-service-port` | Listen port when installing (default `4096`) |

The setup wizard only owns the backend URL and optional Spcode Service in this release. Model provider configuration belongs to `sp code` and the internal coding engine.

For non-interactive setup:

```bash
sp setup --backend-url http://127.0.0.1:8090 --json
```

The URL is stored in your **personal** Softprobe XDG config at `~/.config/softprobe/config.jsonc`.

## Spcode Service (Linux only)

**Spcode Service** runs `spcode serve --hostname 0.0.0.0` as **root** in `spcode-web.service` for corp-network browser access. Manual developer UI launch remains [Launch coding](./code.md) (`sp code web`).

### Install

```bash
# Interactive: backend URL → opt-in → port (default 4096)
sp setup

# Non-interactive
sp setup --backend-url http://sp-backend.corp:8090 --install-spcode-service

# Automation without TTY
sudo sp setup --backend-url http://sp-backend.corp:8090 --install-spcode-service
```

Service config is written once at install to `/root/.config/softprobe/config.jsonc`. Changing your personal `sp setup --backend-url` later does **not** update the service — uninstall and reinstall to change the service backend URL.

### Operations

| Task | Command |
|------|---------|
| Status | `systemctl status spcode-web.service` |
| Stop / start | `systemctl stop spcode-web.service` / `systemctl start spcode-web.service` |
| Logs | `journalctl -u spcode-web -n 50 --no-pager` |
| Service data | `/root/.local/share/softprobe/` |
| Service config | `/root/.config/softprobe/config.jsonc` |

If start fails, inspect `journalctl -u spcode-web` before retrying.

### Uninstall

```bash
sp setup --uninstall-spcode-service
```

Removes the systemd unit. Leaves `/root/.config/softprobe/` on disk.

## Related

- [Configuration](./configuration.md) — personal vs service XDG paths
- [Launch coding](./code.md) — manual `sp code web` vs Spcode Service
- [Doctor](./doctor.md) — `sp doctor` and `spcode-service` check
