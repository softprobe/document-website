# Unified log pipeline (on-prem)

Enable correlated log ingest, Parquet storage, and trace-id query (`sp logs` / `GET /api/recorder/logs`) from the `sp-backend` Helm chart.

**Prerequisites:** `logPipeline.enabled: true` on a healthy `sp-backend` release. Instrumented apps need the Vector OTLP log endpoint (see below).

## Enable in Helm

```yaml
logPipeline:
  enabled: true
  storage:
    backend: local   # or s3
  parquet:
    storageSize: 50Gi
    localRoot: /data/parquet/logs
  retention:
    ttlDays: 30              # optional — enables TTL prune CronJob
    cleanupSchedule: "0 3 * * *"
  compaction:
    enabled: true            # local storage only
    schedule: "15 * * * *"   # merges closed hours into part-hourly.parquet
```

After upgrade, verify Vector and sp-backend pods are running, then run a canned lookup:

```bash
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

When this property is set, correlated application and agent logs export during record and replay. Legacy capture flags (`sp.record.user.log`, `sp-capture-log`, etc.) are not used.

## Storage modes

| Mode | `logPipeline.storage.backend` | Write path | Query path |
|------|------------------------------|------------|------------|
| **Local PVC** (default) | `local` | Vector → in-cluster Parquet PVC | sp-backend reads mounted volume |
| **S3-compatible** | `s3` | Vector → your bucket (AWS S3, MinIO, GCS S3 interop, Azure via S3 API) | sp-backend reads via S3 API |

### Local disk

- Chart deploys a Parquet PVC (size `logPipeline.parquet.storageSize`).
- **Backup:** snapshot the PVC or copy `logPipeline.parquet.localRoot` while Vector is quiesced.
- **Retention:** set `logPipeline.retention.ttlDays` to enable an optional prune CronJob.
- **Compaction:** hourly DuckDB CronJob (`duckdb/duckdb` image) merges minute files into `part-hourly.parquet` per closed hour (reduces query file count).

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
- **Retention:** set `ttlDays` to enable S3 object prune CronJob (uses object last-modified time).
- **Compaction:** not automated for S3 in v2 — use minute-level files or add an external compaction job; local-mode compaction CronJob does not run for `backend: s3`.

End users and Agent Skills **must not** receive bucket credentials — query only through `sp logs` / API.

## Maintenance jobs

| CronJob | When | What |
|---------|------|------|
| `*-retention` | `ttlDays` set | Deletes Parquet files/objects older than TTL |
| `*-compaction` | `compaction.enabled` + `backend: local` | DuckDB CronJob merges previous hour's minute files → `part-hourly.parquet` |

Both are opt-in (retention requires `ttlDays`; compaction defaults on for local storage).

## Out of scope

- Native Azure Blob SDK (use S3-compatible endpoint).
- Iceberg, ad hoc SQL, direct Parquet access for end users.
- Dual-write to local PVC and S3.

## Related

- [sp-backend Helm install](./sp-backend-helm.md)
- [sp logs command](/en/cli/commands/logs.md)
- [Log correlation IDs](/en/cli/guide/log-correlation-ids.md)
