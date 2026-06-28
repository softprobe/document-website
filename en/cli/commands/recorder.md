# sp recorder logs

**When agents use this:** Retrieve correlated application, agent, and sp-backend logs for a failed replay using platform ids — without direct access to Parquet files or storage credentials.

**Prerequisite:** Unified log pipeline enabled (Vector ingest + Parquet storage + query wiring). See [Log correlation IDs](/en/cli/guide/log-correlation-ids.md) for what each id means and where to find it.

Phase one is **canned id-based lookup only** — no SQL, no ad hoc query language, no `sp recorder info` health command in v1.

---

## Synopsis

```bash
sp recorder logs --replay-id <id> --since <time> --until <time> [--include-recording-log] [--json]
sp recorder logs --trace-id <id> --since <time> --until <time> [--json]
sp recorder logs --plan-id <id> --since <time> --until <time> [--json]
sp recorder logs --plan-item-id <id> --since <time> --until <time> [--json]
```

| Flag | Required | Description |
|------|----------|-------------|
| `--replay-id` | One lookup key | **Primary** troubleshooting key — one replay attempt |
| `--trace-id` | One lookup key | Secondary — all logs on a W3C trace |
| `--plan-id` | One lookup key | Secondary — all cases in a replay plan |
| `--plan-item-id` | One lookup key | Secondary — one case/operation in a plan |
| `--since` | Yes | Inclusive lower bound — ISO-8601 UTC (e.g. `2026-06-27T10:00:00Z`) |
| `--until` | Yes | Exclusive upper bound — ISO-8601 UTC |
| `--include-recording-log` | No | **Replay-id lookups only** — also include linked record-phase rows |
| `--json` | No | Stable JSON envelope for automation |

Exactly **one** lookup key per invocation. `--since` and `--until` are required for every lookup type.

---

## `--include-recording-log`

Optional on **`--replay-id`** lookups only.

| Flag | Behavior |
|------|----------|
| Omitted (default) | Rows with the requested `replayId` only (replay phase) |
| Present | Also includes record-phase rows matching the linked record `traceId` for that replay (one replay → one recording), within `[since, until)` |

If the flag is set but replay metadata cannot resolve a linked record trace, the command **succeeds** and returns replay-phase rows only.

Rejected when combined with `--trace-id`, `--plan-id`, or `--plan-item-id`.

---

## Examples

```bash
# Failed case from: sp replay case list --plan plan-xyz --failed --json
sp recorder logs \
  --replay-id 6891fd300c676b31 \
  --since 2026-06-27T10:00:00Z \
  --until 2026-06-27T10:05:00Z \
  --json

# Include recording-time logs when failure may originate at record time
sp recorder logs \
  --replay-id 6891fd300c676b31 \
  --since 2026-06-27T09:55:00Z \
  --until 2026-06-27T10:05:00Z \
  --include-recording-log

# Large result — redirect or pipe (no --limit in v1)
sp recorder logs --replay-id 6891fd300c676b31 --since … --until … > /tmp/replay.log
```

---

## Output

**Human (default):** Per-source row counts for `agent`, `app`, and `backend` (all three, including zeros), then one chronological log stream.

**`--json`:** Same logical data in the standard CLI envelope. Top-level fields include:

| Field | Meaning |
|-------|---------|
| `lookup` | Lookup type, value, and caller `[since, until)` bounds |
| `source_summary` | `{ "source": "agent"|"app"|"backend", "count": N }` |
| `rows` | Log lines with `timestamp`, `severity`, `body`, `service_name`, `sp.source`, correlation ids |

Rows do **not** include pytest labels, suite names, or test node ids.

---

## HTTP API

```http
GET /api/recorder/logs?replay_id=<id>&since=<ts>&until=<ts>
GET /api/recorder/logs?replay_id=<id>&since=<ts>&until=<ts>&include_recording_log=true
```

Hosted on the same sp-backend base URL as other `sp` commands. v1 log lookups do not require a separate API key when you can reach the deployment endpoint.

---

## Errors

Fails fast (validation error, not empty success) when:

- Zero or multiple lookup keys
- Missing or invalid `since` / `until`
- Unsupported flags
- Log pipeline disabled or unavailable

Example messages: `since is required`, `exactly one lookup key is required`, `log pipeline is disabled`, `include_recording_log is supported only with replay_id lookups`.

---

## Out of scope (v1)

- `sp recorder info` / pipeline health status commands
- `sp query` / `sp recorder query` SQL against Parquet
- Direct Parquet paths, catalog URLs, or object-store credentials
- `sp.session_id` in query results
- `--limit` / row truncation — narrow time bounds or filter locally instead

---

## Related

- [Log correlation IDs — find and use ids](/en/cli/guide/log-correlation-ids.md)
- [sp replay case](./replay-case.md)
- [sp diagnose replay](./diagnose.md)
- [Diagnose replay failure example](/en/cli/examples/agent-diagnose-replay.md)
