# sp trace

**When agents use this:** User provides business ID (orderId, caseId) instead of traceId — **preferred discovery path**.

## Synopsis

Attribute-based trace lookup and lightweight trace summary.

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `find` | Reverse lookup traces by extraction rule / attr |
| `get <traceId>` | Summary metadata and extracted attrs |
| `stats` | Attr rule statistics (optional) |

## Flags (`find`)

| Flag | Description |
|------|-------------|
| `--app` | Application id (required) |
| `--attr-name` | Rule name (e.g. `orderId`) |
| `--attr-value` | Business value (e.g. `ORD-1234`) |
| `--since` / `--until` | Epoch ms window (default: last 7 days) |
| `--limit` | Max traces (default 20) |

Modes:

1. `--attr-name` + `--attr-value` — precise lookup  
2. `--attr-name` only — all traces hit by rule  
3. Neither — recent traces hit by any extraction rule  

## Examples

```bash
sp trace find --app my-app --attr-name orderId --attr-value ORD-1234 --json
sp trace get 4bf92f3577b34da6a3ce929d0e0e4736 --json
sp trace stats --app my-app --json
```

### JSON output (`find`)

```json
{
  "ok": true,
  "command": "trace find",
  "data": {
    "items": [
      {
        "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
        "endpoint": "POST /api/order",
        "status": "OK",
        "durationMs": 120,
        "startedAt": "2026-05-18T10:00:00Z"
      }
    ]
  }
}
```

### JSON output (`get`)

```json
{
  "ok": true,
  "command": "trace get",
  "data": {
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
    "endpoint": "POST /api/order",
    "status": "OK",
    "durationMs": 120,
    "startedAt": "2026-05-18T10:00:00Z",
    "attrs": {
      "orderId": "ORD-1234"
    }
  }
}
```

### JSON output (`stats`)

```json
{
  "ok": true,
  "command": "trace stats",
  "data": {
    "items": [
      {
        "ruleName": "orderId",
        "hitCount": 1420,
        "lastHitAt": "2026-05-18T10:15:00Z"
      }
    ]
  }
}
```

## REST mapping

| Subcommand | Method | Path |
|------------|--------|------|
| `find` | POST | `/api/traces/find-by-attr` |
| `get` | GET | `/api/traces/{traceId}/summary` |
| `stats` | POST | `/api/traces/attr-rule-statistics` |

## Replaces `sp_api`

| sp_api | sp |
|--------|-----|
| `find_traces_by_attr` | `sp trace find` |
| `get_trace_summary` | `sp trace get` |

## Related

- [Attr → trace lookup](/zh/testing/examples/agent-attr-trace-lookup)
