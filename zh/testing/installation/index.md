---
title: 安装 Softprobe（客户端）
---

# 安装 Softprobe（客户端）

::: tip 前置条件
请先在集群中部署 Softprobe 后端：[安装 Softprobe 服务端](./server.md)。
:::

使用全局安装器安装 Softprobe：

```bash
curl -fsSL https://install.softprobe.ai/install.sh | bash
```

默认安装包含 `sp` CLI、Java Agent 以及测试用的 Web UI。

安装后先确认 `sp` 可用：

```bash
sp -v
```

若能输出版本号，即可继续下面的步骤。

## 设置

`sp setup` 配置自托管或本地部署的 Softprobe 后端 URL。

```bash
sp setup
```

若未提供 `--api-url`，向导会**交互式**询问后端 URL。在 Linux 上还可能询问是否安装 Spcode Service（见[下文](#spcode-service)）。

| 参数 | 说明 |
|------|------|
| `--api-url` | 后端 URL（提供后可跳过交互提示） |

模型提供商配置由 `sp code` 负责，不在 `sp setup` 中配置。

非交互或脚本场景可显式传入 URL：

```bash
sp setup --api-url http://127.0.0.1:8090 --json
```

URL 写入 Softprobe 配置 `~/.config/softprobe/config.jsonc`。

## Spcode Service（仅 Linux） {#spcode-service}

在 **Linux** 上，`sp setup` 还可选安装 **Spcode Service** —— 供团队在内网浏览器共用的 Web 工作台。若只需在本机使用 UI，见 [手动启动 Softprobe Web UI](./code.md)。

```bash
sp setup --api-url http://sp-backend.corp:8090 --install-spcode-service
sp setup --install-spcode-service --spcode-service-port 5000
sp setup --uninstall-spcode-service
```

| 参数 | 说明 |
|------|------|
| `--install-spcode-service` | 安装共享 Web 工作台（**仅 Linux**） |
| `--uninstall-spcode-service` | 卸载 Spcode Service |
| `--spcode-service-port` | 安装时监听端口（默认 `4096`） |

不可同时使用 `--install-spcode-service` 与 `--uninstall-spcode-service`。

### 安装

```bash
# 交互：后端 URL → 是否安装 → 端口（默认 4096）
sp setup

# 非交互
sp setup --api-url http://sp-backend.corp:8090 --install-spcode-service

# 无 TTY 自动化
sudo sp setup --api-url http://sp-backend.corp:8090 --install-spcode-service
```

请用将拥有本机 Softprobe 设置的账号安装 Softprobe 并运行 `sp setup`。Spcode Service 使用同一套设置（后端 URL、MCP、Agent 说明、skills）。修改后请重启服务。

### 运维

| 操作 | 命令 |
|------|------|
| 状态 | `systemctl status spcode-web.service` |
| 停止/启动 | `systemctl stop spcode-web.service` / `systemctl start spcode-web.service` |
| 日志 | `journalctl -u spcode-web -n 50 --no-pager` |

若启动失败，先查看 `journalctl -u spcode-web` 再重试。

可选 MCP、Agent 说明与 skills：见 [配置](./configuration.md)。

### 卸载

```bash
sp setup --uninstall-spcode-service
```

移除 systemd 单元；安装账号下的 Softprobe 配置文件会保留，除非手动删除。

## 下一步

- [配置](./configuration.md) — 后端 URL、MCP、`AGENTS.md`、skills
- [手动启动 Softprobe Web UI](./code.md)
- [Doctor](./doctor.md)
- [升级](./upgrade.md)
