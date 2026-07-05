---
title: Install Softprobe (client)
---

# Install Softprobe (client)

::: tip Prerequisite
Deploy the Softprobe backend on your cluster first: [Install Softprobe Server](./server.md).
:::

Install Softprobe with the global installer:

```bash
curl -fsSL https://install.softprobe.ai/install.sh | bash
```

The default install adds the Softprobe CLI (`sp`), the Java agent, and the web UI used for testing.

After install, confirm `sp` is available:

```bash
sp -v
```

If that prints a version, you are ready for the steps below.

## Setup

`sp setup` configures the self-hosted or on-prem Softprobe backend URL.

```bash
sp setup
```

If you omit `--backend-url`, the wizard **prompts** for your backend URL. On Linux it may also ask whether to install Spcode Service ([below](#spcode-service)).

| Flag | Description |
|------|-------------|
| `--backend-url` | Backend URL (use this to skip the prompt) |

Model provider configuration belongs to `sp code`, not `sp setup`.

For non-interactive or scripted setup:

```bash
sp setup --backend-url http://127.0.0.1:8090 --json
```

The URL is stored in your **personal** Softprobe XDG config at `~/.config/softprobe/config.jsonc`.

## Spcode Service (Linux only) {#spcode-service}

On **Linux**, `sp setup` can optionally install **Spcode Service** — a shared web workbench your team opens in the browser on the corp network. For a private UI on your own machine, see [Launch Softprobe Web UI Manually](./code.md) instead.

```bash
sp setup --backend-url http://sp-backend.corp:8090 --install-spcode-service
sp setup --install-spcode-service --spcode-service-port 5000
sp setup --uninstall-spcode-service
```

| Flag | Description |
|------|-------------|
| `--install-spcode-service` | Install the shared web workbench (**Linux only**) |
| `--uninstall-spcode-service` | Stop and remove Spcode Service |
| `--spcode-service-port` | Listen port when installing (default `4096`) |

`--install-spcode-service` and `--uninstall-spcode-service` cannot be combined.

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

## Next

- [Configuration](./configuration.md) — personal vs service XDG paths
- [Launch Softprobe Web UI Manually](./code.md)
- [Doctor](./doctor.md)
- [Upgrade](./upgrade.md)
