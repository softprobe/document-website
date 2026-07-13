---
title: Install Softprobe Client
---

# Install Softprobe Client

::: tip Prerequisite
Deploy the Softprobe backend on your cluster first: [Install Softprobe Server](./server).
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

`sp setup` configures the self-hosted or on-prem Softprobe API URL.

```bash
sp setup
```

If you omit `--api-url`, the wizard **prompts** for your API URL. On Linux it may also ask whether to install Spcode Service ([below](#spcode-service)).

| Flag | Description |
|------|-------------|
| `--api-url` | API URL (use this to skip the prompt) |

Model provider configuration belongs to `sp code`, not `sp setup`.

For non-interactive or scripted setup:

```bash
sp setup --api-url http://127.0.0.1:8090 --json
```

The URL is stored in Softprobe config at `~/.config/softprobe/config.jsonc`.

## Spcode Service (Linux only) {#spcode-service}

On **Linux**, `sp setup` can optionally install **Spcode Service** — a shared web workbench your team opens in the browser on the corp network. For a private UI on your own machine, see [Launch Softprobe Web UI Manually](./code) instead.

```bash
sp setup --api-url http://sp-backend.corp:8090 --install-spcode-service
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
# Interactive: API URL → opt-in → port (default 4096)
sp setup

# Non-interactive
sp setup --api-url http://sp-backend.corp:8090 --install-spcode-service

# Automation without TTY
sudo sp setup --api-url http://sp-backend.corp:8090 --install-spcode-service
```

Install Softprobe and run `sp setup` as the account that should own the machine’s Softprobe settings. Spcode Service uses those same settings (backend URL, MCP, agent instructions, skills). After you change them, restart the service.

### Operations

| Task | Command |
|------|---------|
| Status | `systemctl status spcode-web.service` |
| Stop / start | `systemctl stop spcode-web.service` / `systemctl start spcode-web.service` |
| Logs | `journalctl -u spcode-web -n 50 --no-pager` |

If start fails, inspect `journalctl -u spcode-web` before retrying.

Optional MCP tools, agent instructions, and skills: [Client configuration](./configuration).

### Uninstall

```bash
sp setup --uninstall-spcode-service
```

Removes the systemd unit. Softprobe config files under your install account remain unless you delete them.

## Next

The CLI is ready — now bring your Java application in:

1. [Supported frameworks](/en/testing/supported-frameworks) — confirm your stack can be instrumented
2. [Attach the Java agent](/en/testing/java-agent) — attach the agent and register your app
3. [Launch the Web UI](./code) — view recordings and replays in the browser

Tools and advanced: [Doctor](./doctor) (troubleshooting) · [Upgrade](./upgrade) · [Client configuration](./configuration) (MCP, `AGENTS.md`, skills)
