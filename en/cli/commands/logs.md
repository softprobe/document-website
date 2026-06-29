# sp logs

**When agents use this:** Retrieve correlated application, agent, and sp-backend logs for a W3C trace within caller-provided time bounds — without direct access to Parquet files or storage credentials.

**Prerequisite:** Unified log pipeline enabled (Vector ingest + Parquet storage + query wiring). See [Log correlation IDs](/en/cli/guide/log-correlation-ids.md) for what each id means and where to find it.

v1 is **trace-id-only, canned lookup** — no SQL, no ad hoc query language, no `sp logs status` health command, and no replay/plan lookup keys.

**API (available now):** `GET /api/recorder/logs?trace_id=…&since=…&until=…` on sp-backend. Top-level **`sp logs` CLI** ships in a follow-on slice; softprobe-code and Agent Skills call the HTTP API until then.

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

Agent Skills workflow (API or future CLI):

```bash
# HTTP API (v1 workbench path)
curl -s "$SP_API_URL/api/recorder/logs?trace_id=$TRACE_ID&since=$SINCE&until=$UNTIL" > .spcode/unified-logs-"$TRACE_ID".json

# Future CLI equivalent
sp logs --trace-id "$TRACE_ID" --since "$SINCE" --until "$UNTIL" > .spcode/unified-logs-"$TRACE_ID".log
grep ERROR .spcode/unified-logs-"$TRACE_ID".log | head -20
```

---

## Output

**Human (default):** Chronological log stream — one line per row with timestamp, severity, `source`, `service_name`, and body.

**`--json`:** Same logical data in the standard CLI envelope (`ok`, `command`, `data`). Top-level `data` fields:

| Field | Meaning |
|-------|---------|
| `lookup` | Lookup type (`trace`), value, and caller `[since, until)` bounds |
| `rows` | Log lines — see [Log query fields](./log-query-fields.md) |
| `warnings` | Non-fatal schema-skip or similar notices (may be empty) |

v1 responses do **not** include `source_summary` or per-source row-count bucketing.

Rows do **not** include pytest labels, suite names, or test node ids.

Optional Softprobe labels (`replay_id`, `plan_id`, `plan_item_id`, …) may appear on individual rows when the emitter had that context — they are not filter keys.

---

## Troubleshooting failed replays

Use this after `sp diagnose replay` or a pytest failure. See [Log correlation IDs](/en/cli/guide/log-correlation-ids.md) for id sources.

```bash
export SP_API_URL="${SP_API_URL:-http://127.0.0.1:18090}"
TRACE_ID="<32-hex from replay case traceId or pytest correlation block>"
SINCE="2026-06-27T10:00:00Z"
UNTIL="2026-06-27T10:05:00Z"

curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&since=${SINCE}&until=${UNTIL}" \
  -H "Accept: application/json" -o /tmp/sp-logs.json

jq '.rows | length' /tmp/sp-logs.json
jq '[.rows[].source] | group_by(.) | map({source: .[0], n: length})' /tmp/sp-logs.json
jq '.warnings' /tmp/sp-logs.json
jq -r '.rows[] | select(.source=="backend" and .severity=="ERROR") | .body' /tmp/sp-logs.json | head -20
```

| Symptom | Likely cause |
|---------|----------------|
| 0 rows + non-empty `warnings` | Backend Parquet reader out of sync with schema — rebuild sp-backend image |
| 0 rows, empty `warnings` | Wrong `trace_id`, time window, or ingest not flushed yet |
| Rows from `agent`, `app`, and `backend` | Pipeline OK — inspect diff artifacts and log `body` for compare/mock timing |

**Pytest:** read **Softprobe correlation** (`trace_id`) and **Unified logs** (row/source summary) in failure output.

**Agent Skills:** shell first (`curl`, `jq`, `grep`) — do not implement Parquet readers in plugin code.

---

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
        "source": "backend",
        "trace_id": "2057ad46a7ce03d3955385f2a4142d29",
        "span_id": "8d10c94a2a6f4e11",
        "replay_id": "6891fd300c676b31"
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
