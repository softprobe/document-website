# sp setup

**When agents use this:** 在 `sp code`、录制回放或 agent 工作流之前配置自托管 Softprobe 后端 URL。

## Synopsis

`sp setup` 将后端 URL 写入现有 Softprobe 配置命名空间。直接运行 `sp setup` 会启动交互式向导；也可通过 `--backend-url` 非交互设置 URL。

```bash
sp setup
sp setup --backend-url http://127.0.0.1:8090
```

模型提供商配置由 `sp code` 或内部编码引擎负责。安装健康检查请使用 `sp doctor`。

## Related

- [Doctor](/zh/testing/installation/doctor) — `sp doctor` 后端与内部引擎检查
- [agent](./agent.md) — 下载与 JVM 参数
- [Quickstart](/zh/cli/guide/quickstart.md)
- [health](./health.md)
