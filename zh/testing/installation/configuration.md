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

### Spcode Service（Linux systemd）

通过 [`sp setup --install-spcode-service`](./#spcode-service) 安装后，**服务**以 root 运行，并使用**两套**配置命名空间：

| 场景 | 路径 | 用途 |
|------|------|------|
| 个人 CLI / `sp code web` | `~/.config/softprobe/config.jsonc` | 个人 Softprobe 后端 URL |
| Spcode Service 后端 | `/root/.config/softprobe/config.jsonc` | 共享工作台的 Softprobe API URL |
| Spcode Service 编码引擎 | `/root/.config/spcode/opencode.jsonc` | MCP 等引擎设置（可选；安装后自行创建） |
| Spcode Service Agent 说明 | `/root/.config/spcode/AGENTS.md` | 全局 Agent 说明（可选；安装后自行创建） |

安装后个人配置与服务配置不会同步。更改服务后端 URL 需卸载后重装 Spcode Service。

如何为共享工作台添加 MCP 与 `AGENTS.md`：见 [Spcode Service — MCP 与 Agent 说明](./#spcode-service-mcp-agents)。
