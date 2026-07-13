# sp recorder (retired)

**This page is retired.** v1 unified log lookup is **trace-id-only** via [sp logs](./logs) and `GET /api/recorder/logs?trace_id=…`. `sp recorder logs`, `sp query`, and `sp recorder query` have been removed.

| Retired | Replacement |
|---------|-------------|
| `sp recorder logs --replay-id` | `sp logs --trace-id <traceId> …` or HTTP API with `trace_id` |
| `sp recorder logs --plan-id` / `--plan-item-id` | Resolve per-case **`traceId`**, then `sp logs --trace-id …` |
| `sp query` / `sp recorder query --sql` | Use `sp logs --trace-id …` (arbitrary SQL queries no longer supported) |
| `--include-recording-log` | **Removed** — record and replay share the same `trace_id` on replay |
| `source_summary` in responses | **Removed** — use `jq` to group rows by `source` |

Obtain **`traceId`** from replay case JSON, pytest **Softprobe correlation** output, or [Log correlation IDs](/en/testing/reference/log-correlation-ids).

## `sp recorder info` (still valid)

Show Recorder product health without exposing catalog or object-store credentials.

```bash
sp recorder info --json
```

Example JSON shape:

```json
{
  "ok": true,
  "command": "recorder info",
  "data": {
    "healthy": true,
    "profile": "onprem-helm",
    "helmEnabled": true,
    "vector": "ready",
    "ingest": "ready",
    "query": "ready",
    "catalog": "ready",
    "storage": "ready",
    "maintenance": "ready"
  }
}
```

## For log lookup, use `sp logs`

To correlate logs by trace, filter sp-backend `Replay send start` / `done` / `failed` markers, and for full flags, examples, triage workflow, and API mapping, see [sp logs](./logs) and [Replay send log markers](/en/testing/reference/replay-send-log-markers).
