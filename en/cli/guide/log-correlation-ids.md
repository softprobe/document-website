# Log correlation IDs

When a replay fails, you need a **`trace_id`** and a bounded time window to pull correlated logs from the application under test, the Java agent, and sp-backend in one query. This page explains what each id means, **where to find it**, and **how to triage** unified log results.

Requires the unified log pipeline (Vector → Parquet) enabled in your deployment or local compose stack. If the pipeline is disabled, log lookups fail fast with a clear error — they do not fall back to other log stores.

**Command reference:** [sp logs](/en/cli/commands/logs.md) · **API:** `GET /api/recorder/logs?trace_id=…&since=…&until=…`

---

## ID quick reference

| ID | v1 log lookup? | What it identifies | Use for log search |
|----|----------------|--------------------|--------------------|
| **`traceId`** | **Yes** (`--trace-id`) | W3C OpenTelemetry trace for one request flow | **Only v1 lookup key** — all agent/app/backend lines on that trace in `[since, until)` |
| **`replayId`** | No | One replay **attempt** of a recorded case | Find failed case + diff; copy **`traceId`** from the same row for logs |
| **`planId`** | No | A replay **plan** (batch from `sp replay run`) | Scope diagnose / case list; copy per-case **`traceId`** for logs |
| **`planItemId`** | No | One **case/operation** inside a plan | Same — use with case list, not as log key |
| **`diffId`** | No | Compare/diff result row | Use with `sp replay diff get`, not for logs |

Each log row carries **`source`**: `agent` (Java agent diagnostics), `app` (application-under-test logs captured by the agent), or `backend` (sp-backend diagnostics). API/Parquet use unprefixed column names (`source`, `replay_id`, …). OTLP wire format may use `sp.*` keys before Vector normalization.

**Not in v1 log query results:** `sessionId` / `sp.session_id`.

**Rejected in v1:** `--replay-id`, `--plan-id`, `--plan-item-id`, `--include-recording-log`, `GET /api/record-logs/*`, `GET /api/replay-logs/*`.

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

`replayId`, `planId`, and `planItemId` in pytest output are for human reference and diff/diagnose commands only — not v1 log lookup keys.

---

## Query correlated logs

Every lookup requires **`trace_id`** plus **`since`** and **`until`**. Use **ISO-8601 UTC** (for example `2026-06-27T10:00:00Z`). `since` is **inclusive**; `until` is **exclusive** (`[since, until)`).

### HTTP API (available now)

```bash
export SP_API_URL="${SP_API_URL:-http://127.0.0.1:18090}"
TRACE_ID="2057ad46a7ce03d3955385f2a4142d29"
SINCE="2026-06-27T10:00:00Z"
UNTIL="2026-06-27T10:05:00Z"

curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&since=${SINCE}&until=${UNTIL}" \
  -H "Accept: application/json" -o /tmp/trace-logs.json
```

### CLI (when implemented)

```bash
sp logs --trace-id <traceId> --since <start> --until <end> [--json]
```

Add **`--json`** for scripts and AI agents. Human-readable text is the default when the CLI ships.

### Picking `since` / `until`

1. Start with a window around the failure (for example five minutes before plan finish through one minute after).
2. Widen the window if row counts show zeros for a `source` you expect (`agent`, `app`, `backend`).
3. E2E after `make compose-parquet-clean`: rerun the session, then poll up to ~180s for Vector ingest.
4. v1 returns **all** matching rows in the window — redirect or pipe locally for large output:

```bash
sp logs --trace-id <id> --since … --until … > /tmp/trace.log
grep ERROR /tmp/trace.log | head -20
```

There is no `--limit` on v1 log lookups.

---

## Triage unified log results

After fetching logs, follow this order:

```bash
# 1. Row count
jq '.rows | length' /tmp/trace-logs.json

# 2. Per-source counts
jq '[.rows[].source] | group_by(.) | map({source: .[0], n: length})' /tmp/trace-logs.json

# 3. Non-fatal reader/schema notices
jq '.warnings' /tmp/trace-logs.json

# 4. Backend errors first, then agent, then app
jq -r '.rows[] | select(.source=="backend" and .severity=="ERROR") | "\(.timestamp) \(.body)"' /tmp/trace-logs.json | head -20
```

### Symptom guide

| What you see | Likely meaning | Next step |
|--------------|----------------|-----------|
| `rows` empty + `warnings` non-empty | Parquet reader/schema mismatch (e.g. stale backend image) | Rebuild sp-backend; confirm API rows use `source` not `sp.source` |
| `rows` empty + `warnings` empty | Wrong `trace_id`, narrow window, or ingest lag | Use replay case `traceId`; widen `[since, until)`; rerun replay |
| Rows from `agent`, `app`, and `backend` | Pipeline healthy for that trace | Read `body` for ERROR/WARN; use `sp diagnose` diffs for compare failures |
| Only `backend`, no `app`/`agent` | Agent export or app logging quiet | Check agent attach, `sp.enable.debug`, app logger levels |

Recording-phase and replay-phase lines for the **same business request** share one **`trace_id`** on replay (recorded trace reused on `traceparent`). A single trace lookup can include both without `--include-recording-log` (removed in v1).

---

## Reading the response

**`--json` / API** top-level fields:

- `lookup` — type `trace`, value, and caller `[since, until)` bounds
- `rows[]` — each row: `timestamp`, `severity`, `body`, `service_name`, `source`, and optional `trace_id`, `span_id`, `replay_id`, `plan_id`, `plan_item_id`
- `warnings` — non-fatal schema-skip or similar (may be empty)

v1 responses do **not** include `source_summary`. Compute per-source counts locally with `jq` (see above).

See [Log query fields](/en/cli/commands/log-query-fields.md) for the full field reference.

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

2. curl GET /api/recorder/logs?trace_id=<traceId>&since=…&until=…
      → triage: count → sources → warnings → read backend/agent/app bodies

3. sp diagnose replay <planId> --failed-only --out-dir .sp-work --json
      → read diff artifacts for field-level compare failures

4. If logs empty after clean Parquet: rerun replay/e2e and poll ingest
```

---

## API equivalent

```http
GET /api/recorder/logs?trace_id=<id>&since=<ts>&until=<ts>
```

Unsupported query parameters (`replay_id`, `plan_id`, `plan_item_id`, `include_recording_log`, …) are rejected before Parquet reads.

See [sp logs](/en/cli/commands/logs.md) for validation rules and JSON shape.

---

## Related

- [Concepts — replay plans and ids](./concepts.md#trace-replay-and-plan-ids)
- [Diagnose replay failure example](/en/cli/examples/agent-diagnose-replay.md)
- [sp replay case](/en/cli/commands/replay-case.md)
- [sp trace](/en/cli/commands/trace.md)
