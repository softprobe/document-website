# sp logs

**When agents use this:** Retrieve correlated application, agent, and sp-backend logs for a failed replay, trace, or plan using platform ids — without direct access to Parquet files or storage credentials.

> **Documentation stub.** This page describes the intended v1 contract before CLI implementation. Sections marked *(implementation)* may be refined when the command ships.

**Prerequisite:** Unified log pipeline enabled (Vector ingest + Parquet storage + query wiring). See [Log correlation IDs](/en/cli/guide/log-correlation-ids.md) for what each id means and where to find it.

v1 is **canned id-based lookup only** — no SQL, no ad hoc query language, no `sp logs status` health command.

---

## Synopsis

Query unified log rows by replay, trace, or plan correlation id within a caller-provided time window.

```bash
sp logs --replay-id <id> --since <time> --until <time> [--include-recording-log] [--json]
sp logs --trace-id <id> --since <time> --until <time> [--json]
sp logs --plan-id <id> --since <time> --until <time> [--json]
sp logs --plan-item-id <id> --since <time> --until <time> [--json]
```

## Flags

| Flag | Required | Description |
|------|----------|-------------|
| `--replay-id` | One lookup key | **Primary** troubleshooting key — one replay attempt |
| `--trace-id` | One lookup key | All logs on a W3C trace |
| `--plan-id` | One lookup key | All cases in a replay plan |
| `--plan-item-id` | One lookup key | One case/operation in a plan |
| `--since` | Yes | Inclusive lower bound — ISO-8601 UTC (e.g. `2026-06-27T10:00:00Z`) |
| `--until` | Yes | Exclusive upper bound — ISO-8601 UTC |
| `--include-recording-log` | No | **Replay-id lookups only** — also include linked record-phase rows |
| `--json` | No | Stable JSON envelope for automation and Agent Skills |

Rules:

- Exactly **one** lookup key per invocation.
- `--since` and `--until` are required for every lookup type. Time range is half-open: `[since, until)`.
- v1 does not expose `--limit` or row truncation — narrow the window or filter locally (`grep`, `tail`, redirect to a file).
- No authentication is required for v1 log lookups when you can reach the deployment endpoint.
- Unsupported flags and queries missing required lookup keys or time bounds fail before reading Parquet.
- When the log pipeline is disabled or query dependencies are unavailable, the command fails fast with a clear error. It does not return an empty success result and does not fall back to legacy log storage.

---

## `--include-recording-log`

Optional on **`--replay-id`** lookups only.

| Flag | Behavior |
|------|----------|
| Omitted (default) | Replay-phase rows only (matching the requested `sp.replay_id`) |
| Present | Also includes record-phase rows whose `trace_id` matches the single linked record trace id resolved from replay metadata (one replay → one recording), within `[since, until)` |

If the flag is set but replay metadata cannot resolve a linked record trace, the command **succeeds** and returns replay-phase rows only.

Rejected when combined with `--trace-id`, `--plan-id`, or `--plan-item-id`.

---

## Examples

```bash
# Failed case from: sp replay case list --plan plan-xyz --failed --json
sp logs \
  --replay-id 6891fd300c676b31 \
  --since 2026-06-27T10:00:00Z \
  --until 2026-06-27T10:05:00Z \
  --json

# Include recording-time logs when failure may originate at record time
sp logs \
  --replay-id 6891fd300c676b31 \
  --since 2026-06-27T09:55:00Z \
  --until 2026-06-27T10:05:00Z \
  --include-recording-log

# Trace-scoped lookup
sp logs \
  --trace-id 2057ad46a7ce03d3955385f2a4142d29 \
  --since 2026-06-27T10:00:00Z \
  --until 2026-06-27T10:05:00Z

# Large result — redirect or pipe (no --limit in v1)
sp logs --replay-id 6891fd300c676b31 --since … --until … > /tmp/replay.log
grep ERROR /tmp/replay.log | head -20
```

Agent Skills workflow *(implementation)*:

```bash
sp logs --replay-id "$REPLAY_ID" --since "$SINCE" --until "$UNTIL" > .spcode/unified-logs-"$REPLAY_ID".log
grep ERROR .spcode/unified-logs-"$REPLAY_ID".log | head -20
```

---

## Output

**Human (default):** Chronological log stream. *(Implementation)* — exact plain-text layout TBD.

**`--json`:** Same logical data in the standard CLI envelope (`ok`, `command`, `data`). Top-level `data` fields:

| Field | Meaning |
|-------|---------|
| `lookup` | Lookup type, value, and caller `[since, until)` bounds |
| `rows` | Log lines — see [Log query fields](./log-query-fields.md) |
| `warnings` | Non-fatal schema-skip or similar notices (may be empty) |

v1 responses do **not** include `source_summary` or per-source row-count bucketing.

Rows do **not** include pytest labels, suite names, or test node ids.

### JSON output

```json
{
  "ok": true,
  "command": "logs",
  "data": {
    "lookup": {
      "type": "replay",
      "value": "6891fd300c676b31",
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
        "sp.replay_id": "6891fd300c676b31",
        "sp.plan_id": "6a3f2aad59f0c4655b0f99da",
        "sp.plan_item_id": "6a3f2aad59f0c4655b0f99da:1"
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
    "message": "API error 1: exactly one lookup key is required",
    "httpStatus": 200,
    "backend": {
      "responseCode": 1,
      "responseDesc": "exactly one lookup key is required"
    }
  }
}
```

Example validation messages: `exactly one lookup key is required`, `since is required`, `until is required`, `since must be before until`, `since and until must be ISO-8601 UTC timestamps`, `unsupported logs query parameter: <name>`, `include_recording_log is supported only with replay_id lookups`, `log pipeline is disabled`, `log pipeline is unavailable`.

---

## REST mapping

| Lookup key | Method | Path |
|------------|--------|------|
| `--replay-id` | GET | `/api/recorder/logs?replay_id=<id>&since=<ts>&until=<ts>` |
| `--replay-id` + `--include-recording-log` | GET | `/api/recorder/logs?replay_id=<id>&since=<ts>&until=<ts>&include_recording_log=true` |
| `--trace-id` | GET | `/api/recorder/logs?trace_id=<id>&since=<ts>&until=<ts>` |
| `--plan-id` | GET | `/api/recorder/logs?plan_id=<id>&since=<ts>&until=<ts>` |
| `--plan-item-id` | GET | `/api/recorder/logs?plan_item_id=<id>&since=<ts>&until=<ts>` |

Hosted on the same sp-backend base URL as other `sp` commands. v1 log lookups do not require authentication when you can reach the deployment endpoint.

---

## Retired commands (v1)

These pre-unified paths are removed, not shimmed:

| Retired | Replacement |
|---------|-------------|
| `sp record logs overview` | `sp logs --trace-id <id> --since … --until …` |
| `sp record logs download` | `sp logs --trace-id <id> …` (redirect to file) or `--json` with `jq` |
| `sp replay logs` (including `--overview`) | `sp logs --replay-id <id> …` (redirect to file) or `--json` with `jq` |
| `GET /api/record-logs/*` | `GET /api/recorder/logs?trace_id=…` |
| `GET /api/replay-logs/*` | `GET /api/recorder/logs?replay_id=…` |

---

## Out of scope (v1)

- `sp logs status` / pipeline health status commands
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
