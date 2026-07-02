# sp-backend (Helm)

Install the unified Softprobe backend on Kubernetes with Helm. The chart deploys **Redis** in-cluster and either **bundled MongoDB** or connects to your **existing MongoDB** server.

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

[values.example.yaml (v4.3.5)](https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/v4.3.5/values.example.yaml)

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
  tag: "v4.3.5"
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
  tag: "v4.3.5"
  pullSecrets:
    - name: softprobe-gcr-pull

mongodb:
  connectionString: "mongodb://USER:PASS@mongo.host:27017/your_release_sp_storage_db?authSource=admin"

encryption:
  enabled: true
  secretKey: "CHANGE_ME_base64_32_byte_key"
```

### 4. Helm install

Use the chart version and image tag from your Softprobe release (`v4.3.5` → chart `4.3.5`, image `v4.3.5`).

```bash
helm install softprobe softprobe/sp-backend \
  --version 4.3.5 \
  --namespace softprobe \
  -f values.yaml \
  --set image.tag=v4.3.5 \
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

Chart **v4.3.x+** enables the [unified log pipeline](./unified-log-pipeline.md) by default (Vector, Parquet PVC, compaction). Fresh installs need only the MongoDB and encryption keys above — no separate `logPipeline` block required.

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
  --set image.tag=v4.3.9
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
  --set image.tag=v4.3.9
```

Helm adds log-pipeline resources from chart defaults. After rollout, point agents at Vector (see below).

### Upgrade from a downloaded chart package

If you install offline or verify SHA-256 from GCS:

```bash
curl -fLO "https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/v4.3.9/sp-backend-4.3.9.tgz"

helm upgrade softprobe ./sp-backend-4.3.9.tgz \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.9
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

On v4.3.x+ you should also see `log-vector` and a `log-parquet` PVC (local storage). Point instrumented workloads at Vector:

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

Full options: [Unified log pipeline (Helm)](./unified-log-pipeline.md).

### Upgrade troubleshooting

| Symptom | Check |
|---------|--------|
| `ImagePullBackOff` after upgrade | New `image.tag` exists in GCR; `softprobe-gcr-pull` secret valid |
| `helm upgrade` fails on MongoDB | Still set **one** of `mongodb.connectionString` or `mongodb.bundled.auth.password` — do not clear both |
| New log Parquet PVC pending | Cluster `StorageClass` — set `logPipeline.parquet.storageClass` |
| Log query empty after enabling pipeline | Agent OTLP endpoint and trace bounds — see [unified log pipeline troubleshooting](./unified-log-pipeline.md#troubleshooting) |

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

## Next step

After sp-backend is healthy, deploy the web UI: [spcode-web](./spcode-web.md).

The unified log pipeline is included by default on chart v4.3.x+ — customize storage, retention, or agent OTLP in [Unified log pipeline (Helm)](./unified-log-pipeline.md).
