# sp setup

**代理使用场景：** 在 `sp code`、录制回放或 agent 工作流之前配置自托管 Softprobe 后端 URL；在 **Linux** 上可选安装 **Spcode Service**（团队 Web UI 常驻服务）。

## 概要

```bash
sp setup
sp setup --backend-url https://sp-backend.example:8090
sp setup --backend-url https://sp-backend.example:8090 --install-spcode-service
sp setup --install-spcode-service --spcode-service-port 5000
sp setup --uninstall-spcode-service
sp setup doctor
```

| 参数 | 说明 |
|------|------|
| `--backend-url` | Softprobe 后端 URL（省略时交互输入） |
| `--install-spcode-service` | 安装 `spcode-web.service`（**仅 Linux**） |
| `--uninstall-spcode-service` | 卸载 Spcode Service |
| `--spcode-service-port` | 安装时监听端口（默认 `4096`） |

不可同时使用 `--install-spcode-service` 与 `--uninstall-spcode-service`。

## 后端 URL

`sp setup` 将后端 URL 写入**个人** XDG 配置 `~/.config/softprobe/config.jsonc`。不会配置模型提供商、租户密钥或 Agent。

直接运行 `sp setup` 会启动交互式向导；也可通过 `--backend-url` 非交互设置 URL。

```bash
sp setup --backend-url https://sp-backend.example:8090 --json
```

模型提供商配置由 `sp code` 或内部编码引擎负责。

## Spcode Service（仅 Linux）

**Spcode Service** 是可选的 systemd 单元（`spcode-web.service`），以 **root** 运行 `spcode serve --hostname 0.0.0.0`，供团队在内网浏览器访问。开发者本地 UI 仍使用 [`sp code web`](/zh/cli/guide/spcode.md)。

### 安装

```bash
# 交互：后端 URL → 是否安装 → 端口（默认 4096）
sp setup

# 非交互
sp setup --backend-url https://sp-backend.example:8090 --install-spcode-service
sp setup --install-spcode-service   # 个人配置中已有有效后端 URL 时

# 无 TTY 自动化（整条命令 sudo）
sudo sp setup --backend-url https://sp-backend.example:8090 --install-spcode-service
```

个人配置在调用用户的 `~/.config/softprobe/`；服务配置在安装时写入 `/root/.config/softprobe/config.jsonc`。之后仅修改个人 `sp setup --backend-url` **不会**更新服务配置——需卸载后重装，或手动编辑 root 配置。

### 运维

| 操作 | 命令 |
|------|------|
| 状态 | `systemctl status spcode-web.service` |
| 停止/启动 | `systemctl stop spcode-web.service` / `systemctl start spcode-web.service` |
| 日志 | `journalctl -u spcode-web -n 50 --no-pager` |
| 服务数据 | `/root/.local/share/softprobe/` |
| 服务配置 | `/root/.config/softprobe/config.jsonc` |

启动失败时先查看 `journalctl -u spcode-web`。

### 卸载

```bash
sp setup --uninstall-spcode-service
sudo sp setup --uninstall-spcode-service   # 非交互
```

移除 systemd 单元与注册信息；`/root/.config/softprobe/` 保留在磁盘上。

### JSON 字段

| 字段 | 取值 |
|------|------|
| `spcodeServiceStatus` | `skipped`、`installed`、`not_installed`、`removed`、`failed` |
| `spcodeServicePort` | 安装成功时存在 |

## `setup doctor`

```bash
sp setup doctor --json
```

旧版 setup doctor（配置 + agent jar）。

顶层 [`sp doctor`](/zh/testing/installation/doctor) 还会检查后端可达性、`spcode` 二进制；当已注册 `spcode-web.service` 时，还会检查 **`spcode-service`**（读取 `/root/.config/softprobe/`）。

## 相关

- [Doctor](/zh/testing/installation/doctor) — `sp doctor` 后端、内部引擎与 Spcode Service 检查
- [安装指南](/zh/cli/guide/installation.md)
- [配置](/zh/cli/guide/configuration.md)
- [spcode](/zh/cli/guide/spcode.md)
- [agent](./agent.md) — 下载与 JVM 参数
- [Quickstart](/zh/cli/guide/quickstart.md)
- [health](./health.md)
