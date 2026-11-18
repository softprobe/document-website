# sp system

系统级键值配置。

## 子命令

| 子命令 | 请求方式 | 路径 | 说明 |
|--------|----------|------|------|
| `list` | GET | `/api/system/config/list` | 列出系统配置键 |
| `get <key>` | GET | `/api/system/config/query/{key}` | 按键获取系统配置 |
| `save` | POST | `/api/system/config/save` | 保存系统配置 |
| `delete <key>` | DELETE | `/api/system/config/delete/{key}` | 删除系统配置键 |

## 示例

```bash
sp system list --json
sp system get CallbackUrl --json
sp system save --callback-url https://callback.internal/webhook --json
sp system delete CallbackUrl --confirm --json
```

### JSON 输出 (`system list`)

```json
{
  "ok": true,
  "command": "system list",
  "data": {
    "items": [
      "CallbackUrl",
      "SampleCount"
    ]
  }
}
```

### JSON 输出 (`system get`)

```json
{
  "ok": true,
  "command": "system get",
  "data": {
    "key": "CallbackUrl",
    "value": "https://callback.internal/webhook"
  }
}
```

### JSON 输出 (`system save`)

```json
{
  "ok": true,
  "command": "system save",
  "data": {
    "saved": true
  }
}
```

### JSON 输出 (`system delete`)

```json
{
  "ok": true,
  "command": "system delete",
  "data": {
    "deleted": true
  }
}
```
