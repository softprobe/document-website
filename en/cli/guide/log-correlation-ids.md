# Log correlation IDs

When a replay fails, you need **platform ids** to pull correlated logs from the application under test, the Java agent, and sp-backend in one query. This page explains what each id means, **where to find it**, and **which lookup to run**.

Requires the unified log pipeline (Vector → Parquet) enabled in your deployment or local compose stack. If the pipeline is disabled, `sp recorder logs` fails fast with a clear error — it does not fall back to other log stores.

**Command reference:** [sp recorder logs](/en/cli/commands/recorder.md)

---

## ID quick reference

| ID | Log lookup flag | What it identifies | Use for log search |
|----|-----------------|--------------------|--------------------|
| **`replayId`** | `--replay-id` | One replay **attempt** of a recorded case | **Start here** — narrowest key for a single failure |
| **`traceId`** | `--trace-id` | W3C OpenTelemetry trace for one request flow | When you have a trace but no replay id, or you need all traffic on that trace |
| **`planId`** | `--plan-id` | A replay **plan** (batch job from `sp replay run`) | Scan logs for every case in a plan run |
| **`planItemId`** | `--plan-item-id` | One **case/operation** inside a plan | Narrower than plan id when several cases ran in one batch |
| **`diffId`** | — | Compare/diff result row | **Not** a log lookup key — use with `sp replay diff get` |

Each log row also carries **`sp.source`**: `agent` (Java agent diagnostics), `app` (application-under-test logs captured by the agent), or `backend` (sp-backend diagnostics).

**Not in v1 log query results:** `sessionId` / `sp.session_id` — use `traceId` and `replayId` instead.

---

## Where to find each id

### `replayId` (primary)

| Source | How |
|--------|-----|
| Failed replay case list | `sp replay case list --plan <planId> --failed --json` → `data.items[].replayId` |
| Replay metadata | `sp replay metadata <replayId> --json` |
| Diagnose workflow | `sp diagnose replay <planId> --failed-only --json` → inspect failed cases |
| CI / `make e2e` | **Softprobe correlation** block under the pytest failure (field `replay_id`) |
| Example command in block | `log_query: sp recorder logs --replay-id … --since … --until … [--include-recording-log]` |

Copy `replayId` from the failure you care about. Two replays of the same recording always have **different** replay ids — searching by replay id avoids mixing attempts.

### `traceId`

| Source | How |
|--------|-----|
| Replay case list / metadata | Same commands as above → `traceId` |
| Recorded cases | `sp record case list --app <appId> --since -24h --json` → entry case trace ids |
| Business attributes | `sp trace find --app <appId> … --json` when the user gives order id, case id, etc. |
| Diagnose trace | `sp diagnose trace <traceId> --json` |
| E2e correlation block | Field `trace_id` per case |

`traceId` is broader than `replayId`: one trace can appear in recording and in one or more replays. Prefer **`replayId`** when diagnosing a specific replay failure.

### `planId`

| Source | How |
|--------|-----|
| Create replay | `sp replay run … --json` → `data.planId` |
| Monitor replay | `sp replay status <planId> --json` |
| Recent plans | `sp app replays <appId> --json` |
| E2e correlation block | Field `plan_id` |

Use **`planId`** when you need logs across **all cases** in a batch, not just one replay attempt.

### `planItemId`

| Source | How |
|--------|-----|
| Replay case list | `sp replay case list --plan <planId> --json` → plan item / operation id on each row |
| E2e correlation block | Field `plan_item_id` when present |

Use when a plan replayed many operations and you only want logs for **one case** in the plan.

---

## Query correlated logs

Every lookup requires **exactly one** id key plus a time window. Use **ISO-8601 UTC** timestamps for `--since` and `--until` (for example `2026-06-27T10:00:00Z`). `since` is **inclusive**; `until` is **exclusive** (`[since, until)`).

### Recommended: replay-id-first

```bash
sp recorder logs \
  --replay-id 6891fd300c676b31 \
  --since 2026-06-27T10:00:00Z \
  --until 2026-06-27T10:05:00Z
```

Add **`--include-recording-log`** when recording-time application or agent behavior may explain the replay failure. That flag is **replay-id only**; it adds record-phase rows that match the **single** linked record `traceId` for that replay (one replay maps to one recording). Default lookups return replay-phase rows only.

```bash
sp recorder logs \
  --replay-id 6891fd300c676b31 \
  --since 2026-06-27T09:55:00Z \
  --until 2026-06-27T10:05:00Z \
  --include-recording-log
```

### Other lookup keys

```bash
sp recorder logs --trace-id <traceId> --since <start> --until <end>
sp recorder logs --plan-id <planId> --since <start> --until <end>
sp recorder logs --plan-item-id <planItemId> --since <start> --until <end>
```

Add **`--json`** for scripts and AI agents. Human-readable text is the default.

### Picking `since` / `until`

1. Start with a window around the failure (for example five minutes before plan finish through one minute after).
2. Widen the window if `source_summary` shows zeros for a component you expect.
3. For `--include-recording-log`, extend `since` backward to cover recording time if needed.
4. v1 returns **all** matching rows in the window — redirect or pipe locally for large output:

```bash
sp recorder logs --replay-id <id> --since … --until … > /tmp/replay.log
sp recorder logs --replay-id <id> --since … --until … | grep ERROR
```

There is no `--limit` on v1 log lookups.

---

## Reading the response

Plain-text output lists **per-source row counts** for `agent`, `app`, and `backend` (including zeros), then a **single chronological** log stream.

With `--json`, expect:

- `lookup` — which key and time bounds were used
- `source_summary` — counts per `sp.source`
- `rows[]` — each row includes `timestamp`, `severity`, `body`, `service_name`, `sp.source`, and correlation fields when present (`trace_id`, `sp.replay_id`, `sp.plan_id`, `sp.plan_item_id`)

Filter mentally (or with `grep`) by `sp.source` when you only want application vs agent vs backend lines.

---

## Typical failure workflow

```text
1. sp replay case list --plan <planId> --failed --json
      → copy replayId (and traceId, planItemId)

2. sp recorder logs --replay-id <replayId> --since … --until …
      → scan agent / app / backend lines

3. If root cause may be recording-time behavior:
      sp recorder logs --replay-id <replayId> --since … --until … --include-recording-log

4. If replayId unknown but traceId known:
      sp recorder logs --trace-id <traceId> --since … --until …
```

For a bundled first pass on diffs and case ids, use [sp diagnose replay](/en/cli/commands/diagnose.md), then run `sp recorder logs` with ids from the failed cases.

---

## API equivalent

Same contract over HTTP (no separate auth for v1 on-prem lookups):

```http
GET /api/recorder/logs?replay_id=<id>&since=<ts>&until=<ts>
GET /api/recorder/logs?replay_id=<id>&since=<ts>&until=<ts>&include_recording_log=true
```

See [recorder commands](/en/cli/commands/recorder.md) for validation rules and JSON shape.

---

## Related

- [Concepts — replay plans and ids](./concepts.md#trace-replay-and-plan-ids)
- [Diagnose replay failure example](/en/cli/examples/agent-diagnose-replay.md)
- [sp replay case](/en/cli/commands/replay-case.md)
- [sp trace](/en/cli/commands/trace.md)
