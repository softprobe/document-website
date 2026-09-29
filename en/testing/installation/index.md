---
title: Install the sp command line
---

# Install the sp command line

`sp` is the SoftProbe command line. You need it to script SoftProbe, run it from CI, let AI agents drive it, or run the web workbench on your own machine. People who only use the web console that has already been set up for them don't need it.

You need a reachable SoftProbe backend first — see [Install sp-backend](/en/testing/installation/server) if you don't have one.

## Install {#install}

With internet access:

```bash
curl -fsSL https://install.softprobe.ai/install.sh | bash
```

This installs the `sp` command line, the Java agent, and the web workbench. On a machine without internet access, get the install package from your SoftProbe implementation team.

Check that `sp` is available:

```bash
sp version
```

`sp -v` and `sp --version` do the same.

## Point it at your backend {#setup}

```bash
sp setup
```

Without `--api-url`, `sp setup` asks for the backend URL. On Linux it may also ask whether to install the shared web workbench ([below](#spcode-service)). The URL is saved to `~/.config/softprobe/config.jsonc`.

For scripts:

```bash
sp setup --api-url http://127.0.0.1:8090 --json
```

| Flag | Description |
|------|-------------|
| `--api-url` | Backend URL (skips the prompt) |

Model providers are configured in `sp code`, not in `sp setup`.

## Open the web workbench on your machine {#web-ui}

To run a private web workbench on your own laptop or workstation:

```bash
sp code web --port 4096
```

Then open `http://127.0.0.1:4096`. It uses your settings and backend URL from `sp setup`. To use the terminal instead of the browser:

```bash
sp code
```

| | On your machine | Shared web workbench |
|--|--|--|
| **Who** | You | Your team, at one URL |
| **How** | `sp code web` | `sp setup --install-spcode-service` ([below](#spcode-service)) |
| **Settings** | Yours, from `sp setup` | Those of the account that installed the service |

## Install a shared web workbench (Linux only) {#spcode-service}

On Linux, `sp setup` can install **Spcode Service**, a web workbench your team opens in the browser from one address on the internal network.

```bash
# Interactive: backend URL → opt in → port (default 4096)
sp setup

# Non-interactive
sp setup --api-url http://sp-backend.corp:8090 --install-spcode-service
sp setup --install-spcode-service --spcode-service-port 5000

# Without a TTY
sudo sp setup --api-url http://sp-backend.corp:8090 --install-spcode-service
```

| Flag | Description |
|------|-------------|
| `--install-spcode-service` | Install the shared web workbench (**Linux only**) |
| `--uninstall-spcode-service` | Stop and remove it |
| `--spcode-service-port` | Listen port when installing (default `4096`) |

`--install-spcode-service` and `--uninstall-spcode-service` can't be combined.

Run the install and `sp setup` as the account that should own the machine's SoftProbe settings; the service uses the same settings (backend URL, MCP, agent instructions, skills). Restart the service after changing them.

| Task | Command |
|------|---------|
| Status | `systemctl status spcode-web.service` |
| Stop / start | `systemctl stop spcode-web.service` / `systemctl start spcode-web.service` |
| Logs | `journalctl -u spcode-web -n 50 --no-pager` |

To uninstall:

```bash
sp setup --uninstall-spcode-service
```

This removes the systemd unit. SoftProbe config files under the install account stay unless you delete them.

MCP tools, agent instructions and skills: [Client configuration](/en/testing/installation/configuration).

## Check the installation {#doctor}

```bash
sp doctor
sp doctor --json
```

`sp doctor` checks that the backend is reachable and the workbench engine is installed, and suggests a fix for each failure. If the shared web workbench is installed, it also checks that the service is running and can reach the backend.

If any check fails, the command exits `1`, but the results are still written to stdout with `"ok": true`. To see which check failed, look at `data.status` and each check's `status`:

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

## Upgrade {#upgrade}

```bash
sp upgrade
```

This reruns the installer to update the command line, the Java agent and the workbench engine together; if it fails, the command exits `1`. It does not upgrade the backend or restart applications that already run with the agent.

If the shared web workbench is installed, restart it afterwards:

```bash
sudo systemctl restart spcode-web.service
journalctl -u spcode-web -n 20 --no-pager
```

## Next

- [Command reference](/en/testing/commands/)
- [Client configuration](/en/testing/installation/configuration) — MCP, `AGENTS.md`, skills
- [Attach the Java agent](/en/testing/java-agent)
