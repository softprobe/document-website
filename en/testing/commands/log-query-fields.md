# Log query fields

The fields of each row returned by [`sp logs`](./logs) or `GET /api/recorder/logs`, and why some of them may be missing.

**Lookup key:** `trace_id` is required. On the HTTP API, `replay_id`, `plan_id`, `plan_item_id`, `mode` (`record` or `replay`) and `source` are optional filters — see [sp logs — HTTP API](./logs#http-api).

**Naming:** rows use unprefixed names (`source`, `replay_id`, …). OTLP data on the wire may use `sp.source`, `sp.replay_id` and so on before it is stored.

---

## Where rows appear

Each successful lookup returns one **chronological stream** of rows in `data.rows` (CLI `--json`) or the API `rows` array. Rows are ordered by event `timestamp` ascending.

Human-readable CLI output prints the same logical fields as API JSON.

See [sp logs](./logs) for the lookup flags and how to read the result.

---

## Field reference

Every row includes the core fields below. Correlation fields are included **when the emitting runtime knew them at log time** — they may be absent on contextless lines (see [Absent correlation fields](#absent-correlation-fields)).

| Field | Always present | Description |
|-------|----------------|-------------|
| `timestamp` | yes | Event time of the log line. ISO-8601 UTC in JSON (for example `2026-06-27T10:00:10.123Z`). Used for chronological ordering and for caller `[since, until)` filtering. |
| `severity` | yes | Normalized severity text from the emitting logger (for example `DEBUG`, `INFO`, `WARN`, `ERROR`). Each component controls which severities it emits through **its own native logging configuration** — Softprobe does not impose a product-wide severity filter. |
| `body` | yes | Full log message text; it is not truncated. |
| `service_name` | yes | Runtime service identity for the line (for example `travel-ota`, `sp-backend`). Identifies which process produced the row. |
| `source` | yes | Which component produced the row: `agent`, `app` or `backend` (see [source values](#source-values)). |
| `trace_id` | when known | W3C OpenTelemetry trace id for the request or work unit that was active when the line was emitted. The lookup key. |
| `span_id` | when known | OpenTelemetry span id for the active span when the line was emitted. |
| `replay_id` | when known | One replay **attempt** id when replay context was active at emit time. Also a supported optional query filter (`&replay_id=`). |
| `plan_id` | when known | Replay **plan** id when plan context was active at emit time. Also a supported optional query filter (`&plan_id=`). |
| `plan_item_id` | when known | One case or operation inside a replay plan. Also a supported optional query filter (`&plan_item_id=`). |
| `mode` | when known | Record/replay phase tag as emitted by the agent (`record` or `replay`). Rows written by older agents omit it; read `effective_mode` instead. Also a supported optional query filter (`&mode=record` / `&mode=replay`). |
| `effective_mode` | yes (derived) | Server-derived phase for the row: the stored `mode` when present, otherwise inferred from `replay_id` (absent ⇒ `record`, present ⇒ `replay`). **The authoritative phase field** — prefer it over inspecting `replay_id` yourself. Response-only; not a stored column. |

`session_id` / `sp.session_id` is not returned.

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

When diagnosing a failed replay, query by the `trace_id` of the failed replay case. To get only one replay run's lines, add `&replay_id=` (and `&mode=replay`) to the API query.

Recording and replay of the same case usually happen at very different times. On the HTTP API, leave out `since`/`until` and the backend scans a window around the recording and around the replay runs (see [sp logs — HTTP API](./logs#http-api)); when it can't, query the two times separately as in [sp logs — explicit windows](./logs#explicit-windows). Don't pass one window that stretches from the recording time to the replay time.

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

From [`sp logs --json`](./logs) or `GET /api/recorder/logs`:

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
  "mode": "replay",
  "effective_mode": "replay"
}
```

A startup line from the same service might omit correlation fields entirely:

```json
{
  "timestamp": "2026-06-27T09:59:55.000Z",
  "severity": "INFO",
  "body": "Started SpBootApplication in 4.2 seconds",
  "service_name": "sp-backend",
  "source": "backend",
  "effective_mode": "record"
}
```

Note the caveat visible in this example: contextless platform lines (no stored `mode`, no `replay_id`) derive `effective_mode: "record"` even though they are not recording traffic. Treat `effective_mode` as authoritative only on lines that carry request/replay context; combine with `source` for platform diagnostics.

---

## Related

- [sp logs](./logs)
- [Concepts and IDs](/en/testing/agents/concepts#ids)
- [Diagnose a failed replay](/en/testing/examples/agent-diagnose-replay)
