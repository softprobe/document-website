---
title: sp setup
---

# sp setup

命令参考。安装、Spcode Service 与运维说明见 [安装 Softprobe](/zh/testing/installation/#spcode-service)。

```bash
sp setup
sp setup --backend-url http://127.0.0.1:8090
sp setup --install-spcode-service
sp setup --uninstall-spcode-service
```

| 参数 | 说明 |
|------|------|
| `--backend-url` | 后端 URL |
| `--install-spcode-service` | 安装 Spcode Service（仅 Linux） |
| `--uninstall-spcode-service` | 卸载 Spcode Service |
| `--spcode-service-port` | 监听端口（默认 4096） |

使用 `--json` 时可能包含 `spcodeServiceStatus`、`spcodeServicePort`。
