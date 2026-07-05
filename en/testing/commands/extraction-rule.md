# sp extraction-rule

**When agents use this:** Configure or preview business-attribute extraction for `sp trace find`.

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `list --app <id>` | App extraction rules |
| `apply -f rules.yaml` | PUT app rules |
| `preview -f rules.yaml` | POST preview |

## REST mapping

| Subcommand | Method | Path |
|------------|--------|------|
| `list` | GET | `/api/applications/{appId}/extraction-rules` |
| `apply` | PUT | `/api/applications/{appId}/extraction-rules` |
| `preview` | POST | `/api/extraction-rules/preview` |
| agent pull | GET | `/api/agent/extraction-rules` (agent use; CLI rarely) |

## Related

- [trace](./trace.md)
