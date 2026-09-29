---
title: sp tenant：租户密钥
---

# sp tenant：租户密钥

**仅适用于 Softprobe Cloud。** 管理 Java Agent 向你的租户上报数据时使用的租户 API 密钥。自建部署用不到。

## `tenant key ensure`

查找租户的 API 密钥，没有就新建一个，并保存到当前配置档案的 `sp.jsonc`：

```bash
sp tenant key ensure --json
```

| 参数 | 说明 |
|------|------|
| `--no-save` | 只输出密钥，不写入 `sp.jsonc` |

需要先执行 `sp auth login`，并提供租户 ID（`sp.jsonc` 中的 `tenant_id` 或环境变量 `SP_TENANT_ID`）。

```json
{
  "ok": true,
  "command": "tenant key ensure",
  "data": {
    "tenantId": "t-123",
    "tenantApiKey": "…",
    "maskedApiKey": "***abcd",
    "savedToConfig": true
  }
}
```

`sp agent command` 会把保存的密钥写进 Agent 启动参数 `-Dsp.api.token=…`；还没有密钥时会自动创建。

## `tenant key show`

显示已保存的密钥（打码）：

```bash
sp tenant key show --json
```

还没有保存密钥时，以用法错误（退出码 `2`）失败。

## 相关文档 {#related}

- [sp agent](./agent)
- [sp auth](./auth)
