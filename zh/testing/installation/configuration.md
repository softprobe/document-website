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

通过 [`sp setup --install-spcode-service`](./setup.md#spcode-service-linux-only) 安装后，**服务**从 root 的 XDG 读取后端 URL，而非调用管理员的家目录：

| 场景 | 配置路径 |
|------|----------|
| 个人 CLI / `sp code web` | `~/.config/softprobe/config.jsonc` |
| Spcode Service（`spcode-web.service`，以 root 运行） | `/root/.config/softprobe/config.jsonc` |

安装后个人配置与服务配置不会同步。更改服务后端 URL 需卸载后重装 Spcode Service。
