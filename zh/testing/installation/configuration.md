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

## Spcode Service（Linux systemd）

通过 [`sp setup --install-spcode-service`](./#spcode-service) 安装后，**服务**以 root 运行，并使用**两套**配置命名空间：

| 场景 | 路径 | 用途 |
|------|------|------|
| 个人 CLI / `sp code web` | `~/.config/softprobe/config.jsonc` | 个人 Softprobe 后端 URL |
| Spcode Service 后端 | `/root/.config/softprobe/config.jsonc` | 共享工作台的 Softprobe API URL |
| Spcode Service 编码引擎 | `/root/.config/spcode/opencode.jsonc` | MCP 等引擎设置（可选；安装后自行创建） |
| Spcode Service Agent 说明 | `/root/.config/spcode/AGENTS.md` | 全局 Agent 说明（可选；安装后自行创建） |

安装后个人配置与服务配置不会同步。更改服务后端 URL 需卸载后重装 Spcode Service。

## MCP 工具与 Agent 说明 {#spcode-service-mcp-agents}

`sp setup` / `sp code` **不会**自动创建编码引擎的 MCP 配置或全局 Agent 说明。请按你实际运行方式，写入对应目录：

| 运行方式 | MCP / 引擎配置 | Agent 说明 |
|----------|----------------|------------|
| **Linux Spcode Service**（`spcode-web.service`，以 root 运行） | `/root/.config/spcode/opencode.jsonc` | `/root/.config/spcode/AGENTS.md` |
| **个人** `sp code web` / 本机 `spcode`（非 Linux 服务） | `$HOME/.config/spcode/opencode.jsonc` | `$HOME/.config/spcode/AGENTS.md` |

::: tip
`/root/.config/spcode/...` **仅**用于 Linux Spcode Service。在笔记本或非服务安装场景，请使用当前用户家目录（`$HOME/.config/spcode/...` 或 `~/.config/spcode/...`）。个人配置与服务配置相互独立，不会同步。
:::

若是 Spcode Service，修改 root 下文件后请重启服务：

```bash
sudo systemctl restart spcode-web.service
```

若是个人 `sp code web`，修改 `$HOME/.config/spcode/` 后请重启 UI 进程。

### 示例：飞书 / Lark MCP + `AGENTS.md`

以下路径以 **Linux Spcode Service** 为例。个人使用时，请将 `/root/.config/spcode/` 替换为 `$HOME/.config/spcode/`。

::: warning 前置条件：Node.js
本 MCP 示例通过 **`npx`** 启动 `@larksuiteoapi/lark-mcp`，因此主机必须已安装 **Node.js**（自带 `npx`）。Softprobe 安装**不会**自动安装 Node.js。

检查：

```bash
node -v
npx -v
```

若命令不存在，请从 [nodejs.org](https://nodejs.org/) 安装 Node.js（LTS），或使用系统包管理器安装（例如 Debian/Ubuntu：`apt install nodejs npm`；RHEL/Fedora：`dnf install nodejs`）。安装后确认运行 Spcode Service 的同一用户（Linux 服务为 `root`）下 `npx -v` 可用。
:::

1. 创建 `opencode.jsonc`（将占位符替换为你的应用凭证；**不要**把真实密钥提交到仓库）：

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

2. 在同一目录创建 `AGENTS.md`，告知 Agent 如何使用该 MCP。示例：

```md
# Softprobe 服务端 Agent 说明

关于应用、Git 分支、录制/回放仓库信息，**不要硬编码**。

请使用 **lark-mcp** MCP 服务，从以下飞书文档获取最新内容：

https://example.feishu.cn/docx/YOUR_DOC_TOKEN

优先调用 `docx.v1.document.rawContent`（或 lark-mcp 中的等价工具）读取该文档，并以返回的表格/文本作为应用名称与分支配置的唯一真实来源。
```

请将飞书文档链接替换为你们自己的文档。`opencode.jsonc` 中配置的任意 MCP 均可使用，不限于飞书。

卸载 Spcode Service 会移除 systemd 单元，但 `/root/.config/softprobe/` 与 `/root/.config/spcode/` 会保留在磁盘上，除非手动删除。
