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

## Spcode Service (Linux systemd)

When installed via [`sp setup --install-spcode-service`](./#spcode-service), the **service** runs as root and uses **two** config namespaces:

| Context | Path | Purpose |
|---------|------|---------|
| Personal CLI / `sp code web` | `~/.config/softprobe/config.jsonc` | Your Softprobe backend URL |
| Spcode Service backend | `/root/.config/softprobe/config.jsonc` | Softprobe API URL for the shared workbench |
| Spcode Service coding engine | `/root/.config/spcode/opencode.jsonc` | MCP servers and engine settings (optional; create after install) |
| Spcode Service agent instructions | `/root/.config/spcode/AGENTS.md` | Global agent instructions (optional; create after install) |

There is no sync between personal and service config after install. Change the service backend URL by uninstalling and reinstalling Spcode Service.

## MCP tools and agent instructions {#spcode-service-mcp-agents}

`sp setup` / `sp code` do **not** create coding-engine MCP settings or global agent instructions. Add them under the coding-engine config directory for the process you run:

| How you run Softprobe UI | MCP / engine config | Agent instructions |
|--------------------------|---------------------|--------------------|
| **Linux Spcode Service** (`spcode-web.service`, runs as root) | `/root/.config/spcode/opencode.jsonc` | `/root/.config/spcode/AGENTS.md` |
| **Personal** `sp code web` / local `spcode` (not the Linux service) | `$HOME/.config/spcode/opencode.jsonc` | `$HOME/.config/spcode/AGENTS.md` |

::: tip
`/root/.config/spcode/...` is **only** for Linux Spcode Service. On your laptop or any non-service install, use your own home directory (`$HOME/.config/spcode/...` or `~/.config/spcode/...`). Personal and service configs are separate and do not sync.
:::

For Spcode Service, after editing root files, restart the unit:

```bash
sudo systemctl restart spcode-web.service
```

For personal `sp code web`, restart the UI process after editing `$HOME/.config/spcode/` files.

### Example: Feishu / Lark MCP + `AGENTS.md`

Paths below use the **Linux Spcode Service** location. For personal use, replace `/root/.config/spcode/` with `$HOME/.config/spcode/`.

1. Create `opencode.jsonc` (replace placeholders with your app credentials; never commit real secrets):

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

2. Create `AGENTS.md` in the same directory so agents know how to use that MCP. Example (Chinese customer):

```md
# Softprobe 服务端 Agent 说明

关于应用、Git 分支、录制/回放仓库信息，**不要硬编码**。

请使用 **lark-mcp** MCP 服务，从以下飞书文档获取最新内容：

https://example.feishu.cn/docx/YOUR_DOC_TOKEN

优先调用 `docx.v1.document.rawContent`（或 lark-mcp 中的等价工具）读取该文档，并以返回的表格/文本作为应用名称与分支配置的唯一真实来源。
```

Replace the Feishu doc URL with your own. You can point agents at any MCP you configure in `opencode.jsonc`, not only Feishu.

Uninstalling Spcode Service removes the systemd unit but leaves `/root/.config/softprobe/` and `/root/.config/spcode/` on disk unless you delete them manually.
