# sp group & grant

**When agents use this:** Admin automation for access control (not typical diagnosis flows).

## Subcommands

### `sp group`

| Subcommand | Path prefix |
|------------|-------------|
| `list` | `/api/userGroup/list` |
| `my` | `/api/userGroup/my` |

### `sp grant`

| Subcommand | Path |
|------------|------|
| `list` | `GET /api/appGrant/list` |

`sp grant list` requires `--app <appId>`.

All commands require `access-token`.

## Examples

```bash
sp group list --json
sp group my --json
sp grant list --app my-app --json
```

### JSON output (`group list`)

```json
{
  "ok": true,
  "command": "group list",
  "data": {
    "items": [
      {
        "id": "group-core-dev",
        "name": "Core Development",
        "description": "Core engineering team"
      }
    ]
  }
}
```

### JSON output (`grant list`)

```json
{
  "ok": true,
  "command": "grant list",
  "data": {
    "items": [
      {
        "id": "grant-101",
        "appId": "my-app",
        "userGroupId": "group-core-dev",
        "permission": "READ"
      }
    ]
  }
}
```

## Related

- [app](/en/testing/commands/app)
