---
title: 升级
---

# 升级

使用 `sp upgrade` 升级 Softprobe：

```bash
sp upgrade
```

升级复用全局安装器，并以一个 Softprobe 安装更新 CLI、Java Agent 和内部编码引擎。

若已安装 **Spcode Service**（`spcode-web.service`），升级 `sp` 或 `spcode` 后请重启服务：

```bash
sudo systemctl restart spcode-web.service
journalctl -u spcode-web -n 20 --no-pager
```
