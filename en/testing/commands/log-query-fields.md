# Log query fields

**When agents use this:** Interpret rows returned by [`sp logs`](./logs.md) or `GET /api/recorder/logs` — field names, meanings, and when correlation ids may be missing.

This reference describes **CLI and API query output** only. It does not document Parquet file paths, partition layout, or how to query storage directly. Use [`sp logs`](./logs.md) or the canonical HTTP API for all lookups.

**Lookup key:** at least one of **`trace_id`** or **`source`** (identity). Additional open `-f key=value` filters narrow further — see [Filterable fields](#filterable-fields) below and [`sp logs schema`](./logs.md#examples). Optional correlation labels (`replay_id`, `plan_id`, `plan_item_id`, …) may appear on rows when ingested — they are display-only, not filter keys (reject-as-filter).

**Naming:** API and Parquet rows use **unprefixed** column names (`source`, `replay_id`, …). OTLP on the wire may use `sp.source`, `sp.replay_id`, etc. before Vector maps them into storage.

---

## Where rows appear

Each successful lookup returns one **chronological stream** of rows in `data.rows` (CLI `--json`) or the API `rows` array. Rows are ordered by event `timestamp` ascending.

Human-readable CLI output prints the same logical fields as API JSON.

See [sp logs](./logs.md) for the `--trace-id`/`--source` identity, triage workflow, and required time bounds.

---

## Field reference

Every row includes the core fields below. Correlation fields are included **when the emitting runtime knew them at log time** — they may be absent on contextless lines (see [Absent correlation fields](#absent-correlation-fields)).

| Field | Always present | Description |
|-------|----------------|-------------|
| `timestamp` | yes | Event time of the log line. ISO-8601 UTC in JSON (for example `2026-06-27T10:00:10.123Z`). Used for chronological ordering and for caller `[since, until)` filtering. |
| `severity` | yes | Normalized severity text from the emitting logger (for example `DEBUG`, `INFO`, `WARN`, `ERROR`). Each component controls which severities it emits through **its own native logging configuration** — Softprobe does not impose a product-wide severity filter. |
| `body` | yes | Full log message text. Query results do not truncate message content. Not filterable via `-f` (default-deny) — use [gated SQL](/en/testing/reference/gated-sql.md) for body search. |
| `service_name` | yes | Runtime service identity for the line (for example `travel-ota`, `sp-backend`). Identifies which process produced the row. Filterable via `-f service_name=`. |
| `source` | yes | Which pipeline source produced the row. Fixed values: `agent`, `app`, or `backend` (see [source values](#source-values)). Identity key — filterable via `--source` / `-f source=`. |
| `logger_name` | when known | Logger/class name from the emitting runtime. The `title` filter operator (`--title` / `-f title=`) does a case-insensitive **substring** match against this column; `-f logger_name=` (if used directly) is exact. |
| `trace_id` | when known | W3C OpenTelemetry trace id for the request or work unit that was active when the line was emitted. Identity key — filterable via `--trace-id` / `-f trace_id=`. |
| `span_id` | when known | OpenTelemetry span id for the active span when the line was emitted. Not filterable (high-cardinality). |
| `replay_id` | when known | One replay **attempt** id when replay context was active at emit time. Optional label — not a query key. |
| `plan_id` | when known | Replay **plan** id when plan context was active at emit time. Optional label — not a query key. |
| `plan_item_id` | when known | One case or operation inside a replay plan. Optional label — not a query key. |
| `attributes` | yes (map; may be empty) | Extensible `MAP<VARCHAR, VARCHAR>` of non-promoted labels ingested from OTLP log attributes. Empty or absent on legacy Parquet written before this column shipped — a `-f` predicate against a missing key simply does not match, it does not fail the request. |

**Not in query results:** `session_id` / `sp.session_id`.

---

## Filterable fields

`sp logs` / `GET /api/recorder/logs` accept repeatable `-f key=value` (HTTP `f.<key>=value`), AND'd with identity and each other. Run [`sp logs schema`](./logs.md#examples) for the live, authoritative list — this table summarizes the R3 default:

| Key | Resolution | Notes |
|-----|-----------|-------|
| `trace_id` | Promoted column, exact match | Identity; may also be set via `--trace-id` |
| `source` | Promoted column, exact match | Identity; closed set `agent\|app\|backend` |
| `severity` | Promoted column, exact, case-insensitive | Closed set `TRACE\|DEBUG\|INFO\|WARN\|ERROR\|FATAL` — not a threshold |
| `title` | **Reserved operator** — case-insensitive **substring** on `logger_name` | Response field stays `logger_name`; there is no separate `title` Parquet column |
| `service_name` | Promoted column, exact match | |
| `logger_name` | Promoted column, exact match | Use `title` for substring matching instead |
| any other key | `attributes[key]` exact match | Legacy rows without `attributes` never match; the request still succeeds |

**Rejected as filters** (fail fast, even though some may appear as display fields on rows): `replay_id`, `plan_id`, `plan_item_id`, `mode`, `include_recording_log`, and the shared high-cardinality catalog (`span_id`, full URLs, exception messages/types, SQL text, …) unless the key is one of the identity/filterable keys above. **Default-deny** promoted columns that are display-only, not filterable: `body`, `timestamp` — use [gated SQL](/en/testing/reference/gated-sql.md) for body search or time expressions beyond the request window.

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

**Case-scoped diagnosis:** when the case row includes **`recordTime`** (API `requestDateTime`) and **`replayTime`**, use two ±2 minute windows (one per anchor) instead of one span from record to replay. The replay window usually has the relevant lines; the record window is often empty. See [sp logs — Case-scoped lookup](./logs.md#case-scoped-lookup-dual-windows).

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
  "plan_item_id": "6a3f2aad59f0c4655b0f99da:1",
  "attributes": {}
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

## Out of scope

This reference covers unified pipeline **query output** only. Not part of this contract unless separately specified:

- Record trace tables, metrics tables, replay read migration, historical backfill
- Non-replay-path service logs (dashboard, auth, and other Helm/workspace services)
- Direct Parquet file access, object-store credentials, or standalone query tools

---

## Related

- [sp logs](./logs.md) — command reference, flags, triage, and API mapping
- [sp metrics](./metrics.md) — same `-f`/`schema` grammar for metrics
- [Gated SQL](/en/testing/reference/gated-sql.md) — bounded ad-hoc SQL when `-f` exact-match isn't enough
- [Log correlation IDs — find and use ids](/en/testing/reference/log-correlation-ids.md)
- [Diagnose replay failure example](/en/testing/examples/agent-diagnose-replay.md)
