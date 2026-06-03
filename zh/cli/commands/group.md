::: warning CLI reference (English)
The `sp` CLI documentation is available in English. [Switch to English CLI docs](/en/cli/guide/for-agents).
:::

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

## Related

- [app](/en/cli/commands/app.md)
