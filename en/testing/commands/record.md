# sp record

**When agents use this:** Inspect what was recorded for a trace; verify agent behavior via logs.

## Synopsis

Read-only access to stored recordings (not agent write APIs).

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `case list` | List recorded entry cases for an app and time window |
| `query` | Query mocker/record payload by trace or replay id |
| `trace <traceId>` | Trace tree and children |
| `completeness <traceId>` | Full-link recording completeness |
| `view` | Visualization query/view |

> **Log lookup (v1):** Use top-level [`sp logs`](./logs.md) with `--trace-id` — not `sp record logs *` (removed in unified log pipeline).

## Examples

```bash
sp record case list --app a1b2c3d4e5f67890 --since -1h --json
sp record query --trace-id abc --out-dir .sp-work --json
sp record trace abc --json
sp record completeness abc --json
sp logs --trace-id abc --since 2026-06-27T10:00:00Z --until 2026-06-27T10:05:00Z --json
```

## `case list`

Use this immediately after running an instrumented app and sending traffic. It proves that replay has input data.

```bash
sp record case list --app a1b2c3d4e5f67890 --since -1h --limit 20 --json
```

Required behavior:

- `--app` is required and maps to the registered `appId`.
- `--since` / `--until` select the recording window. Durations such as `-1h` are resolved relative to now.
- `--page` / `--limit` paginate cases.
- Output includes case ids or trace ids, operation names, recorded time, and enough metadata to start trace or replay workflows.

Example JSON shape:

```json
{
  "ok": true,
  "command": "record case list",
  "data": {
    "items": [
      {
        "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
        "operationName": "GET /api/orders/{id}",
        "recordedAt": "2026-05-19T10:15:00Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

## REST mapping

| Subcommand | Method | Path |
|------------|--------|------|
| `case list` | POST | `/api/storage/replay/query/replayCase` |
| `query` | POST | `/api/storage/record/query` |
| `trace` | GET | `/api/storage/record/trace/{traceId}` |
| `trace children` | GET | `/api/storage/record/trace/{traceId}/children` |
| `completeness` | GET | `/api/storage/record/completeness` |
| `view` | POST | `/api/storage/visualization/query` |

## Replaces `sp_api`

| sp_api | sp |
|--------|-----|
| `record_data` | `sp record query` |
| `record_log_overview` | `sp logs --trace-id …` (see [logs](./logs.md)) |
| `download_record_logs` | `sp logs --trace-id …` → redirect or `jq` |

## Non-goals

- `POST /api/storage/record/save`, `batchSave*` — agent instrumentation only

## Related

- [trace](./trace.md)
- [replay-diff](./replay-diff.md)
