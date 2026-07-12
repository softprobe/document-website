# Log correlation IDs

When a replay fails, you need a **`trace_id`** and a bounded time window to pull correlated logs from the application under test, the Java agent, and sp-backend in one query. When there is **no** `trace_id` — for example an agent init/lifecycle failure before any request ran — you can query by **`source`** instead. This page explains what each id means, **where to find it**, and **how to triage** unified log results.

Requires the unified log pipeline (Vector → Parquet) enabled in your deployment or local compose stack. If the pipeline is disabled, log lookups fail fast with a clear error — they do not fall back to other log stores.

**Command reference:** [sp logs](/en/testing/commands/logs.md) · **API:** `GET /api/recorder/logs?since=…&until=…(&trace_id=…|&source=…)`

---

## ID quick reference

| ID | Log lookup key? | What it identifies | Use for log search |
|----|----------------|--------------------|--------------------|
| **`traceId`** | **Yes** (`--trace-id`) | W3C OpenTelemetry trace for one request flow | All agent/app/backend lines on that trace in `[since, until)` |
| **`source`** | **Yes** (`--source`) | Log source: `agent`, `app`, or `backend` | All matching-source lines in `[since, until)` when no `trace_id` exists — see [Source-mode diagnosis](#source-mode-diagnosis-and-window-cost) |
| **`replayId`** | No | One replay **attempt** of a recorded case | Find failed case + diff; copy **`traceId`** from the same row for logs |
| **`planId`** | No | A replay **plan** (batch from `sp replay run`) | Scope diagnose / case list; copy per-case **`traceId`** for logs |
| **`planItemId`** | No | One **case/operation** inside a plan | Same — use with case list, not as log key |
| **`diffId`** | No | Compare/diff result row | Use with `sp replay diff get`, not for logs |

Both `trace_id` and `source` may be combined (AND); at least one is required. Optional `-f key=value` filters (`title`, `severity`, `service_name`, or any `attributes` key) narrow further — see [Log query fields — Filterable fields](/en/testing/commands/log-query-fields.md#filterable-fields).

Each log row carries **`source`**: `agent` (Java agent diagnostics), `app` (application-under-test logs captured by the agent), or `backend` (sp-backend diagnostics). API/Parquet use unprefixed column names (`source`, `replay_id`, …). OTLP wire format may use `sp.*` keys before Vector normalization.

**Not in log query results:** `sessionId` / `sp.session_id`.

**Rejected as filters:** `--replay-id`, `--plan-id`, `--plan-item-id`, `--include-recording-log`, and the legacy `GET /api/record-logs/*` / `GET /api/replay-logs/*` endpoints (removed, not shimmed — use `GET /api/recorder/logs`).

---

## Source-mode diagnosis and window cost

Source-mode (`--source agent|app|backend`, no `trace_id`) is the right tool when a failure happened **before** any request had a trace — agent startup, JVM init, or a crash mid-bootstrap. It returns **all** matching-`source` rows in the window, including rows that also happen to carry a `trace_id`.

**Cost model — narrow your window.** Unlike trace-mode, source-mode is not trace-selective: it prunes to the time-partition files for `[since, until)` and then filters by `source`, so it may scan every row in those partitions (all sources) before filtering. This is not a bug or a security gap — in a multi-tenant deployment it only touches the querying tenant's own data — but a wide window (hours) costs real tenant-local CPU/memory/IO on the query path, the same openness as any other simple-API call. **Keep source-mode windows narrow** — a few minutes around the incident, the same discipline as trace-mode dual-window lookups below.

```bash
# Good: narrow window around a known agent-init failure
sp logs --source agent --since 2026-06-27T10:00:00Z --until 2026-06-27T10:03:00Z -f severity=ERROR --json

# Narrow further with the reserved `title` substring operator (matches logger_name)
sp logs --source agent --since 2026-06-27T10:00:00Z --until 2026-06-27T10:03:00Z --title agent.
```

If you need OR conditions, aggregates, or body-text search beyond exact-match `-f` filters, use [gated SQL](./gated-sql.md) instead of widening a source-mode window.

---

## Where to find `traceId` (primary for logs)

| Source | How |
|--------|-----|
| Failed replay case list | `sp replay case list --plan <planId> --failed --json` → `data.items[].traceId` |
| Replay metadata | `sp replay metadata <replayId> --json` → `traceId` |
| Diagnose workflow | `sp diagnose replay <planId> --failed-only --json` → then case list for `traceId` |
| CI / `make e2e` | **Softprobe correlation** block under pytest failure → field `trace_id` per case |
| Recorded cases | `sp record case list --app <appId> --since -24h --json` → entry case trace ids |

**Important:** For replay failures, use the **`traceId` on the replay case** (same value as the recorded trace — schedule puts it on `traceparent`). Do **not** guess from the newest recording list page or health-check traffic (`/index.html`, `/`) — those traces are unrelated noise.

`replayId`, `planId`, and `planItemId` in pytest output are for human reference and diff/diagnose commands only — not log lookup keys.

---

## Query correlated logs

Every lookup requires **`since`** and **`until`**, plus at least one of **`trace_id`** or **`source`**. Use **ISO-8601 UTC** (for example `2026-06-27T10:00:00Z`). `since` is **inclusive**; `until` is **exclusive** (`[since, until)`).

### CLI (primary)

```bash
sp logs --trace-id <traceId> --since <start> --until <end> [--json]
```

Add **`--json`** for scripts and AI agents. Human-readable text is the default.

### HTTP API (when `sp` is not in PATH)

```bash
export SP_API_URL="${SP_API_URL:-http://127.0.0.1:18090}"
TRACE_ID="2057ad46a7ce03d3955385f2a4142d29"
SINCE="2026-06-27T10:00:00Z"
UNTIL="2026-06-27T10:05:00Z"

curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&since=${SINCE}&until=${UNTIL}" \
  -H "Accept: application/json" -o /tmp/trace-logs.json
```

### Picking `since` / `until`

**When you have case timestamps (`recordTime` and `replayTime`):** run **two** ±2 minute lookups — one around each anchor — and merge rows. Never bridge record time to replay time in a single query. See [sp logs — Case-scoped lookup](/en/testing/commands/logs.md#case-scoped-lookup-dual-windows).

**Otherwise:**

1. Start with a window around the failure (for example five minutes before plan finish through one minute after).
2. Widen the window if row counts show zeros for a `source` you expect (`agent`, `app`, `backend`).
3. E2E after `make compose-parquet-clean`: rerun the session, then poll up to ~180s for Vector ingest.
4. The simple API returns **all** matching rows in the window — redirect or pipe locally for large output:

```bash
sp logs --trace-id <id> --since … --until … > /tmp/trace.log
grep ERROR /tmp/trace.log | head -20
```

There is no `--limit` on the simple log lookup API. For source-mode (no `trace_id`), narrow the window instead — see [Source-mode diagnosis and window cost](#source-mode-diagnosis-and-window-cost) above.

---

## Simple query vs gated SQL

| Use | Surface |
|-----|---------|
| Trace lookup, source-mode lookup, or any single exact-match label | `sp logs` / `sp metrics` with `-f` — no row cap, but narrow the window |
| Discover filterable fields | `sp logs schema` / `sp metrics schema` |
| OR conditions, aggregates, joins, or body/message search | [Gated SQL](./gated-sql.md) — `POST /api/recorder/query`, row cap applies |
| SQL on the CLI | Not available — no `sp logs --sql` / `sp metrics --sql` |

Gated SQL has the **same openness** as the simple query APIs (no auth) and the **same** tenant-local blast-radius consideration on wide windows — see [Gated SQL — Auth and SaaS blast radius](./gated-sql.md#auth-and-saas-blast-radius).

---

## Triage unified log results

After fetching logs, follow this order.

**`sp --json logs`** wraps the API body in `.data` — use `jq '.data.rows'`, `jq '.data.warnings'`. **`curl`** saves the API JSON directly — use `jq '.rows'`, `jq '.warnings'`.

```bash
# After sp --json logs (CLI envelope)
jq '.data.rows | length' /tmp/trace-logs.json
jq '[.data.rows[].source] | group_by(.) | map({source: .[0], n: length})' /tmp/trace-logs.json
jq '.data.warnings' /tmp/trace-logs.json
jq -r '.data.rows[] | select(.source=="backend" and .severity=="ERROR") | "\(.timestamp) \(.body)"' /tmp/trace-logs.json | head -20

# After curl GET /api/recorder/logs (API body at top level)
jq '.rows | length' /tmp/trace-logs.json
jq '[.rows[].source] | group_by(.) | map({source: .[0], n: length})' /tmp/trace-logs.json
jq '.warnings' /tmp/trace-logs.json
jq -r '.rows[] | select(.source=="backend" and .severity=="ERROR") | "\(.timestamp) \(.body)"' /tmp/trace-logs.json | head -20
```

### Symptom guide

| What you see | Likely meaning | Next step |
|--------------|----------------|-----------|
| `rows` empty + `warnings` non-empty | Parquet reader/schema mismatch (e.g. stale backend image) | Rebuild sp-backend; confirm API rows use `source` not `sp.source` |
| `rows` empty + `warnings` empty | Wrong `trace_id`, narrow window, or ingest lag | Use replay case `traceId`; widen `[since, until)`; rerun replay |
| Rows from `agent`, `app`, and `backend` | Pipeline healthy for that trace | Read `body` for ERROR/WARN; use `sp diagnose` diffs for compare failures |
| Only `backend`, no `app`/`agent` | Agent export or app logging quiet | Check agent attach, `sp.enable.debug`, app logger levels |

Recording-phase and replay-phase lines for the **same business request** share one **`trace_id`** on replay (recorded trace reused on `traceparent`). A single trace lookup can include both without `--include-recording-log` (removed, not shimmed).

---

## Reading the response

**HTTP API** top-level fields:

- `lookup` — lookup type (`trace`, `source`, or both), resolved filters, and caller `[since, until)` bounds
- `rows[]` — each row: `timestamp`, `severity`, `body`, `service_name`, `source`, `attributes`, and optional `trace_id`, `span_id`, `logger_name`, `replay_id`, `plan_id`, `plan_item_id`
- `warnings` — non-fatal schema-skip or similar (may be empty)

**`sp --json logs`** returns a CLI envelope: `{"ok":true,"command":"logs","data":{...}}` — use `.data.rows` and `.data.warnings` in scripts.

Responses do **not** include `source_summary`. Compute per-source counts locally with `jq` (see above).

See [Log query fields](/en/testing/commands/log-query-fields.md) for the full field reference.

---

## Pytest / `make e2e` failures

On replay-related test failures, pytest prints:

1. **Softprobe correlation** — `trace_id` (use for log query), plus `replay_id`, `plan_id`, `plan_item_id` for reference.
2. **Unified logs** — optional summary: row count and per-`source` counts when the hook ran curl.

Copy `trace_id` and the suggested `since`/`until` from the block, then run the triage commands above before diving into application code.

---

## Typical failure workflow

```text
1. sp replay case list --plan <planId> --failed --json
      → copy traceId (and replayId for diff/diagnose)

2. sp logs --trace-id <traceId> --since … --until … [--json]
      → triage: count → sources → warnings → read backend/agent/app bodies
      (curl GET /api/recorder/logs only when sp is unavailable)

3. sp diagnose replay <planId> --failed-only --out-dir .sp-work --json
      → read diff artifacts for field-level compare failures

4. If logs empty after clean Parquet: rerun replay/e2e and poll ingest
```

---

## API equivalent

```http
GET /api/recorder/logs?trace_id=<id>&since=<ts>&until=<ts>
GET /api/recorder/logs?source=agent&since=<ts>&until=<ts>&f.severity=ERROR
```

Unsupported/reject-as-filter query parameters (`replay_id`, `plan_id`, `plan_item_id`, `include_recording_log`, `mode`, …) are rejected before Parquet reads.

See [sp logs](/en/testing/commands/logs.md) for validation rules and JSON shape.

---

## Fashions: one grammar, several ways to ask

`trace_id` and `source` (and their `-f`/`f.*` equivalents) are the same filter compiler underneath, so these all compose the same way — mix identity, `-f` labels, and `schema` discovery as the diagnosis needs:

```bash
# Identity via first-class flag
sp logs --trace-id "$TRACE_ID" --since "$SINCE" --until "$UNTIL"

# Same identity via -f — same result set
sp logs --since "$SINCE" --until "$UNTIL" -f trace_id="$TRACE_ID"

# Source identity, no trace_id available (agent init/lifecycle)
sp logs --source agent --since "$SINCE" --until "$UNTIL"

# Source + label filters AND'd together
sp logs --source agent --since "$SINCE" --until "$UNTIL" -f severity=ERROR -f service_name=travel-ota

# Metrics — same grammar, different dataset
sp metrics --metric-name sp.agent.logs.export --since "$SINCE" --until "$UNTIL" -f result=success

# Discover what's filterable before you guess
sp logs schema --json
sp metrics schema --since "$SINCE" --until "$UNTIL" --json
```

---

## Related

- [Concepts — replay plans and ids](./concepts.md#trace-replay-and-plan-ids)
- [Gated SQL](./gated-sql.md) — bounded ad-hoc SQL when `-f` exact-match isn't enough
- [sp metrics](/en/testing/commands/metrics.md) — same grammar for metrics
- [Diagnose replay failure example](/en/testing/examples/agent-diagnose-replay.md)
- [sp replay case](/en/testing/commands/replay-case.md)
- [sp trace](/en/testing/commands/trace.md)
