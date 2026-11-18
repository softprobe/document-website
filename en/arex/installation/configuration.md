---
title: Client configuration
---

# Client configuration

This page is the reference for client-side (`sp` CLI, Java agent, coding engine) config files and advanced options. Softprobe uses one XDG namespace shared by `sp`, `sp code`, and the Java agent.

| Path | Purpose |
|------|---------|
| `~/.config/softprobe/config.jsonc` | Shared backend URL and credentials |
| `~/.config/softprobe/sp.jsonc` | CLI profiles and overrides |
| `~/.config/softprobe/spcode.jsonc` | Internal coding engine settings |
| `~/.local/share/softprobe/agent/sp-agent.jar` | Installed Java agent |
| `~/.local/share/softprobe/bin/spcode` | Internal coding engine binary |

Use `sp setup` for the backend URL. Use `sp code` for coding-engine and model-provider readiness.

## Spcode Service (Linux systemd)

When you install Spcode Service with [`sp setup --install-spcode-service`](./#spcode-service), the shared workbench uses **the same Softprobe settings as the account that ran install** (backend URL, MCP, agent instructions, skills).

Configure Softprobe as that install account. After you change settings the service should pick up, restart it:

```bash
sudo systemctl restart spcode-web.service
```

## MCP tools and agent instructions {#spcode-service-mcp-agents}

`sp setup` / `sp code` do **not** create coding-engine MCP settings or global agent instructions. Add them under:

| File | Purpose |
|------|---------|
| `~/.config/spcode/opencode.jsonc` | MCP servers and engine settings |
| `~/.config/spcode/AGENTS.md` | Global agent instructions |

These paths apply to both personal `sp code web` and Linux Spcode Service. Restart the UI process (or `spcode-web.service`) after you edit them.

### Example: Feishu / Lark MCP + `AGENTS.md`

::: warning Prerequisite: Node.js
This MCP example launches `@larksuiteoapi/lark-mcp` with **`npx`**, so the host must have **Node.js** installed (which provides `npx`). Softprobe install does **not** install Node.js for you.

Check:

```bash
node -v
npx -v
```

If those commands are missing, install Node.js (LTS) from [nodejs.org](https://nodejs.org/), or with your OS package manager (for example `apt install nodejs npm` on Debian/Ubuntu, or `dnf install nodejs` on RHEL/Fedora). For Spcode Service, confirm `npx -v` also works when run as root (`sudo npx -v`), because the service process runs as root.
:::

1. Create `~/.config/spcode/opencode.jsonc` (replace placeholders with your app credentials; never commit real secrets):

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

The host also needs network access to Feishu/Lark (`https://open.feishu.cn`).

2. Create `~/.config/spcode/AGENTS.md` so agents know how to use that MCP. Example (Chinese customer):

```md
# Softprobe 服务端 Agent 说明

关于应用、Git 分支、录制/回放仓库信息，**不要硬编码**。

请使用 **lark-mcp** MCP 服务，从以下飞书文档获取最新内容：

https://example.feishu.cn/docx/YOUR_DOC_TOKEN

优先调用 `docx.v1.document.rawContent`（或 lark-mcp 中的等价工具）读取该文档，并以返回的表格/文本作为应用名称与分支配置的唯一真实来源。
```

Replace the Feishu doc URL with your own. You can point agents at any MCP you configure in `opencode.jsonc`, not only Feishu.

## Skills {#skills}

Skills are folders with a `SKILL.md` file. Softprobe loads them automatically from:

| Location | Path |
|----------|------|
| Global (this machine) | `~/.config/spcode/skill/<name>/SKILL.md` or `~/.config/spcode/skills/<name>/SKILL.md` |
| Project | `.opencode/skill/<name>/SKILL.md` or `.opencode/skills/<name>/SKILL.md` in the opened repo |

Each `SKILL.md` needs frontmatter with at least `name` and `description`. Example:

```md
---
name: my-skill
description: Use when the user asks about release checklists.
---

# My skill

Steps the agent should follow…
```

To load skills from another directory, set `skills.paths` in `~/.config/spcode/opencode.jsonc`.

There is no separate “create skill” command — add the folder and file yourself (or ask the coding agent to help). After changing global skills used by Spcode Service, restart `spcode-web.service`.
