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
sp ops storage diagnostics --json
sp ops schedule monitor --json
```

### JSON output (`storage overview`)

```json
{
  "ok": true,
  "command": "ops storage overview",
  "data": {
    "status": "ok",
    "healthy": true
  }
}
```

### JSON output (`schedule monitor`)

```json
{
  "ok": true,
  "command": "ops schedule monitor",
  "data": {
    "jobs": 0,
    "status": "healthy"
  }
}
```

