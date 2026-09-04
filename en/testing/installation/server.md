---
title: Install Softprobe Server
---

# Install Softprobe Server

Install the unified Softprobe backend on Kubernetes with Helm. The chart supports deploying in-cluster **bundled MongoDB and Redis**, or connecting to your **external MongoDB (standalone/replica set), external Redis (standalone/Sentinel), and external S3** data stores.

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

Download the example values file (always the current version):

[values.example.yaml](https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/latest/values.example.yaml)

## Install

### 1. Helm repo and namespace

```bash
helm repo add softprobe \
  https://storage.googleapis.com/softprobe-published-files/helm/sp-backend
helm repo update

# Define target namespace (default is softprobe, or use your existing custom namespace):
export NAMESPACE="<YOUR_NAMESPACE>"
kubectl create namespace "$NAMESPACE"   # omit if namespace already exists
```

::: tip Custom or Pre-existing Namespaces
If installing into your own existing namespace, set `createNamespace: false` in your `values.yaml` (or pass `--set createNamespace=false` to `helm install`) so Helm does not attempt to create a namespace that already exists.
:::

### 2. GCR pull secret

Create the image pull secret in your target namespace:

```bash
kubectl create secret docker-registry softprobe-gcr-pull \
  --docker-server=https://gcr.io \
  --docker-username=_json_key \
  --docker-password="$(cat softprobe-registry-puller.json)" \
  --namespace "$NAMESPACE"
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
  tag: "v4.3.10"
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
  tag: "v4.3.10"
  pullSecrets:
    - name: softprobe-gcr-pull

mongodb:
  connectionString: "mongodb://USER:PASS@mongo.host:27017/your_release_sp_storage_db?authSource=admin"

encryption:
  enabled: true
  secretKey: "CHANGE_ME_base64_32_byte_key"
```

#### Mode C — External Data Stores (MongoDB Replica Set, Redis Sentinel, S3 Bucket)

For enterprise deployments connecting to external managed databases, Redis Sentinel high-availability clusters, and external S3 object storage for the log pipeline:

```bash
# Create the S3 credentials secret in advance:
kubectl create secret generic softprobe-log-s3-credentials -n "$NAMESPACE" \
  --from-literal=access-key-id='YOUR_S3_ACCESS_KEY_ID' \
  --from-literal=secret-access-key='YOUR_S3_SECRET_ACCESS_KEY'
```

```yaml
image:
  tag: "v4.3.10"
  pullSecrets:
    - name: softprobe-gcr-pull

# 1. External MongoDB Replica Set (bundled MongoDB disabled)
mongodb:
  connectionString: "mongodb://user:password@mongo-1:27017,mongo-2:27017,mongo-3:27017/your_release_sp_storage_db?replicaSet=rs0&authSource=admin&ssl=true"

# 2. External Redis Sentinel (bundled Redis disabled)
redis:
  enabled: false

spBackend:
  extraEnv:
    # Format: redis://<masterName>:<password>@<sentinelHost1>:<port>,<sentinelHost2>:<port>/<dbIndex>
    # If no password is used on Sentinel, omit password: redis://mymaster@sentinel-1:26379,sentinel-2:26379/0
    - name: SP_REDIS_SENTINELURL
      value: "redis://mymaster:redisPassword@sentinel-1:26379,sentinel-2:26379,sentinel-3:26379/0"

# 3. External S3 Bucket for Unified Log Pipeline (in-cluster rclone & local PVC disabled)
logPipeline:
  enabled: true
  storage:
    backend: s3
    s3:
      bucket: my-softprobe-logs
      endpoint: https://s3.amazonaws.com # or MinIO / Ceph endpoint
      region: us-east-1
      forcePathStyle: false              # keep true for MinIO/Ceph, false for AWS S3
      prefix: "logs/"                    # optional path prefix
      existingSecret: softprobe-log-s3-credentials

encryption:
  enabled: true
  secretKey: "CHANGE_ME_base64_32_byte_key"
```

#### Custom Image Overrides (busybox, aws-cli, mirrors)

For air-gapped environments or private internal registries, you can override any container image used by the chart:

```yaml
# Override busybox used by sp-backend & spwebui wait-for-deps init containers:
initContainer:
  image: "my-registry.internal/busybox:1.37.0"

# Override images in the unified log pipeline:
logPipeline:
  # Override aws-cli used by compaction minute pruning and retention TTL CronJobs:
  maintenance:
    image: "my-registry.internal/amazon/aws-cli:2.36.39"
  # Override Vector OTLP ingest image:
  vector:
    image: "my-registry.internal/timberio/vector:0.56.0-debian"
  # Override rclone S3 gateway (local/azure modes):
  rclone:
    image: "my-registry.internal/rclone/rclone:1.75.0"
  # Override DuckDB hour compaction merge image:
  compaction:
    image: "my-registry.internal/softprobe/duckdb:1.4.1"
```

