::: warning CLI reference (English)
The `sp` CLI documentation is available in English. [Switch to English CLI docs](/en/cli/guide/for-agents).
:::

# sp ops

**When agents use this:** SRE-style diagnostics for storage and schedule health.

## Synopsis

Operational endpoints under `/vi/storage` and `/vi/schedule`.

## Subcommands

| Subcommand | Method | Path |
|------------|--------|------|
| `storage overview` | GET | `/vi/storage/overview` |
| `storage diagnostics` | GET | `/vi/storage/diagnostics` |
| `storage monitor` | GET | `/vi/storage/monitor` |
| `schedule monitor` | GET | `/vi/schedule/monitor` |

## Examples

```bash
sp ops storage overview --json
sp ops schedule monitor --json
```

