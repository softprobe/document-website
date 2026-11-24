---
title: sp tenant：Softprobe API Key
---

# sp tenant：Softprobe API Key

**仅适用于 Softprobe Cloud。** 管理 Softprobe API Key，供 Softprobe API 和 Java Agent 使用。它与 Agent 的 Ingestion Key 是不同的凭据。自建部署用不到。

## `tenant softprobe-api-key ensure`

查找租户的 Softprobe API Key，没有就新建一个，并保存到当前配置档案的 `config.jsonc`：

```bash
sp tenant softprobe-api-key ensure --json
```

| 参数 | 说明 |
|------|------|
| `--no-save` | 只输出密钥，不写入 `config.jsonc` |

先在 [app.softprobe.ai/orgs](https://app.softprobe.ai/orgs) 选择组织，再运行 `sp auth login`。命令还需要该组织的数字租户 ID，可从当前配置档案读取，也可通过 `SP_TENANT_ID` 设置。

```json
{
  "ok": true,
  "command": "tenant softprobe-api-key ensure",
  "data": {
    "tenantId": "35",
    "softprobeApiKey": "…",
    "maskedSoftprobeApiKey": "***abcd",
    "savedToConfig": true
  }
}
```

`sp agent command` 会把保存的密钥写进 Agent 启动参数 `-Dsoftprobe.api.key=…`；还没有密钥时会自动创建。

## `tenant softprobe-api-key show`

显示已保存的密钥（脱敏显示）：

```bash
sp tenant softprobe-api-key show --json
```

还没有保存密钥时，会以用法错误退出（退出码 `2`）。

## 相关文档 {#related}

- [sp agent](./agent)
- [sp auth](./auth)
