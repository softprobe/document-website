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

在 Linux 上，`sp setup` 还可选安装 **Spcode Service**（systemd 团队 Web UI）。见 [设置](./setup.md#spcode-service-linux-only)。

## 下一步

- [设置](./setup)
- [启动编码](./code)
- [Doctor](./doctor)
- [升级](./upgrade)
