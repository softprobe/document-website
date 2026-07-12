# Gated SQL (`POST /api/recorder/query`)

Bounded, read-only DuckDB SQL over Softprobe's `logs` and `metrics` Parquet datasets — for humans and AI assistants who need filters beyond exact-match `-f key=value` (OR conditions, aggregates, joins, or body/message search). No object-store credentials, no growing per-label CLI flag list.

**HTTP only.** There is no `sp logs --sql` or `sp metrics --sql` — SQL is not a flag on the query commands. See [Simple query vs gated SQL](#simple-query-vs-gated-sql) below for when to reach for this instead of [`sp logs`](/en/testing/commands/logs.md) / [`sp metrics`](/en/testing/commands/metrics.md).

---

## Simple query vs gated SQL

| Use | Surface |
|-----|---------|
| Routine diagnosis — trace lookup, source-mode lookup, or any single exact-match label | [`sp logs`](/en/testing/commands/logs.md) / [`sp metrics`](/en/testing/commands/metrics.md) with `-f` — **no row cap**, but **narrow the window** yourself |
| Discover which fields are filterable | `sp logs schema` / `sp metrics schema` |
| OR conditions, aggregates, joins, or non-exact predicates (e.g. body/message search) | **Gated SQL** (this page) — row cap applies |
| SQL on the CLI | **Not available** — no `sp logs --sql` / `sp metrics --sql` |

## Endpoint

```http
POST /api/recorder/query
Content-Type: application/json
```

```json
{
  "dataset": "logs",
  "sql": "SELECT timestamp, source, body FROM logs WHERE source = 'agent' ORDER BY timestamp",
  "since": "2026-07-11T10:00:00Z",
  "until": "2026-07-11T10:05:00Z"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `sql` | yes | Exactly one `SELECT` (or `WITH … SELECT`) statement |
| `since` / `until` | yes | Explicit bounds envelope, `[since, until)` — Softprobe does **not** rewrite `sql` to inject bounds |
| `dataset` | no | Hint only; the SQL text itself must still reference the `logs` or `metrics` view |

### Response

```json
{
  "rows": [ { "timestamp": "…", "source": "agent", "body": "…" } ],
  "warnings": [],
  "truncated": false
}
```

Row-oriented JSON, convenient for `jq` and other automation. If the result would exceed the row cap, the request **fails fast** — Softprobe does not silently truncate and set `truncated: true`.

## Views

| View | Dataset | Notes |
|------|---------|-------|
| `logs` | `logs/` hive Parquet | Promoted columns (see [Log query fields](/en/testing/commands/logs.md#related)) + `attributes` MAP (empty/absent on legacy files) |
| `metrics` | `metrics/` hive Parquet | Metrics schema + `attributes` MAP |

Query only through these views. Raw filesystem/S3 paths, `read_parquet(...)` with arbitrary URIs, and `ATTACH`/`INSTALL` of external databases are rejected.

## Hard limits (fail fast, not silent)

| Limit | Value |
|-------|-------|
| Time bounds | Required on every request (`since`/`until` fields). Requests without enforceable bounds are rejected — Softprobe never silently rewrites SQL to add them. |
| Statement shape | Exactly one statement; `SELECT` / `WITH … SELECT` only. DDL/DML (`INSERT`, `UPDATE`, `DELETE`, `CREATE`, `DROP`, `ALTER`, `COPY`, `ATTACH`, `INSTALL`, `LOAD`, `PRAGMA`) and multi-statement batches are rejected. |
| Row cap | **10,000** rows. Exceeding the cap fails the request with a clear error rather than returning a partial or unbounded dump. |
| Timeout | **30 seconds** per query. |
| Memory | **256 MiB** DuckDB memory bound per query session. |
| Errors | Never include Parquet paths, object-store URLs, or credentials. |

## Recipes

```bash
# Source-mode diagnosis via SQL (equivalent to sp logs --source agent -f severity=ERROR)
curl -sS -X POST "$SP_API_URL/api/recorder/query" \
  -H "Content-Type: application/json" \
  -d "{
    \"sql\": \"SELECT timestamp, source, severity, logger_name, body FROM logs WHERE source = 'agent' AND severity = 'ERROR' ORDER BY timestamp\",
    \"since\": \"2026-06-27T10:00:00Z\",
    \"until\": \"2026-06-27T10:03:00Z\"
  }"

# Body/message search — not expressible via -f (default-deny on body)
curl -sS -X POST "$SP_API_URL/api/recorder/query" \
  -H "Content-Type: application/json" \
  -d "{
    \"sql\": \"SELECT timestamp, source, body FROM logs WHERE body ILIKE '%circuit%' ORDER BY timestamp\",
    \"since\": \"2026-06-27T10:00:00Z\",
    \"until\": \"2026-06-27T10:05:00Z\"
  }"

# Metrics aggregate over a MAP attribute
curl -sS -X POST "$SP_API_URL/api/recorder/query" \
  -H "Content-Type: application/json" \
  -d "{
    \"dataset\": \"metrics\",
    \"sql\": \"SELECT attributes['result'] AS result, count(*) FROM metrics WHERE metric_name = 'sp.agent.logs.export' GROUP BY 1\",
    \"since\": \"2026-06-27T10:00:00Z\",
    \"until\": \"2026-06-27T10:05:00Z\"
  }"
```

For the **same** window/filters and a result size **at or under the row cap**, the gated SQL recipe above and the equivalent simple-API call (`sp logs --source agent -f severity=ERROR`) return the **same row set**. Over the cap, gated SQL fails fast while the simple API may still return the full set — that is expected, not a bug: the simple API has no row cap, gated SQL does.

## Auth and SaaS blast radius

Gated SQL has **the same openness as the simple log/metrics query APIs** today — no authentication required to reach the endpoint, and Softprobe does **not** add a SQL-only auth requirement while the simple APIs stay open. If a future security round adds auth, it changes **both** surfaces together, not gated SQL alone.

Because source-mode simple queries and gated SQL both scan time-partitioned Parquet rather than a trace-selective index, a wide window is a real resource cost (tenant-local CPU/memory/IO) even though it's not a security bypass by itself. In a SaaS/multi-tenant deployment, an overly wide gated-SQL or source-mode query only costs the *querying tenant's* own resources — it does not read another tenant's data — but it can still be slow or hit the row cap / timeout. **Narrow the time window** for both surfaces; this is the primary cost control, not row limits alone.

## Out of scope

- Open PromQL / arbitrary multi-tenant SQL warehouse
- DuckDB as an ingest path
- Replacing `GET /api/recorder/logs` / `GET /api/recorder/metrics` — gated SQL is additive
- `sp logs --sql` / `sp metrics --sql` / any CLI SQL shell
- Prom-style boolean selectors or expression languages on `-f` (exact-match AND only there)

## Related

- [sp logs](/en/testing/commands/logs.md) · [sp metrics](/en/testing/commands/metrics.md) — simple query commands
- [Log correlation IDs](./log-correlation-ids.md) — trace/source diagnosis workflow and window-cost guidance
