# Log query fields

**When agents use this:** Interpret rows returned by [`sp logs`](./logs.md) or `GET /api/recorder/logs` — field names, meanings, and when correlation ids may be missing.

This reference describes **CLI and API query output** only. It does not document Parquet file paths, partition layout, or how to query storage directly. Use [`sp logs`](./logs.md) or the canonical HTTP API for all lookups.

**Lookup key:** v1 accepts **`trace_id` only**. Optional correlation labels may appear on rows when ingested — they are not filter keys.

**Naming:** API and Parquet rows use **unprefixed** column names (`source`, `replay_id`, …). OTLP on the wire may use `sp.source`, `sp.replay_id`, etc. before Vector maps them into storage.

---

## Where rows appear

Each successful lookup returns one **chronological stream** of rows in `data.rows` (CLI `--json`) or the API `rows` array. Rows are ordered by event `timestamp` ascending.

Human-readable CLI output prints the same logical fields as API JSON.

See [sp logs](./logs.md) for the `--trace-id` lookup key, triage workflow, and required time bounds.

---

## Field reference

Every row includes the core fields below. Correlation fields are included **when the emitting runtime knew them at log time** — they may be absent on contextless lines (see [Absent correlation fields](#absent-correlation-fields)).

| Field | Always present | Description |
|-------|----------------|-------------|
| `timestamp` | yes | Event time of the log line. ISO-8601 UTC in JSON (for example `2026-06-27T10:00:10.123Z`). Used for chronological ordering and for caller `[since, until)` filtering. |
| `severity` | yes | Normalized severity text from the emitting logger (for example `DEBUG`, `INFO`, `WARN`, `ERROR`). Each component controls which severities it emits through **its own native logging configuration** — Softprobe does not impose a product-wide severity filter. |
| `body` | yes | Full log message text. v1 returns the complete `body`; query results do not truncate message content. |
| `service_name` | yes | Runtime service identity for the line (for example `travel-ota`, `sp-backend`). Identifies which process produced the row. |
| `source` | yes | Which v1 pipeline source produced the row. Fixed values: `agent`, `app`, or `backend` (see [source values](#source-values)). |
| `trace_id` | when known | W3C OpenTelemetry trace id for the request or work unit that was active when the line was emitted. **The only v1 lookup key.** |
| `span_id` | when known | OpenTelemetry span id for the active span when the line was emitted. |
| `replay_id` | when known | One replay **attempt** id when replay context was active at emit time. Optional label — not a query key. |
| `plan_id` | when known | Replay **plan** id when plan context was active at emit time. Optional label — not a query key. |
| `plan_item_id` | when known | One case or operation inside a replay plan. Optional label — not a query key. |

**Not in v1 query results:** `session_id` / `sp.session_id`.

---

## `source` values

| Value | Meaning | Typical `service_name` examples |
|-------|---------|--------------------------------|
| `agent` | Java agent self-diagnostics (instrumentation, export, internal agent logging) | Application service name under instrumentation |
| `app` | Application-under-test logs captured by the agent (Logback, Log4j2, JUL) | `travel-ota`, customer app id |
| `backend` | sp-backend diagnostic logs exported through OpenTelemetry | `sp-backend` |

Filter or scan by `source` when you only want application lines versus agent diagnostics versus backend lines in the same trace lookup.

```bash
jq '[.rows[].source] | group_by(.) | map({source: .[0], n: length})' /tmp/sp-logs.json
jq -r '.rows[] | select(.source=="backend") | .body' /tmp/sp-logs.json | head -20
```

---

## Absent correlation fields

Correlation fields (`trace_id`, `span_id`, `replay_id`, `plan_id`, `plan_item_id`) are **omitted or empty when the runtime genuinely had no request or replay context** at emit time. This is expected — not a query defect.

Common cases:

| Situation | Typical absent fields | Why |
|-----------|----------------------|-----|
| Process **startup** or **shutdown** | Some or all correlation fields | No active HTTP/RPC request or replay dispatch yet, or context already cleared |
| **Background / housekeeping** lines | `trace_id`, `span_id`, replay/plan ids | Thread or timer work outside record/replay traffic |
| **Agent or backend idle** diagnostics | `replay_id`, `plan_id`, `plan_item_id` | Diagnostic line with trace context only, or no inbound W3C context |
| **Plan context not set** on a line | `plan_id`, `plan_item_id` | Line emitted outside a plan item dispatch even during replay |

When diagnosing a failed replay, query by the **`trace_id`** from the replay case or pytest correlation block. Filter rows by optional `replay_id` in local output when you need replay-scoped lines.

---

## Per-component logging ownership

| `source` | Who controls `severity` and what gets emitted |
|----------|-----------------------------------------------|
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
  "service_name": "sp-backend",
  "source": "backend",
  "trace_id": "2057ad46a7ce03d3955385f2a4142d29",
  "span_id": "8d10c94a2a6f4e11",
  "replay_id": "6891fd300c676b31",
  "plan_id": "6a3f2aad59f0c4655b0f99da",
  "plan_item_id": "6a3f2aad59f0c4655b0f99da:1"
}
```

A startup line from the same service might omit correlation fields entirely:

```json
{
  "timestamp": "2026-06-27T09:59:55.000Z",
  "severity": "INFO",
  "body": "Started SpBootApplication in 4.2 seconds",
  "service_name": "sp-backend",
  "source": "backend"
}
```

---

## Related

- [sp logs](./logs.md) — command reference, flags, triage, and API mapping
- [Log correlation IDs — find and use ids](/en/cli/guide/log-correlation-ids.md)
- [Diagnose replay failure example](/en/cli/examples/agent-diagnose-replay.md)
