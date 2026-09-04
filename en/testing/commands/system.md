# sp system

System-wide key/value configuration.

## Subcommands

| Subcommand | Method | Path | Description |
|------------|--------|------|-------------|
| `list` | GET | `/api/system/config/list` | List system config keys |
| `get <key>` | GET | `/api/system/config/query/{key}` | Get system config by key |
| `save` | POST | `/api/system/config/save` | Save system configuration |
| `delete <key>` | DELETE | `/api/system/config/delete/{key}` | Delete system config key |

## Examples

```bash
sp system list --json
sp system get CallbackUrl --json
sp system save --callback-url https://callback.internal/webhook --json
sp system delete CallbackUrl --confirm --json
```

### JSON output (`system list`)

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

### JSON output (`system get`)

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

### JSON output (`system save`)

```json
{
  "ok": true,
  "command": "system save",
  "data": {
    "saved": true
  }
}
```

### JSON output (`system delete`)

```json
{
  "ok": true,
  "command": "system delete",
  "data": {
    "deleted": true
  }
}
```