### 4. Helm install

::: info Chart Version vs. Image Tag
The **Helm Chart version** (`--version <CHART_VERSION>`, e.g. `4.4.1`) and the backend application **Docker image tag** (`image.tag`, e.g. `v4.3.23` or `latest`) are versioned independently:
- **Chart version**: Specifies the Helm packaging and template structure.
- **`image.tag`**: Specifies which container image is pulled from GCR (configured in `values.yaml` or via `--set image.tag=<TAG>`).
:::

**Via Helm repository:**
```bash
export NAMESPACE="<YOUR_NAMESPACE>"

helm install softprobe softprobe/sp-backend \
  --version 4.4.1 \
  --namespace "$NAMESPACE" \
  --set createNamespace=false \
  -f values.yaml
```

**Or directly from the downloaded `.tgz` archive:**
```bash
curl -fLO https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/v4.4.1/sp-backend-4.4.1.tgz

helm install softprobe ./sp-backend-4.4.1.tgz \
  --namespace "$NAMESPACE" \
  --set createNamespace=false \
  -f values.yaml
```

## Verify

```bash
kubectl get pods -n "$NAMESPACE"
kubectl port-forward -n "$NAMESPACE" svc/softprobe-sp-backend 8090:8090
curl -s http://127.0.0.1:8090/actuator/health
```

- **Bundled mode (Mode A):** expect pods for `mongodb`, `redis`, `sp-backend`, `log-vector`, and `log-rclone`.
- **External MongoDB mode (Mode B):** expect `redis`, `sp-backend`, `log-vector`, and `log-rclone` (no `{release}-mongo` pod).
- **External Data Stores mode (Mode C):** expect only `sp-backend` and `log-vector` (no `{release}-mongo`, `{release}-redis`, or `{release}-log-rclone` pods since MongoDB, Redis, and S3 are managed externally).

## Upgrade an existing release

Use the same release name, namespace, and `values.yaml` you used at install. A Softprobe release tag maps to Helm as:

| Release tag | Chart `--version` | `image.tag` |
|-------------|-------------------|-------------|
| `v4.3.10` | `4.3.10` | `v4.3.10` |

### Before you upgrade

1. **Keep your existing `values.yaml`** — you do not need to replace it. Helm merges your file with the new chart defaults for any key you omitted.
2. **Older file without `logPipeline`?** If you installed on v4.3.5 or earlier with only `image`, `mongodb`, and `encryption`, bump `--version` and `image.tag` only. Missing keys inherit chart defaults — **`logPipeline.enabled` is `true`**, so Vector, the Parquet PVC (local mode), compaction, and retention are added on upgrade. Use `--dry-run` first to preview new resources.
3. **Review optional overrides** — download the current [values.example.yaml](https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/latest/values.example.yaml) and merge only what you need (PVC `storageClass`, `placement`, S3 backend). Do **not** change `encryption.secretKey` — existing encrypted payloads depend on it.
4. **Keep your MongoDB mode** — do not switch between bundled and external MongoDB on upgrade.
5. **Confirm registry access** — the `softprobe-gcr-pull` secret must still be valid for the new `image.tag`.
6. **Preview the diff** (optional):

```bash
helm repo update
helm upgrade softprobe softprobe/sp-backend \
  --version 4.4.1 \
  --namespace "$NAMESPACE" \
  -f values.yaml \
  --set image.tag=v4.4.1 \
  --set createNamespace=false \
  --dry-run
```

### Upgrade from the Helm repo

Typical upgrade — same `values.yaml` as install, new chart and image version:

```bash
helm repo update
helm upgrade softprobe softprobe/sp-backend \
  --version 4.4.1 \
  --namespace "$NAMESPACE" \
  -f values.yaml \
  --set image.tag=v4.4.1 \
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
  --version 4.4.1 \
  --namespace "$NAMESPACE" \
  -f values.yaml \
  --set image.tag=v4.4.1 \
  --set createNamespace=false
```

