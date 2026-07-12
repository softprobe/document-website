# Metrics data plane

Softprobe metrics use the **same collector and Parquet store family as logs**: OTLP → Vector → one-minute aggregate → Parquet under a `metrics/` dataset (labels in an **`attributes` map**) → **bounded HTTP query** backed by embedded DuckDB in sp-backend. This is for **ad-hoc diagnosis** (for example “are we receiving agent logs?”), not Prometheus/Grafana dashboards.

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

## Query — `GET /api/recorder/metrics`

Bounded, read-only lookups over Softprobe Parquet under `metrics/`. Softprobe runs **parameterized DuckDB SQL** server-side; callers never submit SQL or receive storage credentials.

**Required query parameters:**

| Parameter | Description |
|-----------|-------------|
| `metric_name` | Metric name to select |
| `since` | ISO-8601 UTC inclusive |
| `until` | ISO-8601 UTC exclusive — window is `[since, until)` |

Optional exact-match filters apply to keys in the `attributes` map (for example `status=ok`). High-cardinality selectors (`trace_id`, full URL, exception message) are rejected. Softprobe does **not** require filters to be a fixed Parquet column list.

There is **no** product row `limit` and **no** max time-span beyond requiring valid bounds (same spirit as log query). Missing partitions return HTTP 200 with empty `rows`.

```bash
curl -sS "$SP_API_URL/api/recorder/metrics?metric_name=sp.logs.ingest.requests&since=2026-07-10T18:00:00Z&until=2026-07-10T18:05:00Z&status=ok"
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

The Softprobe Java agent emits log-export health metrics to `{sp.api.url}/v1/metrics` (same Softprobe API base as log export; an optional direct logs OTLP override uses the sibling `/v1/metrics` path). Labels are stored under the same `attributes` map — query them with the filters above (for example `result=success`).

| Name | Meaning |
|------|---------|
| `sp.agent.logs.exporter.init` | Once at exporter init (`result` = `ok` / `disabled` / `error`) |
| `sp.agent.logs.enqueue` | Each enqueue attempt (`result`, `log_source`) |
| `sp.agent.logs.export` | Each send-batch attempt (`result`, `http_status_class`) |
| `sp.agent.logs.export.batch_size` | Batch size histogram |
| `sp.agent.logs.circuit_open` | Circuit breaker opened |

**Diagnosing “no agent logs”:** compare agent `sp.agent.logs.export` with backend `sp.logs.ingest.*` for the same time window. If init is `disabled`, set `sp.api.url` (or the logs OTLP override). If enqueue shows `dropped_*`, the agent is dropping before the wire. If export shows `http_error` / `5xx`, Softprobe or the pipeline is not ready. If export is `success` but ingest is empty, check URL/path mismatch. See [Java agent](/en/testing/java-agent#log-export-health-metrics).

```bash
curl -sS "$SP_API_URL/api/recorder/metrics?metric_name=sp.agent.logs.export&since=2026-07-10T18:00:00Z&until=2026-07-10T18:05:00Z&result=success"
```

## Out of scope

- Prometheus scrape, Grafana, Greptime, or PromQL as the Softprobe product path
- Open client SQL / DuckDB as an ingest server
- `sp metrics` CLI (HTTP API is the product contract)
- Direct Parquet or storage credentials for end users
