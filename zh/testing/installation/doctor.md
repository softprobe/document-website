---
title: Doctor
---

# Doctor

使用 `sp doctor` 检查自托管 Softprobe 安装状态：

```bash
sp doctor
sp doctor --json
```

检查项包括后端可达性和内部编码引擎安装状态。

若已通过 [`sp setup --install-spcode-service`](/zh/testing/installation/setup) 安装 **Spcode Service**（`spcode-web.service` 已注册），`sp doctor` 还会执行 **`spcode-service`** 检查（读取 `/root/.config/softprobe/config.jsonc` 与服务单元）。
