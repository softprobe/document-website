---
title: 
---

# 启动编码

使用 `sp code` 启动 Softprobe 编码体验：

```bash
sp code
sp code web --port 4096
```

`sp code` 会把参数原样传递给内部编码引擎。

## 手动 Web UI 与 Spcode Service

| 模式 | 命令 | 配置 | 场景 |
|------|------|------|------|
| 手动（开发者） | `sp code web` | 你的 `~/.config/softprobe/` | 本地开发 |
| Spcode Service（Linux） | systemd 运行 `spcode serve --hostname 0.0.0.0` | `/root/.config/softprobe/` | 团队内网浏览器访问 |

使用 [`sp setup --install-spcode-service`](./#spcode-service) 安装。服务单元名为 `spcode-web.service`。
