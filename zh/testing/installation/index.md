---
title: 安装 Softprobe
---

# 安装 Softprobe

使用全局安装器安装 Softprobe：

```bash
curl -fsSL https://install.softprobe.ai/install.sh | bash
```

默认安装会更新 `sp`、Java Agent，以及 `sp code` 使用的内部编码引擎。

安装后：

```bash
sp setup
sp code
sp doctor
```

## 设置

`sp setup` 配置自托管或本地部署的 Softprobe 后端 URL。在 **Linux** 上还可选安装 **Spcode Service**（通过 systemd 常驻的团队 Web UI）。

```bash
sp setup
sp setup --backend-url http://127.0.0.1:8090
sp setup --backend-url http://sp-backend.corp:8090 --install-spcode-service
sp setup --uninstall-spcode-service
```

| 参数 | 说明 |
|------|------|
| `--backend-url` | Softprobe 后端 URL（省略时交互输入） |
| `--install-spcode-service` | 安装 `spcode-web.service`（**仅 Linux**） |
| `--uninstall-spcode-service` | 卸载 Spcode Service |
| `--spcode-service-port` | 安装时监听端口（默认 `4096`） |

模型提供商配置由 `sp code` 和内部编码引擎负责。

非交互示例：

```bash
sp setup --backend-url http://127.0.0.1:8090 --json
```

URL 写入**个人** XDG 配置 `~/.config/softprobe/config.jsonc`。

## Spcode Service（仅 Linux） {#spcode-service}

**Spcode Service** 以 **root** 在 `spcode-web.service` 中运行 `spcode serve --hostname 0.0.0.0`，供内网浏览器访问。开发者本地 UI 仍见 [启动编码](./code.md)（`sp code web`）。

### 安装

```bash
# 交互：后端 URL → 是否安装 → 端口（默认 4096）
sp setup

# 非交互
sp setup --backend-url http://sp-backend.corp:8090 --install-spcode-service

# 无 TTY 自动化
sudo sp setup --backend-url http://sp-backend.corp:8090 --install-spcode-service
```

服务配置在安装时写入 `/root/.config/softprobe/config.jsonc`。之后仅修改个人 `sp setup --backend-url` **不会**更新服务配置——需卸载后重装。

### 运维

| 操作 | 命令 |
|------|------|
| 状态 | `systemctl status spcode-web.service` |
| 停止/启动 | `systemctl stop spcode-web.service` / `systemctl start spcode-web.service` |
| 日志 | `journalctl -u spcode-web -n 50 --no-pager` |
| 服务数据 | `/root/.local/share/softprobe/` |
| 服务配置 | `/root/.config/softprobe/config.jsonc` |

### 卸载

```bash
sp setup --uninstall-spcode-service
```

移除 systemd 单元；`/root/.config/softprobe/` 保留在磁盘上。

## 下一步

- [配置](./configuration.md) — 个人与服务 XDG 路径
- [启动编码](./code.md)
- [Doctor](./doctor.md)
- [升级](./upgrade.md)
