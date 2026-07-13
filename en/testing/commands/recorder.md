# sp recorder logs (retired)

**This page is retired.** v1 unified log lookup is **trace-id-only** via [sp logs](./logs) and `GET /api/recorder/logs?trace_id=…`.

| Retired | Replacement |
|---------|-------------|
| `sp recorder logs --replay-id` | `sp logs --trace-id <traceId> …` or HTTP API with `trace_id` |
| `sp recorder logs --plan-id` / `--plan-item-id` | Resolve per-case **`traceId`**, then `sp logs --trace-id …` |
| `--include-recording-log` | **Removed** — record and replay share the same `trace_id` on replay |
| `source_summary` in responses | **Removed** — use `jq` to group rows by `source` |

Obtain **`traceId`** from replay case JSON, pytest **Softprobe correlation** output, or [Log correlation IDs](/en/testing/reference/log-correlation-ids).

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

## `sp recorder logs`

Retrieve bounded log rows by correlation fields.

```bash
sp recorder logs --trace-id trace-123 --since 1h --limit 500 --json
sp recorder logs --replay-id replay-456 --limit 500 --json
```

Results are ordered by event time and include available trace, span, replay, session, and service metadata.

For sp-backend schedule dispatch, filter **`sp.source=backend`** rows whose body contains **`Replay send start`**, **`Replay send done`**, or **`Replay send failed`** — the replay HTTP entry/exit markers. See [Replay send log markers](/en/testing/reference/replay-send-log-markers).

## `sp query`

Run a bounded read-only query against Recorder logs.

```bash
sp query 'SELECT timestamp, severity_text, body FROM logs WHERE trace_id = ? ORDER BY timestamp' \
  --param trace-123 \
  --limit 500 \
  --json
```

## `sp recorder query`

Use the explicit Recorder namespace for the same safe query contract.

```bash
sp recorder query \
  --sql 'SELECT timestamp, body FROM logs WHERE trace_id = ? ORDER BY timestamp' \
  --param trace-123 \
  --limit 500 \
  --json
```

## Safety Rules

- Use `--json` for AI agents and automation.
- Queries are read-only and limited to supported Recorder log tables in phase one.
- Mutating SQL, unsupported tables, missing bounds, and broad scans fail closed.
- CLI users and spcode never configure catalog URLs, object-store keys, or standalone query tools.
- On-prem deployment is enabled through the existing Softprobe Helm chart; production/SaaS manifests are not part of phase one.
See [sp logs](./logs) for flags, examples, triage workflow, and API mapping.
