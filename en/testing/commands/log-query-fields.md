# Log query fields

**When agents use this:** Interpret rows returned by [`sp logs`](./logs.md) or `GET /api/recorder/logs` — field names, meanings, and when correlation ids may be missing.

This reference describes **CLI and API query output** only. It does not document Parquet file paths, partition layout, or how to query storage directly. Use [`sp logs`](./logs.md) or the canonical HTTP API for all lookups.

**Lookup keys:** trace-mode uses **`trace_id`**; source-mode uses identity **`sp_source`** (CLI `--source`) with required time bounds. Optional correlation labels may appear on rows when ingested — SoftProbe testing ids (`sp_replay_id`, …) are not filter keys.

**Naming:** SoftProbe-owned API/Parquet columns use wire-derived **`sp_*`** names (`sp_source`, `sp_replay_id`, …). Logger / scope name is OTEL-aligned **`logger_name`** (same on wire and storage). Wire OTLP attributes use dotted form (`sp.source`, `sp.replay_id`) before Vector maps them into underscore columns.

---

## Where rows appear

Each successful lookup returns one **chronological stream** of rows in `data.rows` (CLI `--json`) or the API `rows` array. Rows are ordered by event `timestamp` ascending.

Human-readable CLI output prints the same logical fields as API JSON.

See [sp logs](./logs.md) for lookup modes, triage workflow, and required time bounds.

---

## Field reference

