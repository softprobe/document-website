---
title: 配置
---

# 配置

Softprobe 使用一个共享的 XDG 配置命名空间。

| 路径 | 用途 |
|------|------|
| `~/.config/softprobe/config.jsonc` | 共享后端 URL 和凭证 |
| `~/.config/softprobe/sp.jsonc` | CLI 配置和 profile |
| `~/.config/softprobe/spcode.jsonc` | 内部编码引擎设置 |
| `~/.local/share/softprobe/agent/sp-agent.jar` | 已安装的 Java agent |
| `~/.local/share/softprobe/bin/spcode` | 内部编码引擎二进制 |

后端 URL 用 `sp setup`。编码引擎与模型提供商就绪用 `sp code`。

## Spcode Service（Linux systemd）

通过 [`sp setup --install-spcode-service`](./#spcode-service) 安装后，共享工作台使用**执行安装的那个账号**的同一套 Softprobe 设置（后端 URL、MCP、Agent 说明、skills）。

请用该安装账号配置 Softprobe。修改后如需服务生效，重启：

```bash
sudo systemctl restart spcode-web.service
```

## MCP 工具与 Agent 说明 {#spcode-service-mcp-agents}

`sp setup` / `sp code` **不会**自动创建编码引擎的 MCP 配置或全局 Agent 说明。请写入：

| 文件 | 用途 |
|------|------|
| `~/.config/spcode/opencode.jsonc` | MCP 与引擎设置 |
| `~/.config/spcode/AGENTS.md` | 全局 Agent 说明 |

个人 `sp code web` 与 Linux Spcode Service 都使用上述路径。修改后请重启 UI 进程（或 `spcode-web.service`）。

### 示例：飞书 / Lark MCP + `AGENTS.md`

::: warning 前置条件：Node.js
本 MCP 示例通过 **`npx`** 启动 `@larksuiteoapi/lark-mcp`，因此主机必须已安装 **Node.js**（自带 `npx`）。Softprobe 安装**不会**自动安装 Node.js。

检查：

```bash
node -v
npx -v
```

若命令不存在，请从 [nodejs.org](https://nodejs.org/) 安装 Node.js（LTS），或使用系统包管理器安装（例如 Debian/Ubuntu：`apt install nodejs npm`；RHEL/Fedora：`dnf install nodejs`）。若使用 Spcode Service，请再确认 root 下可用：`sudo npx -v`（服务进程以 root 运行）。
:::

1. 创建 `~/.config/spcode/opencode.jsonc`（将占位符替换为你的应用凭证；**不要**把真实密钥提交到仓库）：

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

主机还需能访问飞书开放平台（`https://open.feishu.cn`）。

2. 创建 `~/.config/spcode/AGENTS.md`，告知 Agent 如何使用该 MCP。示例：

```md
# Softprobe 服务端 Agent 说明

关于应用、Git 分支、录制/回放仓库信息，**不要硬编码**。

请使用 **lark-mcp** MCP 服务，从以下飞书文档获取最新内容：

https://example.feishu.cn/docx/YOUR_DOC_TOKEN

优先调用 `docx.v1.document.rawContent`（或 lark-mcp 中的等价工具）读取该文档，并以返回的表格/文本作为应用名称与分支配置的唯一真实来源。
```

请将飞书文档链接替换为你们自己的文档。`opencode.jsonc` 中配置的任意 MCP 均可使用，不限于飞书。

## Skills {#skills}

Skill 是包含 `SKILL.md` 的目录。Softprobe 会自动从以下位置加载：

| 位置 | 路径 |
|------|------|
| 本机全局 | `~/.config/spcode/skill/<name>/SKILL.md` 或 `~/.config/spcode/skills/<name>/SKILL.md` |
| 项目内 | 打开的仓库中 `.opencode/skill/<name>/SKILL.md` 或 `.opencode/skills/<name>/SKILL.md` |

每个 `SKILL.md` 至少需要 frontmatter 中的 `name` 与 `description`。示例：

```md
---
name: my-skill
description: Use when the user asks about release checklists.
---

# My skill

Steps the agent should follow…
```

若要从其他目录加载 skill，可在 `~/.config/spcode/opencode.jsonc` 中设置 `skills.paths`。

没有单独的 “create skill” 命令——自行添加目录与文件即可（也可让编码 Agent 协助）。若 Spcode Service 使用了全局 skill，修改后请重启 `spcode-web.service`。
