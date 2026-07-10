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

### 可选：MCP 工具与 Agent 说明 {#spcode-service-mcp-agents}

`sp setup --install-spcode-service` **只**写入 Softprobe 后端 URL，**不会**创建编码引擎的 MCP 配置或全局 Agent 说明。请在服务使用的编码引擎配置目录下自行添加（服务以 root 运行）：

| 文件 | 用途 |
|------|------|
| `/root/.config/spcode/opencode.jsonc` | Spcode Service 的 MCP 及其他编码引擎设置 |
| `/root/.config/spcode/AGENTS.md` | 共享工作台加载的全局 Agent 说明 |

个人目录 `~/.config/spcode/` **不会**被 Spcode Service 使用。修改 root 下文件后请重启服务：

```bash
sudo systemctl restart spcode-web.service
```

#### 示例：飞书 / Lark MCP + `AGENTS.md`

1. 创建 `/root/.config/spcode/opencode.jsonc`（将占位符替换为你的应用凭证；**不要**把真实密钥提交到仓库）：

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

本示例需要主机可访问飞书开放平台，并已安装可用的 `npx`（Node.js）。

2. 创建 `/root/.config/spcode/AGENTS.md`，告知 Agent 如何使用该 MCP。示例：

```md
# Softprobe 服务端 Agent 说明

关于应用、Git 分支、录制/回放仓库信息，**不要硬编码**。

请使用 **lark-mcp** MCP 服务，从以下飞书文档获取最新内容：

https://example.feishu.cn/docx/YOUR_DOC_TOKEN

优先调用 `docx.v1.document.rawContent`（或 lark-mcp 中的等价工具）读取该文档，并以返回的表格/文本作为应用名称与分支配置的唯一真实来源。
```

请将飞书文档链接替换为你们自己的文档。`opencode.jsonc` 中配置的任意 MCP 均可使用，不限于飞书。

卸载 Spcode Service 会移除 systemd 单元，但 `/root/.config/softprobe/` 与 `/root/.config/spcode/` 会保留在磁盘上，除非手动删除。
