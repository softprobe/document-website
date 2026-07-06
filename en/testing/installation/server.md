---
title: Install Softprobe Server
---

# Install Softprobe Server

Install the unified Softprobe backend on Kubernetes with Helm. The chart deploys **Redis** in-cluster and either **bundled MongoDB** or connects to your **existing MongoDB** server.

Chart **v4.3.x+** also enables the [unified log pipeline](#unified-log-pipeline) by default (Vector, Parquet PVC, compaction). Fresh installs need only the MongoDB and encryption keys below — no separate `logPipeline` block required.

**Prerequisites:** Kubernetes 1.24+, Helm 3.x, GCR pull credentials from Softprobe, and `encryption.secretKey` for at-rest payload encryption.

For **bundled** MongoDB, your cluster needs a default or configured `StorageClass` for the MongoDB PVC.

## MongoDB modes (pick one)

Configure **exactly one** mode in your values file. `helm install` fails if both are set or neither is set.

| Mode | Set in values | Chart deploys MongoDB? |
|------|---------------|------------------------|
| **Bundled** | `mongodb.bundled.auth.password` | Yes — Deployment, Service, PVC |
| **External** | `mongodb.connectionString` | No |

**Shared external MongoDB:** multiple Helm releases can use one MongoDB host. Put a **unique database name** in each connection string (for example `acme_prod_sp_storage_db`).

Download the example values file for your chart version:

[values.example.yaml (v4.3.9)](https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/v4.3.9/values.example.yaml)

## Install

### 1. Helm repo and namespace

```bash
helm repo add softprobe \
  https://storage.googleapis.com/softprobe-published-files/helm/sp-backend
helm repo update

kubectl create namespace softprobe
```

### 2. GCR pull secret

```bash
kubectl create secret docker-registry softprobe-gcr-pull \
  --docker-server=https://gcr.io \
  --docker-username=_json_key \
  --docker-password="$(cat softprobe-registry-puller.json)" \
  --namespace softprobe
```

::: warning
Use both `gcr.io` and `https://gcr.io` auth entries. See the chart README if plain `kubectl create secret docker-registry` causes `ImagePullBackOff`.
:::

### 3. Values file

Copy the example to `values.yaml` and edit for your environment. **Pick one MongoDB block below.**

#### Mode A — Bundled MongoDB (in-cluster)

Chart deploys MongoDB 7 and Redis 7 alongside sp-backend.

```yaml
image:
  tag: "v4.3.9"
  pullSecrets:
    - name: softprobe-gcr-pull

mongodb:
  bundled:
    auth:
      password: "CHANGE_ME_mongo_password"
    # Optional: storageClass, storageSize, resources, placement — see values.example.yaml

encryption:
  enabled: true
  secretKey: "CHANGE_ME_base64_32_byte_key"
```

#### Mode B — External MongoDB

Use your existing MongoDB server. Do **not** set `mongodb.bundled.auth.password`.

```yaml
image:
  tag: "v4.3.9"
  pullSecrets:
    - name: softprobe-gcr-pull

mongodb:
  connectionString: "mongodb://USER:PASS@mongo.host:27017/your_release_sp_storage_db?authSource=admin"

encryption:
  enabled: true
  secretKey: "CHANGE_ME_base64_32_byte_key"
```

### 4. Helm install

Use the chart version and image tag from your Softprobe release (`v4.3.9` → chart `4.3.9`, image `v4.3.9`).

```bash
helm install softprobe softprobe/sp-backend \
  --version 4.3.9 \
  --namespace softprobe \
  -f values.yaml \
  --set image.tag=v4.3.9 \
  --set createNamespace=false
```

## Verify

```bash
kubectl get pods -n softprobe
kubectl port-forward -n softprobe svc/softprobe-sp-backend 8090:8090
curl -s http://127.0.0.1:8090/actuator/health
```

**Bundled mode:** expect pods for `mongodb`, `redis`, `sp-backend`, and (chart v4.3.x+) `log-vector`.

**External mode:** expect `redis`, `sp-backend`, and `log-vector` (no `{release}-mongo` pod).

## Upgrade an existing release

Use the same release name, namespace, and `values.yaml` you used at install. A Softprobe release tag maps to Helm as:

| Release tag | Chart `--version` | `image.tag` |
|-------------|-------------------|-------------|
| `v4.3.9` | `4.3.9` | `v4.3.9` |

### Before you upgrade

1. **Keep your existing `values.yaml`** — you do not need to replace it. Helm merges your file with the new chart defaults for any key you omitted.
2. **Older file without `logPipeline`?** If you installed on v4.3.5 or earlier with only `image`, `mongodb`, and `encryption`, bump `--version` and `image.tag` only. Missing keys inherit chart defaults — **`logPipeline.enabled` is `true`**, so Vector, the Parquet PVC (local mode), compaction, and retention are added on upgrade. Use `--dry-run` first to preview new resources.
3. **Review optional overrides** — download [values.example.yaml](https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/v4.3.9/values.example.yaml) for the target version and merge only what you need (PVC `storageClass`, `placement`, S3 backend). Do **not** change `encryption.secretKey` — existing encrypted payloads depend on it.
4. **Keep your MongoDB mode** — do not switch between bundled and external MongoDB on upgrade.
5. **Confirm registry access** — the `softprobe-gcr-pull` secret must still be valid for the new `image.tag`.
6. **Preview the diff** (optional):

```bash
helm repo update
helm upgrade softprobe softprobe/sp-backend \
  --version 4.3.9 \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.9 \
  --set createNamespace=false \
  --dry-run
```

### Upgrade from the Helm repo

Typical upgrade — same `values.yaml` as install, new chart and image version:

```bash
helm repo update
helm upgrade softprobe softprobe/sp-backend \
  --version 4.3.9 \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.9 \
  --set createNamespace=false
```

Replace `softprobe` with your release name if different. Pin **`image.tag`** to the semver release Softprobe gave you — not `latest`.

**Example — old values file, no `logPipeline` block:** your file still looks like this:

```yaml
image:
  tag: "v4.3.5"
  pullSecrets:
    - name: softprobe-gcr-pull
mongodb:
  bundled:
    auth:
      password: "your-existing-password"
encryption:
  enabled: true
  secretKey: "your-existing-key"
```

Upgrade command (no edits required):

```bash
helm upgrade softprobe softprobe/sp-backend \
  --version 4.3.9 \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.9 \
  --set createNamespace=false
```

Helm adds log-pipeline resources from chart defaults. After rollout, instrumented apps need only `sp.api.url`; agents discover the Vector log endpoint from `/api/config/agent/load` (see [Agent OTLP export](#agent-otlp-export)).

### Upgrade from a downloaded chart package

If you install offline or verify SHA-256 from GCS:

```bash
curl -fLO "https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/v4.3.9/sp-backend-4.3.9.tgz"

helm upgrade softprobe ./sp-backend-4.3.9.tgz \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.9 \
  --set createNamespace=false
```

### Verify after upgrade

```bash
kubectl rollout status -n softprobe deploy/softprobe-sp-backend
kubectl get pods -n softprobe
kubectl get pods,cronjob,pvc -n softprobe | grep -E 'log-vector|log-parquet|compaction|retention'
kubectl port-forward -n softprobe svc/softprobe-sp-backend 8090:8090
curl -s http://127.0.0.1:8090/actuator/health
```

Expect a rolling restart of `sp-backend` (and Redis if the chart template changed). Bundled MongoDB data on the existing PVC is preserved. `sp-backend` may take up to ~2 minutes to become ready after the new pod starts (JVM warm-up).

On v4.3.9+ you should also see `log-vector` and a `log-parquet` PVC (local storage). Point instrumented workloads at Vector:

```text
-Dsp.otel.exporter.otlp.log.endpoint=http://<release>-log-vector.<namespace>.svc.cluster.local:4320/v1/logs
```

### Customize or disable the log pipeline

The pipeline is **on by default**. Merge overrides from [values.example.yaml](https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/v4.3.9/values.example.yaml) only when you need non-default storage, placement, or S3:

```yaml
logPipeline:
  parquet:
    storageSize: 100Gi
    storageClass: managed-csi
```

To **disable** on upgrade, add before running `helm upgrade`:

```yaml
logPipeline:
  enabled: false
```

Full options: [Unified log pipeline](#unified-log-pipeline).

### Upgrade troubleshooting

| Symptom | Check |
|---------|--------|
| `ImagePullBackOff` after upgrade | New `image.tag` exists in GCR; `softprobe-gcr-pull` secret valid |
| `helm upgrade` fails on MongoDB | Still set **one** of `mongodb.connectionString` or `mongodb.bundled.auth.password` — do not clear both |
| New log Parquet PVC pending | Cluster `StorageClass` — set `logPipeline.parquet.storageClass` |
| Log query empty after enabling pipeline | Agent OTLP endpoint and trace bounds — see [log pipeline troubleshooting](#troubleshooting) |

## Unified log pipeline {#unified-log-pipeline}

Enable correlated log ingest, Parquet storage, and trace-id query (`sp logs` / `GET /api/recorder/logs`) from the **sp-backend** Helm chart.

**Prerequisites:** a healthy `sp-backend` release on chart **v4.3.x+**. The pipeline is **enabled by default** (`logPipeline.enabled: true`). Instrumented workloads need only `sp.api.url`; the agent discovers the Vector log endpoint from server config (see [Agent OTLP export](#agent-otlp-export)).

### What the chart deploys

When `logPipeline.enabled: true`, Helm adds:

| Resource | Purpose |
|----------|---------|
| **Vector** (`{release}-log-vector`) | OTLP log ingest (gRPC/HTTP + agent JSON on `:4320`) |
| **rclone sidecar** (local mode only) | S3-over-filesystem gateway so Vector writes Parquet via `aws_s3` sink |
| **Parquet PVC** (local mode only) | Durable storage shared by Vector, sp-backend, compaction, and retention |
| **Compaction CronJob** (local mode) | Merges closed-hour minute files → `part-hourly.parquet` (DuckDB) |
| **Retention CronJob** (optional) | Prunes Parquet older than `ttlDays` |

sp-backend is wired for Parquet reads and exports its own diagnostic logs when the pipeline is enabled (`OTEL_ENABLED=true`, `OTEL_LOGS_EXPORTER=otlp-filtered`).

### Configure in Helm

The chart enables the pipeline by default. Override in your values file (or `--set` on install/upgrade) when you need non-default storage, placement, or to disable:

```yaml
logPipeline:
  enabled: true   # default; set false to disable
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

**Upgrading from an older `values.yaml` without a `logPipeline` block?** You do not need to add one — chart defaults apply and the pipeline is deployed on upgrade. See [Upgrade an existing release](#upgrade-an-existing-release).

Example upgrade with explicit overrides (optional):

```bash
helm upgrade softprobe softprobe/sp-backend \
  --version 4.3.9 \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.9 \
  --set createNamespace=false
```

Pin **`image.tag`** to a semver release (for example `v4.3.9`), not `latest`, so the backend matches your chart version.

### Verify log pipeline

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

### Agent OTLP export {#agent-otlp-export}

sp-backend sets `OTEL_EXPORTER_OTLP_ENDPOINT` to the in-cluster Vector OTLP HTTP endpoint (port `4318`, full cluster DNS). On `POST /api/config/agent/load`, the server publishes `extendField.otlpLogEndpoint` (same host, port `4320`, path `/v1/logs`) for Java agents.

Instrumented workloads need only:

```text
-javaagent:sp-agent.jar -Dsp.app.id=<appId> -Dsp.api.url=http://<release>-sp-backend.<namespace>.svc.cluster.local:8090
```

The agent applies the discovered URL automatically. Use `-Dsp.otel.exporter.otlp.log.endpoint=...` only when the workload cannot resolve cluster DNS (for example apps outside the Softprobe namespace without an ingress).

When an endpoint is available (discovery or JVM override), correlated application and agent logs export during record and replay. Legacy capture flags (`sp.record.user.log`, `sp-capture-log`, `sp.user.log.level`, etc.) are not used in v1.

### Storage modes

| Mode | `logPipeline.storage.backend` | Write path | Query path |
|------|------------------------------|------------|------------|
| **Local PVC** (default) | `local` | Vector → Parquet PVC | sp-backend reads mounted volume |
| **S3-compatible** | `s3` | Vector → your bucket | sp-backend reads via S3 API |

#### Local disk

**Layout (fixed by chart — do not reconfigure paths):**

- PVC is mounted at `/data/parquet` on Vector, sp-backend, compaction, and retention pods.
- Parquet hive partitions live under `/data/parquet/logs/`:
  - Minute files: `year=YYYY/month=MM/day=DD/hour=HH/minute=mm/part-<epoch>-<uuid>.parquet`
  - After compaction: `year=.../hour=HH/part-hourly.parquet` (minute dirs for that hour removed)

**Compaction:** the hourly CronJob (`logPipeline.compaction`) reads all `minute=*/part-*.parquet` for the **previous closed UTC hour**, writes `part-hourly.parquet`, then deletes the minute files. sp-backend prefers the hourly file when present for that hour.

**Image:** `softprobe/duckdb:1.1.3` from Docker Hub (`linux/amd64`). For Apple Silicon dev clusters, build/load an `arm64` image locally (`make duckdb-image DUCKDB_PLATFORM=linux/arm64`) and override `logPipeline.compaction.image`.

**Backup:** snapshot the `{release}-log-parquet` PVC or copy files under the PVC while Vector is quiesced.

**Retention:** `logPipeline.retention.ttlDays` (default `30`) enables a prune CronJob. Set `ttlDays: ""` to disable.

#### S3-compatible object storage

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

### Helm values reference

| Value | Description |
|-------|-------------|
| `logPipeline.enabled` | Deploy Vector, storage, and query wiring (default `true`) |
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

### Maintenance jobs

| CronJob | When | What |
|---------|------|------|
| `{release}-log-vector-retention` | `ttlDays` set | Deletes Parquet files/objects older than TTL |
| `{release}-log-vector-compaction` | `compaction.enabled` + `backend: local` | DuckDB merges previous hour's `part-*.parquet` → `part-hourly.parquet` |

Check last run:

```bash
kubectl get cronjob,jobs -n softprobe -l 'app.kubernetes.io/component=log-pipeline-maintenance'
kubectl logs -n softprobe job/<compaction-job-name>
```

### Out of scope (v1)

- Native Azure Blob SDK (use S3-compatible endpoint).
- Iceberg, ad hoc SQL, direct Parquet access for end users.
- Dual-write to local PVC and S3.
- Dedicated log-pipeline health/status API.

## Uninstall

```bash
helm uninstall softprobe -n softprobe
```

Bundled MongoDB PVCs are retained by default. Delete manually if required:

```bash
kubectl delete pvc -n softprobe -l app.kubernetes.io/instance=softprobe
```

## Java agents

Point instrumented applications at the in-cluster service:

```text
-Dsp.api.url=http://softprobe-sp-backend.softprobe.svc.cluster.local:8090
```

## Troubleshooting

| Symptom | Check |
|---------|--------|
| `helm install` fails on MongoDB | Set **one** of `mongodb.connectionString` or `mongodb.bundled.auth.password` |
| `sp-backend` pod `Init:0/1` (bundled) | MongoDB or Redis not ready — `kubectl get pods -n softprobe` |
| `sp-backend` slow start | JVM warm-up — up to ~2 minutes (startup probe) |
| `ImagePullBackOff` | Missing `softprobe-gcr-pull` secret or wrong `image.tag` |
| Mongo PVC pending (bundled) | No StorageClass — set `mongodb.bundled.storageClass` |
| External MongoDB connection errors | URI reachable from cluster; unique DB name; correct `authSource` |
| Empty `GET /api/recorder/logs` but data expected | Partial `part-hourly.parquet` from interrupted compaction — delete hourly file or wait for next compaction; confirm minute `part-*.parquet` files exist |
| Vector pod not ready | `kubectl logs -n softprobe deploy/<release>-log-vector -c vector` |
| Compaction `ImagePullBackOff` on arm64 | Override `logPipeline.compaction.image` with a local `arm64` build |
| Agent logs missing | `sp.otel.exporter.otlp.log.endpoint` must reach Vector `:4320`; trace must have `trace_id` on export |
| sp-backend logs missing | `logPipeline.enabled` auto-enables OTLP export on sp-backend |

## Next step

After sp-backend is healthy, install Softprobe on developer machines: [Install Softprobe Client](./).

For a shared team web workbench on Linux, see [Spcode Service](./index.md#spcode-service) on the client install page.

Related: [`sp logs`](/en/testing/commands/logs) · [Log correlation IDs](/en/testing/reference/log-correlation-ids)
