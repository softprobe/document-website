# Unified log pipeline (Helm)

Enable correlated log ingest, Parquet storage, and trace-id query (`sp logs` / `GET /api/recorder/logs`) from the **sp-backend** Helm chart.

**Prerequisites:** a healthy `sp-backend` release and a chart version that includes `logPipeline` (v4.3.x+). Instrumented workloads need the in-cluster Vector OTLP log endpoint (see [Agent OTLP export](#agent-otlp-export)).

## What the chart deploys

When `logPipeline.enabled: true`, Helm adds:

| Resource | Purpose |
|----------|---------|
| **Vector** (`{release}-log-vector`) | OTLP log ingest (gRPC/HTTP + agent JSON on `:4320`) |
| **rclone sidecar** (local mode only) | S3-over-filesystem gateway so Vector writes Parquet via `aws_s3` sink |
| **Parquet PVC** (local mode only) | Durable storage shared by Vector, sp-backend, compaction, and retention |
| **Compaction CronJob** (local mode) | Merges closed-hour minute files → `part-hourly.parquet` (DuckDB) |
| **Retention CronJob** (optional) | Prunes Parquet older than `ttlDays` |

sp-backend is wired for Parquet reads and exports its own diagnostic logs when the pipeline is enabled (`OTEL_ENABLED=true`, `OTEL_LOGS_EXPORTER=otlp-filtered`).

## Enable in Helm

Add to your values file (or `--set` on install/upgrade):

```yaml
logPipeline:
  enabled: true
  storage:
    backend: local   # or s3
  parquet:
    storageSize: 100Gi
    # storageClass: managed-csi   # optional — cluster default if omitted
  retention:
    ttlDays: 30              # set "" to disable retention CronJob
    cleanupSchedule: "0 3 * * *"
  compaction:
    enabled: true            # local storage only
    schedule: "15 * * * *"   # previous closed UTC hour
  # Pin Vector + maintenance jobs to the same node pool as sp-backend when using taints:
  placement:
    nodeSelector:
      workload: softprobe-backend
    tolerations:
      - key: workload
        operator: Equal
        value: backend
        effect: NoSchedule
```

Example upgrade on an existing release:

```bash
helm upgrade softprobe softprobe/sp-backend \
  --version 4.3.8 \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.8 \
  --set logPipeline.enabled=true
```

Pin **`image.tag`** to a semver release (for example `v4.3.9`), not `latest`, so the backend matches your chart version.

### Verify

```bash
kubectl get pods,cronjob,pvc -n softprobe | grep -E 'log-vector|log-parquet|compaction|retention'
kubectl port-forward -n softprobe svc/softprobe-sp-backend 8090:8090
```

Run a canned lookup (replace trace id and bounds):

```bash
export SP_API_URL=http://127.0.0.1:8090
sp logs --trace-id <32-hex> --since 2026-06-27T10:00:00Z --until 2026-06-27T10:05:00Z
```

Or:

```bash
curl -s "$SP_API_URL/api/recorder/logs?trace_id=<id>&since=2026-06-27T10:00:00Z&until=2026-06-27T10:05:00Z"
```

v1 has **no** dedicated pipeline health API — a successful trace-id lookup confirms ingest, storage, and query wiring.

## Agent OTLP export

Point the Java agent at the in-cluster Vector JSON log ingest URL:

```text
-Dsp.otel.exporter.otlp.log.endpoint=http://<release>-log-vector.<namespace>.svc.cluster.local:4320/v1/logs
```

For release `softprobe` in namespace `softprobe`:

```text
http://softprobe-log-vector.softprobe.svc.cluster.local:4320/v1/logs
```

When this property is set, correlated application and agent logs export during record and replay. Legacy capture flags (`sp.record.user.log`, `sp-capture-log`, `sp.user.log.level`, etc.) are not used in v1.

## Storage modes

| Mode | `logPipeline.storage.backend` | Write path | Query path |
|------|------------------------------|------------|------------|
| **Local PVC** (default) | `local` | Vector → Parquet PVC | sp-backend reads mounted volume |
| **S3-compatible** | `s3` | Vector → your bucket | sp-backend reads via S3 API |

### Local disk

**Layout (fixed by chart — do not reconfigure paths):**

- PVC is mounted at `/data/parquet` on Vector, sp-backend, compaction, and retention pods.
- Parquet hive partitions live under `/data/parquet/logs/`:
  - Minute files: `year=YYYY/month=MM/day=DD/hour=HH/minute=mm/part-<epoch>-<uuid>.parquet`
  - After compaction: `year=.../hour=HH/part-hourly.parquet` (minute dirs for that hour removed)

**Compaction:** the hourly CronJob (`logPipeline.compaction`) reads all `minute=*/part-*.parquet` for the **previous closed UTC hour**, writes `part-hourly.parquet`, then deletes the minute files. sp-backend prefers the hourly file when present for that hour.

**Image:** `softprobe/duckdb:1.1.3` from Docker Hub (`linux/amd64`). For Apple Silicon dev clusters, build/load an `arm64` image locally (`make duckdb-image DUCKDB_PLATFORM=linux/arm64`) and override `logPipeline.compaction.image`.

**Backup:** snapshot the `{release}-log-parquet` PVC or copy files under the PVC while Vector is quiesced.

**Retention:** `logPipeline.retention.ttlDays` (default `30`) enables a prune CronJob. Set `ttlDays: ""` to disable.

### S3-compatible object storage

```yaml
logPipeline:
  enabled: true
  storage:
    backend: s3
    s3:
      bucket: my-softprobe-logs
      endpoint: https://s3.amazonaws.com          # or MinIO / GCS / Azure S3 endpoint
      region: us-east-1
      forcePathStyle: true                        # usually true for MinIO
      prefix: ""                                  # optional key prefix
      existingSecret: softprobe-log-s3-credentials
      secretAccessKeyIdField: access-key-id
      secretSecretAccessKeyField: secret-access-key
```

Create the secret:

```bash
kubectl create secret generic softprobe-log-s3-credentials \
  --from-literal=access-key-id='AKIA...' \
  --from-literal=secret-access-key='...' \
  -n softprobe
```

- **No Parquet PVC** is created when `backend: s3`.
- **Retention:** set `ttlDays` to enable S3 object prune (uses last-modified time).
- **Compaction:** not automated for S3 in v1 — the local DuckDB CronJob is not deployed for `backend: s3`.

End users and Agent Skills **must not** receive bucket credentials — query only through `sp logs` / `GET /api/recorder/logs`.

## Helm values reference

| Value | Description |
|-------|-------------|
| `logPipeline.enabled` | Deploy Vector, storage, and query wiring (default `false` on fresh chart defaults) |
| `logPipeline.storage.backend` | `local` (PVC) or `s3` |
| `logPipeline.parquet.storageSize` / `storageClass` | Local Parquet PVC size and class |
| `logPipeline.vector.image` | Vector image (default `timberio/vector:0.56.0-debian`) |
| `logPipeline.vector.resources` | CPU/memory for Vector (+ rclone sidecar in local mode) |
| `logPipeline.otlp.httpPort` / `grpcPort` / `agentJsonPort` | OTLP ports (defaults `4318` / `4317` / `4320`) |
| `logPipeline.retention.ttlDays` | Prune TTL in days; `""` disables retention CronJob |
| `logPipeline.retention.cleanupSchedule` | Retention CronJob schedule (default `0 3 * * *`) |
| `logPipeline.compaction.enabled` / `schedule` / `image` | Local hourly compaction (default on, `15 * * * *`, `softprobe/duckdb:1.1.3`) |
| `logPipeline.placement` | `nodeSelector` / `tolerations` / `affinity` for Vector and maintenance CronJobs |
| `logPipeline.agentLogEndpointProperty` | Documented JVM property: `sp.otel.exporter.otlp.log.endpoint` |

`logPipeline.parquet.localRoot` exists in chart defaults (`/data/parquet/logs`) and must stay aligned with the rclone bucket layout — operators normally **do not** override it.

## Maintenance jobs

| CronJob | When | What |
|---------|------|------|
| `{release}-log-vector-retention` | `ttlDays` set | Deletes Parquet files/objects older than TTL |
| `{release}-log-vector-compaction` | `compaction.enabled` + `backend: local` | DuckDB merges previous hour's `part-*.parquet` → `part-hourly.parquet` |

Check last run:

```bash
kubectl get cronjob,jobs -n softprobe -l 'app.kubernetes.io/component=log-pipeline-maintenance'
kubectl logs -n softprobe job/<compaction-job-name>
```

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Empty `GET /api/recorder/logs` but data expected | Partial `part-hourly.parquet` from interrupted compaction — delete hourly file or wait for next compaction; confirm minute `part-*.parquet` files exist |
| Vector pod not ready | `kubectl logs -n softprobe deploy/<release>-log-vector -c vector` |
| Compaction `ImagePullBackOff` on arm64 | Override `logPipeline.compaction.image` with a local `arm64` build |
| Agent logs missing | `sp.otel.exporter.otlp.log.endpoint` must reach Vector `:4320`; trace must have `trace_id` on export |
| sp-backend logs missing | `logPipeline.enabled` auto-enables OTLP export on sp-backend |

## Out of scope (v1)

- Native Azure Blob SDK (use S3-compatible endpoint).
- Iceberg, ad hoc SQL, direct Parquet access for end users.
- Dual-write to local PVC and S3.
- Dedicated log-pipeline health/status API.

## Related

- [sp-backend Helm install](./sp-backend-helm.md)
- [sp logs command](/en/cli/commands/logs.md)
- [Log correlation IDs](/en/cli/guide/log-correlation-ids.md)
