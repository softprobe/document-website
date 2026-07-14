# sp metrics

**When agents use this:** Retrieve Softprobe product metrics (backend log-pipeline health, agent log-export health, and other emitted series) by `metric_name` and time window — same filter grammar as [`sp logs`](./logs.md), without direct Parquet access or storage credentials. For Softprobe agent export + chart workflows, see [Agent telemetry export + chart](/en/testing/examples/agent-telemetry-export-chart.md).

**Prerequisite:** Unified log pipeline enabled (metrics reuse the same Vector Deployment and Parquet store family as logs, under a `metrics/` dataset). See [Metrics data plane](/en/testing/installation/metrics-data-plane.md).

Simple lookups are **canned, bounded queries** (DuckDB-backed) — no free-form SQL. For OR/aggregate queries beyond exact-match filters, use [gated SQL](/en/testing/reference/gated-sql.md) (`POST /api/recorder/query`, HTTP only — not a `sp metrics` flag).

**API:** `GET /api/recorder/metrics?since=…&until=…&metric_name=…[&f.key=value ...]` on sp-backend. Top-level **`sp metrics`** uses the same contract and mirrors `sp logs`' grammar so both commands speak one filter dialect.

---

## Synopsis

```bash
sp metrics --metric-name <name> --since <time> --until <time> [-f key=value ...] [--json]
sp metrics schema [--since <time> --until <time>] [--json]
```

## Flags

| Flag | Required | Description |
|------|----------|-------------|
| `--metric-name` | Yes | Metric name identity (e.g. `sp.agent.logs.export`); may combine with `-f metric_name=` (values must match) |
| `-f`, `--filter` | No | Repeatable `key=value` filter, AND'd with identity (e.g. `-f result=success`). May also express identity (`-f metric_name=…`) |
| `--since` | Yes | Inclusive lower bound — ISO-8601 UTC |
| `--until` | Yes | Exclusive upper bound — ISO-8601 UTC |
| `--json` | No | Stable JSON envelope for automation and Agent Skills |

Rules:

- **`--since`** and **`--until`** are required for every lookup. Time range is half-open: `[since, until)`.
- **`--metric-name`** is required (via the flag and/or `-f metric_name=`) — unlike `sp logs`' at-least-one-of `trace_id`/`source`, metrics identity has exactly one required key.
- `-f` filters resolve **promoted columns first** (`service_name`, `metric_type` — exact match), then fall back to the `attributes` MAP (e.g. `result`, `status`, `kind`, `log_source`, `http_status_class`). High-cardinality selectors (`trace_id`, full URLs, exception messages, …) are rejected as filters. Run `sp metrics schema` to see the current allowlist and observed `attributes` keys for a window.
- No `--limit` or row truncation on the simple API. [Gated SQL](/en/testing/reference/gated-sql.md) applies a documented row cap instead.
- No authentication is required for simple metrics lookups when you can reach the deployment endpoint.
- When the log pipeline is disabled or query dependencies are unavailable, the command fails fast with a clear error.

---

## Examples

```bash
# Agent log-export health for a window — narrow the window to the incident
sp metrics --metric-name sp.agent.logs.export \
  --since 2026-06-27T10:00:00Z --until 2026-06-27T10:05:00Z \
  -f result=success --json

# Same identity expressed via -f
sp metrics --since 2026-06-27T10:00:00Z --until 2026-06-27T10:05:00Z \
  -f metric_name=sp.agent.logs.export -f result=success

# Backend log ingest health
sp metrics --metric-name sp.logs.ingest.requests \
  --since 2026-06-27T10:00:00Z --until 2026-06-27T10:05:00Z -f status=ok

# Discover filterable fields (and, with bounds, observed attributes keys)
sp metrics schema --json
sp metrics schema --since 2026-06-27T10:00:00Z --until 2026-06-27T10:05:00Z --json
```

Reading agent log-export health alongside backend ingest health for the same window is the standard diagnosis pattern — see [Agent log-export health](/en/testing/installation/metrics-data-plane.md#agent-log-export-health-r2).

---

## Output

**Human (default):** Chronological metric datapoints — timestamp, `metric_name`, `service_name`, value (or histogram fields), and resolved `attributes`.

**`--json`:** Same logical data in the standard CLI envelope (`ok`, `command`, `data`). Top-level `data` fields:

| Field | Meaning |
|-------|---------|
| `lookup` | Resolved `metric_name`/filters and caller `[since, until)` bounds |
| `rows` | Metric datapoints |
| `warnings` | Non-fatal schema-skip or similar notices (may be empty) |

### JSON output

```json
{
  "ok": true,
  "command": "metrics",
  "data": {
    "lookup": {
      "windows": [
        { "since": "2026-06-27T10:00:00Z", "until": "2026-06-27T10:05:00Z" }
      ],
      "filters": {
        "metric_name": "sp.agent.logs.export",
        "result": "success"
      }
    },
    "rows": [
      {
        "timestamp": "2026-06-27T10:01:00Z",
        "metric_name": "sp.agent.logs.export",
        "metric_type": "sum",
        "service_name": "travel-ota",
        "attributes": { "result": "success", "http_status_class": "2xx" },
        "value": 12
      }
    ],
    "warnings": []
  }
}
```

Histogram rows include array fields (`bucket_counts`, `explicit_bounds`, `count`, `sum`, `min`, `max`) instead of `value`.

### JSON errors

```json
{
  "ok": false,
  "command": "metrics",
  "error": {
    "code": "API_ERROR",
    "message": "API error 1: metric_name is required",
    "httpStatus": 200,
    "backend": {
      "responseCode": 1,
      "responseDesc": "metric_name is required"
    }
  }
}
```

Example validation messages: `metric_name is required`, `since is required`, `until is required`, `since must be before until`, `since and until must be ISO-8601 UTC timestamps`, `unsupported metrics query parameter: <name>`, `log pipeline is disabled`, `log pipeline is unavailable`.

---

## REST mapping

| CLI | Method | Path |
|-----|--------|------|
| `--metric-name` | GET | `/api/recorder/metrics?metric_name=<name>&since=<ts>&until=<ts>` |
| `-f key=value` (non-identity) | GET | `/api/recorder/metrics?...&f.<key>=<value>` |
| `schema` | GET | `/api/recorder/metrics/schema[?since=<ts>&until=<ts>]` |

No authentication required, matching simple log query openness.

---

## Out of scope

- SQL text / `--sql` on `sp metrics` itself — gated SQL is **HTTP only** (`POST /api/recorder/query`)
- `--limit` / row truncation on the simple API — narrow time bounds, filter locally, or use [gated SQL](/en/testing/reference/gated-sql.md)
- Prometheus scrape, Grafana, or PromQL as the Softprobe product path
- Live multi-panel dashboards / alerting

---

## Related

- [sp logs](./logs.md) — same `-f`/identity/`schema` grammar for logs
- [Gated SQL](/en/testing/reference/gated-sql.md) — bounded ad-hoc SQL over `logs`/`metrics` when exact-match filters aren't enough
- [Metrics data plane](/en/testing/installation/metrics-data-plane.md) — ingest, backend P0 catalog, agent log-export health series
