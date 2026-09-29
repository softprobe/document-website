---
title: 安装 sp 命令行
---

# 安装 sp 命令行

`sp` 是 SoftProbe 的命令行工具。用脚本操作 SoftProbe、在 CI 中调用、让 AI 代理驱动，或在自己电脑上运行网页工作台时才需要安装。只用已部署好的网页控制台的人不需要安装。

安装前需要一个可以访问的 SoftProbe 后端；还没有的话，先看 [部署后端](/zh/testing/installation/server)。

## 安装 {#install}

能访问互联网时：

```bash
curl -fsSL https://install.softprobe.ai/install.sh | bash
```

会安装 `sp` 命令行、Java Agent 和网页工作台。无法访问互联网的机器，请向 SoftProbe 实施人员索取安装包。

检查是否安装成功：

```bash
sp version
```

`sp -v`、`sp --version` 效果相同。

## 配置后端地址 {#setup}

```bash
sp setup
```

不带 `--api-url` 时，`sp setup` 会询问后端地址；在 Linux 上还可能询问是否安装共享网页工作台（见 [下文](#spcode-service)）。地址保存在 `~/.config/softprobe/config.jsonc`。

在脚本中使用：

```bash
sp setup --api-url http://127.0.0.1:8090 --json
```

| 参数 | 说明 |
|------|------|
| `--api-url` | 后端地址，传入后不再询问 |

模型服务商在 `sp code` 中配置，不在 `sp setup` 中。

## 在自己电脑上打开网页工作台 {#web-ui}

在自己的笔记本或工作站上单独运行一个网页工作台：

```bash
sp code web --port 4096
```

然后打开 `http://127.0.0.1:4096`。它使用 `sp setup` 保存的设置（含后端地址）。不打开浏览器、直接在终端中使用：

```bash
sp code
```

| | 在自己电脑上 | 共享网页工作台 |
|--|--|--|
| **谁用** | 自己 | 团队，用同一个地址访问 |
| **怎么启动** | `sp code web` | `sp setup --install-spcode-service`（见 [下文](#spcode-service)） |
| **使用谁的设置** | 自己在 `sp setup` 中的设置 | 安装服务的那个账号的设置 |

## 安装共享网页工作台（仅 Linux） {#spcode-service}

在 Linux 上，`sp setup` 可以安装 **Spcode Service**：一个团队在内网通过同一个地址用浏览器访问的网页工作台。

```bash
# 交互式：后端地址 → 是否安装 → 端口（默认 4096）
sp setup

# 非交互式
sp setup --api-url http://sp-backend.corp:8090 --install-spcode-service
sp setup --install-spcode-service --spcode-service-port 5000

# 没有终端（TTY）时
sudo sp setup --api-url http://sp-backend.corp:8090 --install-spcode-service
```

| 参数 | 说明 |
|------|------|
| `--install-spcode-service` | 安装共享网页工作台（**仅 Linux**） |
| `--uninstall-spcode-service` | 停止并移除 |
| `--spcode-service-port` | 安装时的监听端口，默认 `4096` |

`--install-spcode-service` 和 `--uninstall-spcode-service` 不能同时使用。

请用负责这台机器 SoftProbe 设置的账号运行 `sp setup` 完成安装。服务使用同一套设置（后端地址、MCP、代理说明、技能），修改设置后需要重启服务。

| 操作 | 命令 |
|------|------|
| 查看状态 | `systemctl status spcode-web.service` |
| 停止 / 启动 | `systemctl stop spcode-web.service` / `systemctl start spcode-web.service` |
| 查看日志 | `journalctl -u spcode-web -n 50 --no-pager` |

卸载：

```bash
sp setup --uninstall-spcode-service
```

卸载只移除 systemd 服务，安装账号下的 SoftProbe 配置文件会保留，需要时手动删除。

MCP 工具、代理说明和技能的配置见 [客户端配置](/zh/testing/installation/configuration)。

## 检查安装 {#doctor}

```bash
sp doctor
sp doctor --json
```

`sp doctor` 检查后端能否访问、工作台引擎是否已安装，每项失败都会给出处理建议。安装了共享网页工作台时，还会检查服务是否在运行、能否访问后端。

有检查项失败时，命令以 `1` 退出，但检查结果照样写到标准输出，`"ok"` 仍为 `true`。要知道哪一项失败，请看 `data.status` 和每项检查的 `status`：

```json
{
  "ok": true,
  "command": "doctor",
  "data": {
    "status": "failed",
    "url": "http://127.0.0.1:8090",
    "checks": [
      {
        "name": "backend",
        "status": "failed",
        "detail": "backend is unreachable",
        "remediation": "Check the API URL and that sp-backend is running"
      },
      {
        "name": "spcode",
        "status": "healthy",
        "detail": "/home/user/.local/share/softprobe/bin/spcode"
      }
    ]
  }
}
```

## 升级 {#upgrade}

```bash
sp upgrade
```

它会重新运行安装脚本，同时升级命令行、Java Agent 和工作台引擎；升级失败时以 `1` 退出。它不会升级后端，也不会重启已经挂着 Agent 运行的应用。

安装了共享网页工作台时，升级后需要重启：

```bash
sudo systemctl restart spcode-web.service
journalctl -u spcode-web -n 20 --no-pager
```

## 相关文档

- [命令参考](/zh/testing/commands/)
- [客户端配置](/zh/testing/installation/configuration)：MCP、`AGENTS.md`、技能
- [接入 Java Agent](/zh/testing/java-agent)
