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

**Bundled mode:** expect pods for `mongodb`, `redis`, and `sp-backend`.

**External mode:** expect `redis` and `sp-backend` only (no `{release}-mongo` pod).

## Upgrade

```bash
helm repo update
helm upgrade softprobe softprobe/sp-backend \
  --version 4.3.6 \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.6
```

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

Optional: enable the [unified log pipeline](./unified-log-pipeline.md) for correlated trace-id log query (`sp logs`).
