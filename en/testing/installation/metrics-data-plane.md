# Metrics data plane

Softprobe metrics use the **same collector and Parquet store family as logs**: OTLP → Vector → one-minute aggregate → Parquet under a `metrics/` dataset (labels in an **`attributes` map**) → **bounded HTTP query and `sp metrics` CLI** backed by embedded DuckDB in sp-backend. This is for **ad-hoc diagnosis** (for example “are we receiving agent logs?”), not Prometheus/Grafana dashboards.

Requires chart **v4.3.x+** with the [unified log pipeline](./server.md#unified-log-pipeline) enabled (default). Metrics reuse that Vector Deployment — no second time-series database and no extra pods.

## Ingest — `POST /v1/metrics`

Clients POST OpenTelemetry metrics to Softprobe. sp-backend proxies to Vector when the telemetry pipeline is ready.

| Content-Type | Payload |
|--------------|---------|
| `application/x-protobuf` | OTLP `ExportMetricsServiceRequest` |
| `application/json` | OTLP metrics JSON (`resourceMetrics` …) |

**Accepted formats:** OTLP protobuf and OTLP JSON only. Softprobe does **not** accept a flat-JSON metrics dialect on this endpoint. OTLP JSON is accepted at Softprobe and forwarded to Vector as protobuf.

| Pipeline state | Response |
|----------------|----------|
| Ready | `200` after accept/proxy |
| Not ready | `503` — Softprobe does **not** return success while dropping data |

Example (OTLP JSON):

```bash
curl -sS -X POST "$SP_API_URL/v1/metrics" \
  -H 'Content-Type: application/json' \
  --data-binary @export-metrics.json
```

Instrumented backends also **emit** catalog counters in-process to the same Vector metrics path (no HTTP self-POST).

## Query — `GET /api/recorder/metrics` / `sp metrics`

Bounded, read-only lookups over Softprobe Parquet under `metrics/`. Softprobe runs **parameterized DuckDB SQL** server-side; callers never submit SQL or receive storage credentials for this simple API. **`sp metrics`** is the CLI form and uses the **same** `--since`/`--until`/`-f`/`schema` grammar as [`sp logs`](/en/testing/commands/logs.md) — see [sp metrics](/en/testing/commands/metrics.md) for the full command reference.

**Required query parameters:**

| Parameter | Description |
|-----------|-------------|
| `metric_name` (or `f.metric_name`) | Metric name to select — identity |
| `since` | ISO-8601 UTC inclusive |
| `until` | ISO-8601 UTC exclusive — window is `[since, until)` |

Optional `-f key=value` (HTTP `f.<key>=value`) filters resolve **promoted columns first** (`service_name`, `metric_type` — exact match), then fall back to the `attributes` map (for example `result`, `status`, `kind`). High-cardinality selectors (`trace_id`, full URL, exception message) are rejected. Softprobe does **not** require filters to be a fixed Parquet column list. Run `sp metrics schema` (or `GET /api/recorder/metrics/schema`) for the live filterable-field list.

There is **no** product row `limit` and **no** max time-span beyond requiring valid bounds (same spirit as log query). Missing partitions return HTTP 200 with empty `rows`. For OR/aggregate queries beyond exact-match `-f` filters, see [gated SQL](/en/testing/reference/gated-sql.md) (`POST /api/recorder/query`, HTTP only).

```bash
sp metrics --metric-name sp.logs.ingest.requests \
  --since 2026-07-10T18:00:00Z --until 2026-07-10T18:05:00Z -f status=ok --json

curl -sS "$SP_API_URL/api/recorder/metrics?metric_name=sp.logs.ingest.requests&since=2026-07-10T18:00:00Z&until=2026-07-10T18:05:00Z&f.status=ok"
```

Example success shape:

```json
{
  "lookup": {
    "metric_name": "sp.logs.ingest.requests",
    "windows": [{ "since": "2026-07-10T18:00:00Z", "until": "2026-07-10T18:05:00Z" }],
    "filters": { "status": "ok" }
  },
  "rows": [
    {
      "timestamp": "2026-07-10T18:01:00Z",
      "metric_name": "sp.logs.ingest.requests",
      "metric_type": "sum",
      "service_name": "sp-backend",
      "attributes": {
        "status": "ok",
        "kind": "agent_json"
      },
      "value": 3
    }
  ],
  "warnings": []
}
```

Error bodies must not expose Parquet paths, bucket names, storage credentials, or raw SQL.

## Backend P0 catalog (R1)

Softprobe emits these series from the log ingest/forward path (labels stored under `attributes`):

| Name | Meaning |
|------|---------|
| `sp.logs.ingest.requests` | Every `POST /v1/logs` attempt (`status`, `kind`) |
| `sp.logs.ingest.records` | Records after convert (`kind`, `source`) |
| `sp.logs.forward.results` | Export outcome (`success` / `failure` / `skipped_*`) |
| `sp.logs.forward.duration_ms` | Export timing histogram |

After Vector’s one-minute aggregate, expect queryable rows within about a minute (CI polls up to **70 seconds**).

## Agent log-export health (R2)

The Softprobe Java agent emits log-export health metrics to `{sp.api.url}/v1/metrics` (Softprobe API product path). If logs use the optional direct Vector **agent JSON** override (`…:4320/v1/logs`), health metrics still go to Softprobe `{sp.api.url}/v1/metrics` — port `4320` does not accept metrics. Only a true OTLP HTTP logs override (for example `…:4318/v1/logs`) may use a sibling `/v1/metrics` when `sp.api.url` is unset. Labels are stored under the same `attributes` map — query them with the filters above (for example `result=success`).

| Name | Meaning |
|------|---------|
| `sp.agent.logs.exporter.init` | Once at exporter init (`result` = `ok` / `disabled` / `error`) |
| `sp.agent.logs.enqueue` | Each enqueue attempt (`result`, `log_source`) |
| `sp.agent.logs.export` | Each send-batch attempt (`result`, `http_status_class`) |
| `sp.agent.logs.export.batch_size` | Batch size histogram |
| `sp.agent.logs.circuit_open` | Circuit breaker opened |

**Diagnosing “no agent logs”:** compare agent `sp.agent.logs.export` with backend `sp.logs.ingest.*` for the same time window. If init is `disabled`, set `sp.api.url` (or the logs OTLP override). If enqueue shows `dropped_*`, the agent is dropping before the wire. If export shows `http_error` / `5xx`, Softprobe or the pipeline is not ready. If export is `success` but ingest is empty, check URL/path mismatch. See [Java agent](/en/testing/java-agent#log-export-health-metrics).

```bash
sp metrics --metric-name sp.agent.logs.export \
  --since 2026-07-10T18:00:00Z --until 2026-07-10T18:05:00Z -f result=success --json

curl -sS "$SP_API_URL/api/recorder/metrics?metric_name=sp.agent.logs.export&since=2026-07-10T18:00:00Z&until=2026-07-10T18:05:00Z&f.result=success"
```

## Out of scope

- Prometheus scrape, Grafana, Greptime, or PromQL as the Softprobe product path
- Open client SQL / DuckDB as an ingest server — bounded ad-hoc SQL is available only via [gated SQL](/en/testing/reference/gated-sql.md) (`POST /api/recorder/query`), not as an ingest path or CLI SQL shell
- Direct Parquet or storage credentials for end users
