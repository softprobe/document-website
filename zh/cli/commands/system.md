::: warning CLI reference (English)
The `sp` CLI documentation is available in English. [Switch to English CLI docs](/en/cli/guide/for-agents).
:::

# sp system


## sp system

System-wide key/value config.

| Subcommand | Method | Path |
|------------|--------|------|
| `list` | GET | `/api/system/config/list` |
| `get <key>` | GET | `/api/system/config/query/{key}` |
| `save` | POST | `/api/system/config/save` |
| `delete <key>` | DELETE | `/api/system/config/delete/{key}` |
