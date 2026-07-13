# Metrics data plane

Softprobe metrics use the **same collector and Parquet store family as logs**: OTLP → Vector → one-minute aggregate → Parquet under a `metrics/` dataset → product HTTP query. This is for **ad-hoc diagnosis** (for example “are we receiving agent logs?”), not Prometheus/Grafana dashboards.

Requires chart **v4.3.x+** with the [unified log pipeline](./server#unified-log-pipeline) enabled (default). Metrics reuse that Vector Deployment — no second time-series database and no extra pods.

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

Bounded, read-only lookups over Softprobe Parquet under `metrics/`.

**Required query parameters:**

| Parameter | Description |
|-----------|-------------|
| `metric_name` | Metric name to select |
| `since` | ISO-8601 UTC inclusive |
| `until` | ISO-8601 UTC exclusive — window is `[since, until)` |

Optional exact-match filters on promoted label columns only: `status`, `kind`, `source`, `result`, `content_type`. High-cardinality selectors (`trace_id`, full URL, exception message) and non-catalog keys such as `app_id` are rejected.

There is **no** product row `limit` and **no** max time-span beyond requiring valid bounds (same spirit as log query). Missing partitions return HTTP 200 with empty `rows`.

```bash
curl -sS "$SP_API_URL/api/recorder/metrics?metric_name=sp.logs.ingest.requests&since=2026-07-10T18:00:00Z&until=2026-07-10T18:05:00Z"
```

Example success shape:

```json
{
  "lookup": {
    "metric_name": "sp.logs.ingest.requests",
    "windows": [{ "since": "2026-07-10T18:00:00Z", "until": "2026-07-10T18:05:00Z" }],
    "filters": {}
  },
  "rows": [
    {
      "timestamp": "2026-07-10T18:01:00Z",
      "metric_name": "sp.logs.ingest.requests",
      "metric_type": "sum",
      "service_name": "sp-backend",
      "value": 3,
      "status": "ok",
      "kind": "agent_json"
    }
  ],
  "warnings": []
}
```

Error bodies must not expose Parquet paths, bucket names, or storage credentials.

## Backend P0 catalog (R1)

Softprobe emits these series from the log ingest/forward path:

| Name | Meaning |
|------|---------|
| `sp.logs.ingest.requests` | Every `POST /v1/logs` attempt (`status`, `kind`) |
| `sp.logs.ingest.records` | Records after convert (`kind`, `source`) |
| `sp.logs.forward.results` | Export outcome (`success` / `failure` / `skipped_*`) |
| `sp.logs.forward.duration_ms` | Export timing histogram |

After Vector’s one-minute aggregate, expect queryable rows within about a minute (CI polls up to **70 seconds**).

## Out of scope

- Prometheus scrape, Grafana, or PromQL as the Softprobe product path
- `sp metrics` CLI (HTTP API is the R1 contract)
- Agent-side `sp.agent.logs.*` emitters (later round)
- Direct Parquet or storage credentials for end users