Every row includes the core fields below. Correlation fields are included **when the emitting runtime knew them at log time** — they may be absent on contextless lines (see [Absent correlation fields](#absent-correlation-fields)).

| Field | Always present | Description |
|-------|----------------|-------------|
| `timestamp` | yes | Event time of the log line. ISO-8601 UTC in JSON (for example `2026-06-27T10:00:10.123Z`). Used for chronological ordering and for caller `[since, until)` filtering. |
| `severity` | yes | Normalized severity text from the emitting logger (for example `DEBUG`, `INFO`, `WARN`, `ERROR`). Each component controls which severities it emits through **its own native logging configuration** — Softprobe does not impose a product-wide severity filter. |
| `body` | yes | Full log message text. v1 returns the complete `body`; query results do not truncate message content. |
| `logger_name` | when known | Logger / instrumentation-scope name. Product flag `--title` / query param `title` is a case-insensitive **substring** on this column; `-f logger_name=` is exact. |
| `service_name` | yes | Runtime service identity for the line (for example `travel-ota`, `sp-backend`). Identifies which process produced the row. |
| `sp_source` | when known | Which pipeline source produced the row. Typical values: `agent`, `app`, or `backend` (see [sp_source values](#sp_source-values)). CLI `--source` filters this column. |
| `trace_id` | when known | W3C OpenTelemetry trace id for the request or work unit that was active when the line was emitted. Trace-mode lookup key. |
| `span_id` | when known | OpenTelemetry span id for the active span when the line was emitted. |
| `sp_replay_id` | when known | One replay **attempt** id when replay context was active at emit time. Optional label — not a query key. |
| `sp_plan_id` | when known | Replay **plan** id when plan context was active at emit time. Optional label — not a query key. |
| `sp_plan_item_id` | when known | One case or operation inside a replay plan. Optional label — not a query key. |
| `attributes` | when present | Low-cardinality MAP (for example `sp_app_id`, `host_name`). Filter with `-f key=value` after `sp logs schema`. |

**Not in v1 query results:** `session_id` / `sp.session_id`.

---

## `sp_source` values

| Value | Meaning | Typical `service_name` examples |
|-------|---------|--------------------------------|
| `agent` | Java agent self-diagnostics (instrumentation, export, internal agent logging) | Application service name under instrumentation |
| `app` | Application-under-test logs captured by the agent (Logback, Log4j2, JUL) | `travel-ota`, customer app id |
| `backend` | sp-backend diagnostic logs exported through OpenTelemetry | `sp-backend` |

Filter or scan by `sp_source` when you only want application lines versus agent diagnostics versus backend lines in the same lookup.

```bash
jq '[.rows[].sp_source] | group_by(.) | map({sp_source: .[0], n: length})' /tmp/sp-logs.json
jq -r '.rows[] | select(.sp_source=="backend") | .body' /tmp/sp-logs.json | head -20
```

---

## Absent correlation fields

Correlation fields (`trace_id`, `span_id`, `sp_replay_id`, `sp_plan_id`, `sp_plan_item_id`) are **omitted or empty when the runtime genuinely had no request or replay context** at emit time. This is expected — not a query defect.

Common cases:

| Situation | Typical absent fields | Why |
|-----------|----------------------|-----|
| Process **startup** or **shutdown** | Some or all correlation fields | No active HTTP/RPC request or replay dispatch yet, or context already cleared |
| **Background / housekeeping** lines | `trace_id`, `span_id`, replay/plan ids | Thread or timer work outside record/replay traffic |
| **Agent or backend idle** diagnostics | `sp_replay_id`, `sp_plan_id`, `sp_plan_item_id` | Diagnostic line with trace context only, or no inbound W3C context |
| **Plan context not set** on a line | `sp_plan_id`, `sp_plan_item_id` | Line emitted outside a plan item dispatch even during replay |

When diagnosing a failed replay, query by the **`trace_id`** from the replay case or pytest correlation block. Inspect optional `sp_replay_id` in local output when you need replay-scoped lines.

**Case-scoped diagnosis:** when the case row includes **`recordTime`** (API `requestDateTime`) and **`replayTime`**, use two ±2 minute windows (one per anchor) instead of one span from record to replay. The replay window usually has the relevant lines; the record window is often empty. See [sp logs — Case-scoped lookup](./logs.md#case-scoped-lookup-dual-windows).

---

## Per-component logging ownership

| `sp_source` | Who controls `severity` and what gets emitted |
|-------------|-----------------------------------------------|
| `agent` | Agent / JVM logging configuration (`sp.log.path`, `sp.log.console`, `sp.enable.debug`, etc.) |
| `app` | Application Logback, Log4j2, or JUL settings |
| `backend` | sp-backend logging and OpenTelemetry log export configuration |

Softprobe attaches correlation ids and forwards lines each logger already emits. It does not change application log levels or filter severities product-wide.

---

## Example row (JSON)

From [`sp logs --json`](./logs.md) or `GET /api/recorder/logs`:

```json
{
  "timestamp": "2026-06-27T10:00:10.123Z",
  "severity": "WARN",
  "body": "Replay comparison mismatch",
  "logger_name": "ai.softprobe.storage.service.ReplayCompareService",
  "service_name": "sp-backend",
  "sp_source": "backend",
  "trace_id": "2057ad46a7ce03d3955385f2a4142d29",
  "span_id": "8d10c94a2a6f4e11",
  "sp_replay_id": "6891fd300c676b31",
  "sp_plan_id": "6a3f2aad59f0c4655b0f99da",
  "sp_plan_item_id": "6a3f2aad59f0c4655b0f99da:1",
  "attributes": {
    "sp_app_id": "sp-backend",
    "host_name": "sp-backend-0"
  }
}
```

A startup line from the same service might omit correlation fields entirely:

```json
{
  "timestamp": "2026-06-27T09:59:55.000Z",
  "severity": "INFO",
  "body": "Started SpBootApplication in 4.2 seconds",
  "service_name": "sp-backend",
  "sp_source": "backend"
}
```

---

## Out of scope (v1)

This reference covers unified pipeline **query output** only. Not part of v1 unless separately specified:

- Record trace tables, metrics tables, replay read migration, historical backfill
- Non-replay-path service logs (dashboard, auth, and other Helm/workspace services)
- Direct Parquet file access, object-store credentials, or standalone query tools

---

## Related

- [sp logs](./logs.md) — command reference, flags, triage, and API mapping
- [Log correlation IDs — find and use ids](/en/testing/reference/log-correlation-ids.md)
- [Diagnose replay failure example](/en/testing/examples/agent-diagnose-replay.md)
