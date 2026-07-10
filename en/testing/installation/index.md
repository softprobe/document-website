---
title: Install Softprobe Client
---

# Install Softprobe Client

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

The URL is stored in your **personal** Softprobe XDG config at `~/.config/softprobe/config.jsonc`.

## Spcode Service (Linux only) {#spcode-service}

On **Linux**, `sp setup` can optionally install **Spcode Service** — a shared web workbench your team opens in the browser on the corp network. For a private UI on your own machine, see [Launch Softprobe Web UI Manually](./code.md) instead.

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

Service config is written once at install to `/root/.config/softprobe/config.jsonc`. Changing your personal `sp setup --api-url` later does **not** update the service — uninstall and reinstall to change the service API URL.

### Operations

| Task | Command |
|------|---------|
| Status | `systemctl status spcode-web.service` |
| Stop / start | `systemctl stop spcode-web.service` / `systemctl start spcode-web.service` |
| Logs | `journalctl -u spcode-web -n 50 --no-pager` |
| Service data | `/root/.local/share/softprobe/` |
| Service config | `/root/.config/softprobe/config.jsonc` |

If start fails, inspect `journalctl -u spcode-web` before retrying.

### Optional: MCP tools and agent instructions {#spcode-service-mcp-agents}

`sp setup --install-spcode-service` configures the Softprobe backend URL only. It does **not** create coding-engine MCP settings or global agent instructions. Add those yourself under the **service** coding-engine config directory (the service runs as root):

| File | Purpose |
|------|---------|
| `/root/.config/spcode/opencode.jsonc` | MCP servers and other coding-engine settings for Spcode Service |
| `/root/.config/spcode/AGENTS.md` | Global agent instructions loaded by the shared workbench |

Personal `~/.config/spcode/` files are **not** used by Spcode Service. After editing root files, restart the unit:

```bash
sudo systemctl restart spcode-web.service
```

#### Example: Feishu / Lark MCP + `AGENTS.md`

1. Create `/root/.config/spcode/opencode.jsonc` (replace placeholders with your app credentials; never commit real secrets):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "lark-mcp": {
      "type": "local",
      "enabled": true,
      "command": [
        "npx",
        "-y",
        "@larksuiteoapi/lark-mcp",
        "mcp",
        "-a",
        "YOUR_FEISHU_APP_ID",
        "-s",
        "YOUR_FEISHU_APP_SECRET",
        "--token-mode",
        "tenant_access_token",
        "--domain",
        "https://open.feishu.cn",
        "-t",
        "docx.v1.document.get,docx.v1.document.rawContent"
      ]
    }
  }
}
```

The host needs network access to Feishu/Lark and a working `npx` (Node.js) for this example.

2. Create `/root/.config/spcode/AGENTS.md` so agents know how to use that MCP. Example (Chinese customer):

```md
# Softprobe 服务端 Agent 说明

关于应用、Git 分支、录制/回放仓库信息，**不要硬编码**。

请使用 **lark-mcp** MCP 服务，从以下飞书文档获取最新内容：

https://example.feishu.cn/docx/YOUR_DOC_TOKEN

优先调用 `docx.v1.document.rawContent`（或 lark-mcp 中的等价工具）读取该文档，并以返回的表格/文本作为应用名称与分支配置的唯一真实来源。
```

Replace the Feishu doc URL with your own. You can point agents at any MCP you configure in `opencode.jsonc`, not only Feishu.

### Uninstall

```bash
sp setup --uninstall-spcode-service
```

Removes the systemd unit. Leaves `/root/.config/softprobe/` and `/root/.config/spcode/` on disk unless you delete them manually.

## Next

- [Configuration](./configuration.md) — personal vs service XDG paths
- [Launch Softprobe Web UI Manually](./code.md)
- [Doctor](./doctor.md)
- [Upgrade](./upgrade.md)
