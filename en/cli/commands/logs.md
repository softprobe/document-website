# sp logs

**When agents use this:** Retrieve correlated application, agent, and sp-backend logs for a W3C trace within caller-provided time bounds — without direct access to Parquet files or storage credentials.

> **Documentation stub.** This page describes the intended v1 contract before CLI implementation. Sections marked *(implementation)* may be refined when the command ships.

**Prerequisite:** Unified log pipeline enabled (Vector ingest + Parquet storage + query wiring). See [Log correlation IDs](/en/cli/guide/log-correlation-ids.md) for what each id means and where to find it.

v1 is **trace-id-only, canned lookup** — no SQL, no ad hoc query language, no `sp logs status` health command, and no replay/plan lookup keys.

---

## Synopsis

Query unified log rows by **`trace_id`** within a caller-provided time window.

```bash
sp logs --trace-id <id> --since <time> --until <time> [--json]
```

## Flags

| Flag | Required | Description |
|------|----------|-------------|
| `--trace-id` | Yes | W3C trace id — **the only v1 lookup key** |
| `--since` | Yes | Inclusive lower bound — ISO-8601 UTC (e.g. `2026-06-27T10:00:00Z`) |
| `--until` | Yes | Exclusive upper bound — ISO-8601 UTC |
| `--json` | No | Stable JSON envelope for automation and Agent Skills |

Rules:

- **`--trace-id`**, **`--since`**, and **`--until`** are required for every lookup. Time range is half-open: `[since, until)`.
- v1 does not expose `--limit` or row truncation — narrow the window or filter locally (`grep`, `tail`, redirect to a file).
- Unsupported lookup keys (`--replay-id`, `--plan-id`, `--plan-item-id`, `--include-recording-log`) fail validation before reading Parquet.
- No authentication is required for v1 log lookups when you can reach the deployment endpoint.
- When the log pipeline is disabled or query dependencies are unavailable, the command fails fast with a clear error. It does not return an empty success result and does not fall back to legacy log storage.

---

## Examples

```bash
# Trace-scoped lookup after a failed replay (obtain trace_id from replay API or pytest output)
sp logs \
  --trace-id 2057ad46a7ce03d3955385f2a4142d29 \
  --since 2026-06-27T10:00:00Z \
  --until 2026-06-27T10:05:00Z \
  --json

# Human-readable output
sp logs \
  --trace-id 2057ad46a7ce03d3955385f2a4142d29 \
  --since 2026-06-27T10:00:00Z \
  --until 2026-06-27T10:05:00Z

# Large result — redirect or pipe (no --limit in v1)
sp logs --trace-id 2057ad46a7ce03d3955385f2a4142d29 --since … --until … > /tmp/trace.log
grep ERROR /tmp/trace.log | head -20
```

Agent Skills workflow *(implementation)*:

```bash
sp logs --trace-id "$TRACE_ID" --since "$SINCE" --until "$UNTIL" > .spcode/unified-logs-"$TRACE_ID".log
grep ERROR .spcode/unified-logs-"$TRACE_ID".log | head -20
```

---

## Output

**Human (default):** Chronological log stream. *(Implementation)* — exact plain-text layout TBD.

**`--json`:** Same logical data in the standard CLI envelope (`ok`, `command`, `data`). Top-level `data` fields:

| Field | Meaning |
|-------|---------|
| `lookup` | Lookup type (`trace`), value, and caller `[since, until)` bounds |
| `rows` | Log lines — see [Log query fields](./log-query-fields.md) |
| `warnings` | Non-fatal schema-skip or similar notices (may be empty) |

v1 responses do **not** include `source_summary` or per-source row-count bucketing.

Rows do **not** include pytest labels, suite names, or test node ids.

Optional Softprobe labels (`sp.replay_id`, `sp.plan_id`, etc.) may appear on individual rows when the emitter had that context — they are not filter keys.

### JSON output

```json
{
  "ok": true,
  "command": "logs",
  "data": {
    "lookup": {
      "type": "trace",
      "value": "2057ad46a7ce03d3955385f2a4142d29",
      "windows": [
        {
          "since": "2026-06-27T10:00:00Z",
          "until": "2026-06-27T10:02:00Z"
        }
      ]
    },
    "rows": [
      {
        "timestamp": "2026-06-27T10:00:10.123Z",
        "severity": "WARN",
        "body": "Replay comparison mismatch",
        "service_name": "sp-backend",
        "sp.source": "backend",
        "trace_id": "2057ad46a7ce03d3955385f2a4142d29",
        "span_id": "8d10c94a2a6f4e11",
        "sp.replay_id": "6891fd300c676b31"
      }
    ],
    "warnings": []
  }
}
```

### JSON errors

Validation and API failures use the standard CLI stderr envelope:

```json
{
  "ok": false,
  "command": "logs",
  "error": {
    "code": "API_ERROR",
    "message": "API error 1: trace_id is required",
    "httpStatus": 200,
    "backend": {
      "responseCode": 1,
      "responseDesc": "trace_id is required"
    }
  }
}
```

Example validation messages: `trace_id is required`, `unsupported logs query parameter: replay_id`, `since is required`, `until is required`, `since must be before until`, `since and until must be ISO-8601 UTC timestamps`, `unsupported logs query parameter: <name>`, `log pipeline is disabled`, `log pipeline is unavailable`.

---

## REST mapping

| CLI | Method | Path |
|-----|--------|------|
| `--trace-id` | GET | `/api/recorder/logs?trace_id=<id>&since=<ts>&until=<ts>` |

Hosted on the same sp-backend base URL as other `sp` commands. v1 log lookups do not require authentication when you can reach the deployment endpoint.

---

## Retired commands (v1)

These pre-unified paths are removed, not shimmed:

| Retired | Replacement |
|---------|-------------|
| `sp record logs overview` | `sp logs --trace-id <id> --since … --until …` |
| `sp record logs download` | `sp logs --trace-id <id> …` (redirect to file) or `--json` with `jq` |
| `sp replay logs` (including `--overview`) | `sp logs --trace-id <id> …` (redirect to file) or `--json` with `jq` |
| `sp logs --replay-id`, `--plan-id`, `--plan-item-id` | **Rejected** — use `--trace-id` only |
| `--include-recording-log` | **Removed** — no record-link query |
| `GET /api/record-logs/*` | `GET /api/recorder/logs?trace_id=…` |
| `GET /api/replay-logs/*` | `GET /api/recorder/logs?trace_id=…` |

---

## Out of scope (v1)

- `sp logs status` / pipeline health status commands
- Replay-id, plan-id, or plan-item-id lookup keys
- Direct Parquet paths, catalog URLs, object-store credentials, or SQL
- `sp.session_id` in query results
- `--limit` / row truncation — narrow time bounds or filter locally instead
- Authentication for log lookups

---

## Related

- [Log query fields](./log-query-fields.md) — row field reference (FR-042)
- [Log correlation IDs — find and use ids](/en/cli/guide/log-correlation-ids.md)
- [sp replay case](./replay-case.md)
- [sp diagnose replay](./diagnose.md)
- [Diagnose replay failure example](/en/cli/examples/agent-diagnose-replay.md)
