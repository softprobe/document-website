# sp logs

**When agents use this:** Retrieve correlated application, agent, and sp-backend logs for a W3C trace, a log **source** (`agent`/`app`/`backend`), or both — within caller-provided time bounds — without direct access to Parquet files or storage credentials.

**Prerequisite:** Unified log pipeline enabled (Vector ingest + Parquet storage + query wiring). See [Install sp-backend (server) — unified log pipeline](/en/testing/installation/server#unified-log-pipeline) and [Log correlation IDs](/en/testing/reference/log-correlation-ids.md).

Simple lookups are **canned, bounded queries** (DuckDB-backed) — no free-form SQL, no `sp logs status` health command, and no replay/plan lookup keys. For OR/aggregate/body-search queries beyond exact-match filters, use [gated SQL](/en/testing/reference/gated-sql.md) (`POST /api/recorder/query`, HTTP only — not a `sp logs` flag).

**API:** `GET /api/recorder/logs?since=…&until=…(&trace_id=…|&source=…)[&f.key=value ...]` on sp-backend. Top-level **`sp logs`** uses the same contract. `sp metrics` shares the same `-f`/`--since`/`--until`/`schema` grammar — see [sp metrics](./metrics.md).

---

## Synopsis

Query unified log rows by **`trace_id`**, **`source`**, and/or open `-f` filters within a caller-provided time window.

```bash
sp logs --trace-id <id> --since <time> --until <time> [--json]
sp logs --source <agent|app|backend> --since <time> --until <time> [-f key=value ...] [--json]
sp logs schema [--since <time> --until <time>] [--json]
```

## Flags

| Flag | Required | Description |
|------|----------|-------------|
| `--trace-id` | At least one of `--trace-id` / `--source` | W3C trace id — identity; may combine with `--source` (AND) |
| `--source` | At least one of `--trace-id` / `--source` | Log source identity: `agent`, `app`, or `backend`. Unknown value fails fast |
| `--title` | No | Case-insensitive **substring** match on promoted `logger_name`. Response field remains `logger_name` |
| `--severity` | No | Exact, case-insensitive match against the closed set `TRACE\|DEBUG\|INFO\|WARN\|ERROR\|FATAL` — not a threshold |
| `-f`, `--filter` | No | Repeatable `key=value` filter, AND'd with identity and every other filter (e.g. `-f service_name=travel-ota`). May also express identity (`-f trace_id=…`, `-f source=…`) |
| `--since` | Yes | Inclusive lower bound — ISO-8601 UTC (e.g. `2026-06-27T10:00:00Z`) |
| `--until` | Yes | Exclusive upper bound — ISO-8601 UTC |
| `--json` | No | Stable JSON envelope for automation and Agent Skills |

Rules:

- **`--since`** and **`--until`** are required for every lookup. Time range is half-open: `[since, until)`.
- **Identity:** at least one of `--trace-id` or `--source` is required (flags and/or `-f trace_id=`/`-f source=`). If both are present, results are **AND**ed — not either/or.
- The same identity key passed twice (e.g. `--trace-id X` and `-f trace_id=X`) is fine if the values match; **conflicting** values fail fast before any Parquet/DuckDB read.
- **Source mode** (no `--trace-id`) returns **all** matching `source` rows in the window, including rows that also carry a `trace_id`. It is a **partition-prune + `source=` filter**, not trace-selective — it may scan every row in the window's partitions before filtering. **Narrow the time window** for source-mode diagnosis (init incident ± a few minutes), especially in SaaS/multi-tenant deployments where a wide window costs tenant-local CPU/memory/IO. See [Log correlation IDs — source mode and window cost](/en/testing/reference/log-correlation-ids.md#source-mode-diagnosis-and-window-cost).
- `-f` / `--filter` only accepts **filterable** keys: identity/reserved keys (`trace_id`, `source`, `severity`), the filterable promoted column allowlist (`service_name`, `logger_name`), or any other key resolved against the `attributes` MAP. Non-filterable promoted columns (`body`, `timestamp`) and reject-as-filter keys (`replay_id`, `plan_id`, `plan_item_id`, `mode`, `include_recording_log`) fail validation before reading Parquet — they may still appear as **row fields** when present. Run `sp logs schema` to see the current allowlist.
- No `--limit` or row truncation on the simple API — narrow the window or filter locally (`grep`, `tail`, redirect to a file). [Gated SQL](/en/testing/reference/gated-sql.md) applies a documented row cap instead.
- No authentication is required for simple log lookups when you can reach the deployment endpoint.
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

# Same identity expressed via -f (equivalent result set)
sp logs \
  --since 2026-06-27T10:00:00Z \
  --until 2026-06-27T10:05:00Z \
  -f trace_id=2057ad46a7ce03d3955385f2a4142d29 -f service_name=travel-ota

# Agent init / lifecycle diagnostics — no trace_id available. Keep the window narrow.
sp logs --source agent \
  --since 2026-06-27T10:00:00Z --until 2026-06-27T10:03:00Z \
  -f severity=ERROR --title agent.

# Human-readable output
sp logs \
  --trace-id 2057ad46a7ce03d3955385f2a4142d29 \
  --since 2026-06-27T10:00:00Z \
  --until 2026-06-27T10:05:00Z

# Large result — redirect or pipe (no --limit on the simple API)
sp logs --trace-id 2057ad46a7ce03d3955385f2a4142d29 --since … --until … > /tmp/trace.log
grep ERROR /tmp/trace.log | head -20

# Discover filterable fields
sp logs schema --json
sp logs schema --since 2026-06-27T10:00:00Z --until 2026-06-27T10:03:00Z --json
```

Agent Skills workflow (CLI or API):

```bash
# Canonical CLI
sp logs --trace-id "$TRACE_ID" --since "$SINCE" --until "$UNTIL" > .spcode/unified-logs-"$TRACE_ID".log
grep ERROR .spcode/unified-logs-"$TRACE_ID".log | head -20

# HTTP API (same contract)
curl -s "$SP_API_URL/api/recorder/logs?trace_id=$TRACE_ID&since=$SINCE&until=$UNTIL" > .spcode/unified-logs-"$TRACE_ID".json
```

---

## Output

**Human (default):** Chronological log stream — one line per row with timestamp, severity, `source`, `service_name`, and body.

**`--json`:** Same logical data in the standard CLI envelope (`ok`, `command`, `data`). Top-level `data` fields:

| Field | Meaning |
|-------|---------|
| `lookup` | Lookup type (`trace`, `source`, or both), resolved filters, and caller `[since, until)` bounds |
| `rows` | Log lines — see [Log query fields](./log-query-fields.md) |
| `warnings` | Non-fatal schema-skip or similar notices (may be empty) |

Responses do **not** include `source_summary` or per-source row-count bucketing — compute locally with `jq` (see [Log correlation IDs](/en/testing/reference/log-correlation-ids.md)).

Rows do **not** include pytest labels, suite names, or test node ids.

Optional Softprobe labels (`replay_id`, `plan_id`, `plan_item_id`, …) may appear on individual rows when the emitter had that context — they are not filter keys (reject-as-filter).

---

## Case-scoped lookup (dual windows)

When diagnosing a **replay case**, you often have two timestamps:

- **`recordTime`** — when the case was originally recorded (API field `requestDateTime`)
- **`replayTime`** — when the replay run executed

**Do not** query from `recordTime` through `replayTime` in one request. That spans every minute partition in between and can scan hundreds of Parquet files.

Instead, run **two** narrow lookups (±2 minutes around each anchor) and merge rows client-side:

```bash
export SP_API_URL="${SP_API_URL:-http://127.0.0.1:18090}"
TRACE_ID="<32-hex from replay case traceId>"
RECORD_TIME_MS=1714000000000   # requestDateTime from case row
REPLAY_TIME_MS=1714046100000   # replayTime from case row
PADDING_MS=$((2 * 60 * 1000))

# Window 1: recording
RECORD_SINCE=$(date -u -d "@$(( (RECORD_TIME_MS - PADDING_MS) / 1000 ))" +%Y-%m-%dT%H:%M:%SZ)
RECORD_UNTIL=$(date -u -d "@$(( (RECORD_TIME_MS + PADDING_MS) / 1000 ))" +%Y-%m-%dT%H:%M:%SZ)

curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&since=${RECORD_SINCE}&until=${RECORD_UNTIL}" \
  -H "Accept: application/json" -o /tmp/sp-logs-record.json

# Window 2: replay
REPLAY_SINCE=$(date -u -d "@$(( (REPLAY_TIME_MS - PADDING_MS) / 1000 ))" +%Y-%m-%dT%H:%M:%SZ)
REPLAY_UNTIL=$(date -u -d "@$(( (REPLAY_TIME_MS + PADDING_MS) / 1000 ))" +%Y-%m-%dT%H:%M:%SZ)

curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&since=${REPLAY_SINCE}&until=${REPLAY_UNTIL}" \
  -H "Accept: application/json" -o /tmp/sp-logs-replay.json

# Merge and sort by timestamp (example with jq)
jq -s '[.[].rows[]] | sort_by(.timestamp)' /tmp/sp-logs-record.json /tmp/sp-logs-replay.json
```

The SoftProbe workbench **View case logs** action uses the same dual-window pattern automatically. The replay window usually contains the lines you need; the record window is often empty but cheap to query.

See [Log query fields](./log-query-fields.md) and [Log correlation IDs](/en/testing/reference/log-correlation-ids.md).

---

## Troubleshooting failed replays

Use this after `sp diagnose replay` or a pytest failure. See [Log correlation IDs](/en/testing/reference/log-correlation-ids.md) for id sources.

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

**No `trace_id` at all (agent never started a request, or crashed before one)?** Query by `source` instead, narrowing the window around the incident:

```bash
curl -s "${SP_API_URL}/api/recorder/logs?since=${SINCE}&until=${UNTIL}&source=agent&f.severity=ERROR" \
  -H "Accept: application/json" -o /tmp/sp-logs-agent.json
jq '.rows[] | {timestamp, severity, logger_name, body}' /tmp/sp-logs-agent.json
```

| Symptom | Likely cause |
|---------|----------------|
| 0 rows + non-empty `warnings` | Backend Parquet reader out of sync with schema — rebuild sp-backend image |
| 0 rows, empty `warnings` | Wrong `trace_id`/`source`, time window, or ingest not flushed yet |
| Rows from `agent`, `app`, and `backend` | Pipeline OK — inspect diff artifacts and log `body` for compare/mock timing |

**Pytest:** read **Softprobe correlation** (`trace_id`) and **Unified logs** (row/source summary) in failure output.

**Agent Skills:** shell first (`curl`, `jq`, `grep`) — do not implement Parquet readers in plugin code. Reach for [gated SQL](/en/testing/reference/gated-sql.md) only for OR/aggregate/body-search queries beyond exact-match filters.

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
        "replay_id": "6891fd300c676b31",
        "attributes": {}
      }
    ],
    "warnings": []
  }
}
```

`attributes` is an empty or absent map on legacy Parquet written before the unified `attributes` column shipped — that predicate simply does not match, it does not fail the request.

### JSON errors

Validation and API failures use the standard CLI stderr envelope:

```json
{
  "ok": false,
  "command": "logs",
  "error": {
    "code": "API_ERROR",
    "message": "API error 1: trace_id or source is required",
    "httpStatus": 200,
    "backend": {
      "responseCode": 1,
      "responseDesc": "trace_id or source is required"
    }
  }
}
```

Example validation messages: `trace_id or source is required`, `invalid source value`, `invalid severity value`, `unsupported logs query parameter: replay_id`, `since is required`, `until is required`, `since must be before until`, `since and until must be ISO-8601 UTC timestamps`, `unsupported logs query parameter: <name>`, `forbidden filter key: <name>`, `log pipeline is disabled`, `log pipeline is unavailable`.

---

## REST mapping

| CLI | Method | Path |
|-----|--------|------|
| `--trace-id` | GET | `/api/recorder/logs?trace_id=<id>&since=<ts>&until=<ts>` |
| `--source` | GET | `/api/recorder/logs?source=<agent\|app\|backend>&since=<ts>&until=<ts>` |
| `-f key=value` (non-identity) | GET | `/api/recorder/logs?...&f.<key>=<value>` |
| `schema` | GET | `/api/recorder/logs/schema[?since=<ts>&until=<ts>]` |

Hosted on the same sp-backend base URL as other `sp` commands. Simple log lookups do not require authentication when you can reach the deployment endpoint.

---

## Retired commands (v1)

These pre-unified paths are removed, not shimmed:

| Retired | Replacement |
|---------|-------------|
| `sp record logs overview` | `sp logs --trace-id <id> --since … --until …` |
| `sp record logs download` | `sp logs --trace-id <id> …` (redirect to file) or `--json` with `jq` |
| `sp replay logs` (including `--overview`) | `sp logs --trace-id <id> …` (redirect to file) or `--json` with `jq` |
| `sp logs --replay-id`, `--plan-id`, `--plan-item-id` | **Rejected** — use `--trace-id` / `--source` (and other **filterable** labels) |
| `--include-recording-log` | **Removed** — no record-link query |
| `GET /api/record-logs/*` | `GET /api/recorder/logs?trace_id=…` |
| `GET /api/replay-logs/*` | `GET /api/recorder/logs?trace_id=…` |

---

## Out of scope

- `sp logs status` / pipeline health status commands
- Replay-id, plan-id, or plan-item-id lookup keys (reject-as-filter; display-only when present on rows)
- Direct Parquet paths, catalog URLs, or object-store credentials
- `sp.session_id` in query results
- `--limit` / row truncation on the simple API — narrow time bounds or filter locally, or use [gated SQL](/en/testing/reference/gated-sql.md) for bounded ad-hoc queries
- Authentication for log lookups (gated SQL keeps the **same** openness — see that page's Auth section)
- SQL text / `--sql` on `sp logs` itself — gated SQL is **HTTP only** (`POST /api/recorder/query`)
- Record trace tables, metrics tables, replay read migration, historical backfill, and non-replay-path service logs (dashboard, auth, etc.) — replay **data** stays on the legacy replay-compatible storage path

---

## Related

- [sp metrics](./metrics.md) — same `-f`/identity/`schema` grammar for metrics
- [Gated SQL](/en/testing/reference/gated-sql.md) — bounded ad-hoc SQL over `logs`/`metrics` when exact-match filters aren't enough
- [Log query fields](./log-query-fields.md) — row field reference
- [Log correlation IDs — find and use ids](/en/testing/reference/log-correlation-ids.md)
- [sp replay case](./replay-case.md)
- [sp diagnose replay](./diagnose.md)
- [Diagnose replay failure example](/en/testing/examples/agent-diagnose-replay.md)