Helm adds log-pipeline resources from chart defaults. After rollout, instrument workloads with `-Dsp.api.url` pointing at sp-backend (see [Agent log export](#agent-log-export)).

### Upgrade from a downloaded chart package

If you install offline or verify SHA-256 from GCS:

```bash
curl -fLO "https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/v4.4.1/sp-backend-4.4.1.tgz"

helm upgrade softprobe ./sp-backend-4.4.1.tgz \
  --namespace "$NAMESPACE" \
  -f values.yaml \
  --set image.tag=v4.4.1 \
  --set createNamespace=false
```

### Verify after upgrade

```bash
kubectl rollout status -n "$NAMESPACE" deploy/softprobe-sp-backend
kubectl get pods -n "$NAMESPACE"
kubectl get pods,cronjob,pvc -n "$NAMESPACE" | grep -E 'log-vector|log-parquet|compaction|retention'
kubectl port-forward -n "$NAMESPACE" svc/softprobe-sp-backend 8090:8090
curl -s http://127.0.0.1:8090/actuator/health
```

Expect a rolling restart of `sp-backend` (and Redis if the chart template changed). Bundled MongoDB data on the existing PVC is preserved. `sp-backend` may take up to ~2 minutes to become ready after the new pod starts (JVM warm-up).

On v4.3.10+ you should also see `log-vector` and a `log-parquet` PVC (local storage). Instrument workloads with:

```text
-Dsp.api.url=http://<release>-sp-backend.<namespace>.svc.cluster.local:8090
```

Log export uses `{sp.api.url}/v1/logs`; sp-backend proxies to Vector internally.

### Customize or disable the log pipeline

The pipeline is **on by default**. Merge overrides from [values.example.yaml](https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/latest/values.example.yaml) only when you need non-default storage, placement, or S3:

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

**Prerequisites:** a healthy `sp-backend` release on chart **v4.3.x+**. The pipeline is **enabled by default** (`logPipeline.enabled: true`). Instrumented workloads need `-Dsp.api.url` pointing at sp-backend (see [Agent log export](#agent-log-export)).

### What the chart deploys

When `logPipeline.enabled: true`, Helm adds:

| Resource | Purpose |
|----------|---------|
| **Vector** (`{release}-log-vector`) | OTLP log ingest (gRPC/HTTP + agent JSON on `:4320`) |
| **rclone gateway** (`{release}-log-rclone`, local + Azure Blob) | Shared S3 gateway Deployment + Service that Vector and sp-backend use to write/read Parquet |
| **Parquet PVC** (local mode only) | Durable storage mounted only by the rclone gateway; all other pods reach it via the gateway's S3 endpoint |
| **Compaction CronJob** (all backends) | Merges closed-hour minute files → `part-hourly.parquet` (DuckDB) |
| **Retention CronJob** (optional, all backends) | Prunes Parquet older than `ttlDays` |

sp-backend is wired for Parquet reads and exports its own diagnostic logs when the pipeline is enabled (`OTEL_ENABLED=true`, `OTEL_LOGS_EXPORTER=otlp-filtered`).

### Configure in Helm

The chart enables the pipeline by default. Override in your values file (or `--set` on install/upgrade) when you need non-default storage, placement, or to disable:

```yaml
logPipeline:
  enabled: true   # default; set false to disable
  storage:
    backend: local   # local | s3 | azure_blob — see "Choose where logs are stored"
  parquet:
    storageSize: 100Gi
    # storageClass: managed-csi   # optional — cluster default if omitted
  retention:
    ttlDays: 4               # set "" to disable retention CronJob
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
  --version 4.4.1 \
  --namespace "$NAMESPACE" \
  -f values.yaml \
  --set image.tag=v4.4.1 \
  --set createNamespace=false
```

Pin **`image.tag`** to a semver release (for example `v4.4.1`), not `latest`, so the backend matches your chart version.

### Verify log pipeline

```bash
kubectl get pods,cronjob,pvc -n "$NAMESPACE" | grep -E 'log-vector|log-parquet|compaction|retention'
kubectl port-forward -n "$NAMESPACE" svc/softprobe-sp-backend 8090:8090
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

The same Vector Deployment also stores Softprobe **metrics** under a sibling `metrics/` Parquet dataset. See [Metrics data plane](./metrics-data-plane) for `POST /v1/metrics` and `GET /api/recorder/metrics`.

### Agent log export {#agent-log-export}

Point the Java agent at sp-backend only:

```text
-Dsp.api.url=http://<release>-sp-backend.<namespace>.svc.cluster.local:8090
```

For release `softprobe` in namespace `softprobe`:

```text
-Dsp.api.url=http://softprobe-sp-backend.softprobe.svc.cluster.local:8090
```

Correlated application and agent logs export to `{sp.api.url}/v1/logs` during record and replay. sp-backend proxies agent JSON to Vector `:4320` and OTLP to `:4318` when the log pipeline is enabled.

Optional advanced override — direct Vector ingest (bypasses backend proxy):

```text
-Dsp.otel.exporter.otlp.log.endpoint=http://<release>-log-vector.<namespace>.svc.cluster.local:4320/v1/logs
```

Legacy capture flags (`sp.record.user.log`, `sp-capture-log`, `sp.user.log.level`, etc.) are not used in v1.

### Choose where logs are stored

Set `logPipeline.storage.backend` to pick where Parquet log files live. Pick one:

| Backend | `logPipeline.storage.backend` | Best for | Credentials you provide |
|---------|-------------------------------|----------|-------------------------|
| **Local disk** (default) | `local` | Single cluster, simplest setup | None (in-cluster volume) |
| **S3-compatible** | `s3` | AWS S3, MinIO, GCS, any S3 API | `access-key-id` + `secret-access-key` |
| **Azure Blob** | `azure_blob` | Azure Storage accounts | `account-key` |

Querying, compaction, and retention behave identically across all three — only the storage location and credentials differ.

#### Option 1 — Local disk (default)

Nothing to set up. The chart creates a PersistentVolumeClaim and stores Parquet there. Adjust size/class only if needed:

```yaml
logPipeline:
  storage:
    backend: local
  parquet:
    storageSize: 100Gi
    storageClass: ""      # cluster default; or e.g. managed-csi (AKS), gp3 (EKS)
```

Back up by snapshotting the `{release}-log-parquet` PVC.

#### Option 2 — S3-compatible bucket

**Step 1 — create the credentials secret.** It must contain exactly these two keys:

```bash
kubectl create secret generic softprobe-log-s3-credentials -n "$NAMESPACE" \
  --from-literal=access-key-id='AKIA...' \
  --from-literal=secret-access-key='...'
```

| Secret key | Value |
|------------|-------|
| `access-key-id` | Bucket access key ID |
| `secret-access-key` | Bucket secret access key |

**Step 2 — point the chart at your bucket and that secret:**

```yaml
logPipeline:
  storage:
    backend: s3
    s3:
      bucket: my-softprobe-logs
      endpoint: https://s3.amazonaws.com   # or your MinIO / GCS / other S3 endpoint
      region: us-east-1
      forcePathStyle: true                 # keep true for MinIO
      prefix: ""                           # optional key prefix inside the bucket
      existingSecret: softprobe-log-s3-credentials
```

The bucket must already exist. No Parquet PVC is created in this mode.

#### Option 3 — Azure Blob container

**Step 1 — create the credentials secret.** It must contain exactly one key, `account-key`, holding your storage account access key:

```bash
kubectl create secret generic softprobe-log-azure-credentials -n "$NAMESPACE" \
  --from-literal=account-key='<storage account key>'
```

| Secret key | Value |
|------------|-------|
| `account-key` | Storage account access key (Azure portal → **Storage account → Security + networking → Access keys**, or `az storage account keys list --account-name <account> --query '[0].value' -o tsv`) |

**Step 2 — point the chart at your container and that secret:**

```yaml
logPipeline:
  storage:
    backend: azure_blob
    azureBlob:
      container: my-softprobe-logs
      accountName: <account>
      endpoint: https://<account>.blob.core.windows.net
      prefix: ""                           # optional prefix inside the container
      existingSecret: softprobe-log-azure-credentials
```

The container must already exist. Softprobe authenticates with the account name + access key (Azure Shared Key). No Parquet PVC is created in this mode.

#### Compaction & retention (all backends)

Both run automatically and identically for `local`, `s3`, and `azure_blob` — no cloud lifecycle rules required:

- **Compaction** (`logPipeline.compaction`, hourly, on by default): merges each closed UTC hour's minute files into a single `part-hourly.parquet`.
- **Retention** (`logPipeline.retention.ttlDays`, default `4`): deletes Parquet older than N days. Set `ttlDays: ""` to keep logs forever.

> Compaction uses the `softprobe/duckdb:1.1.3` image (`linux/amd64`). On Apple Silicon dev clusters, build/load an `arm64` build (`make duckdb-image DUCKDB_PLATFORM=linux/arm64`) and override `logPipeline.compaction.image`.

**Security:** end users and Agent Skills **must never** receive bucket or storage-account credentials — they query only through `sp logs` / `GET /api/recorder/logs`.

### Helm values reference

| Value | Description |
|-------|-------------|
| `logPipeline.enabled` | Deploy Vector, storage, and query wiring (default `true`) |
| `logPipeline.storage.backend` | `local` (PVC), `s3`, or `azure_blob` |
| `logPipeline.parquet.storageSize` / `storageClass` | Local Parquet PVC size and class |
| `logPipeline.vector.image` | Vector image (default `timberio/vector:0.56.0-debian`) |
| `logPipeline.vector.resources` | CPU/memory for the log collector |
| `logPipeline.otlp.httpPort` / `grpcPort` / `agentJsonPort` | OTLP ports (defaults `4318` / `4317` / `4320`) |
| `logPipeline.retention.ttlDays` | Prune TTL in days; `""` disables retention CronJob |
| `logPipeline.retention.cleanupSchedule` | Retention CronJob schedule (default `0 3 * * *`) |
| `logPipeline.compaction.enabled` / `schedule` / `image` | Hourly compaction for every backend (default on, `15 * * * *`, `softprobe/duckdb:1.1.3`) |
| `logPipeline.placement` | `nodeSelector` / `tolerations` / `affinity` for Vector and maintenance CronJobs |
| `logPipeline.agentLogEndpointProperty` | Documented JVM property: `sp.otel.exporter.otlp.log.endpoint` |

`logPipeline.parquet.localRoot` exists in chart defaults (`/data/parquet/logs`) and must stay aligned with the rclone bucket layout — operators normally **do not** override it.

### Maintenance jobs

| CronJob | When | What |
|---------|------|------|
| `{release}-log-vector-retention` | `ttlDays` set (any backend) | AWS CLI deletes Parquet objects older than TTL over the S3 endpoint (native bucket, or the rclone gateway for local/Azure Blob) |
| `{release}-log-vector-compaction` | `compaction.enabled` (any backend) | DuckDB merges previous hour's `part-*.parquet` → `part-hourly.parquet` over the S3 endpoint, then AWS CLI prunes the minute objects |

Check last run:

```bash
kubectl get cronjob,jobs -n "$NAMESPACE" -l 'app.kubernetes.io/component=log-pipeline-maintenance'
kubectl logs -n "$NAMESPACE" job/<compaction-job-name>
```

### Out of scope (v1)

- Iceberg, ad hoc SQL, direct Parquet access for end users.
- Dual-write to local PVC and S3.
- Dedicated log-pipeline health/status API.

## Uninstall

```bash
helm uninstall softprobe -n "$NAMESPACE"
```

Bundled MongoDB PVCs are retained by default. Delete manually if required:

```bash
kubectl delete pvc -n "$NAMESPACE" -l app.kubernetes.io/instance=softprobe
```

## Java agents

Point instrumented applications at the in-cluster service:

```text
-Dsp.api.url=http://<release>-sp-backend.<namespace>.svc.cluster.local:8090
```

## Troubleshooting

| Symptom | Check |
|---------|--------|
| `helm install` fails on MongoDB | Set **one** of `mongodb.connectionString` or `mongodb.bundled.auth.password` |
| `sp-backend` pod `Init:0/1` (bundled) | MongoDB or Redis not ready — `kubectl get pods -n "$NAMESPACE"` |
| `sp-backend` slow start | JVM warm-up — up to ~2 minutes (startup probe) |
| `ImagePullBackOff` | Missing `softprobe-gcr-pull` secret or wrong `image.tag` |
| Mongo PVC pending (bundled) | No StorageClass — set `mongodb.bundled.storageClass` |
| External MongoDB connection errors | URI reachable from cluster; unique DB name; correct `authSource` |
| Empty `GET /api/recorder/logs` but data expected | Partial `part-hourly.parquet` from interrupted compaction — delete hourly file or wait for next compaction; confirm minute `part-*.parquet` files exist |
| Vector pod not ready | `kubectl logs -n "$NAMESPACE" deploy/<release>-log-vector -c vector` |
| Compaction `ImagePullBackOff` on arm64 | Override `logPipeline.compaction.image` with a local `arm64` build |
| Agent logs missing | `sp.api.url` must reach sp-backend; log pipeline enabled; trace must have `trace_id` on export |
| sp-backend logs missing | `logPipeline.enabled` auto-enables OTLP export on sp-backend |

## Next step

After sp-backend is healthy, install Softprobe on developer machines: [Install Softprobe Client](./).

For a shared team web workbench on Linux, see [Spcode Service](./index#spcode-service) on the client install page.

Related: [`sp logs`](/en/testing/commands/logs) · [Log correlation IDs](/en/testing/reference/log-correlation-ids)
