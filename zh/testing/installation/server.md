---
title: 安装 Softprobe 服务端
---

# 安装 Softprobe 服务端

使用 Helm 在 Kubernetes 上安装统一的 Softprobe 后端。Chart 支持部署集群内**内置 MongoDB 与 Redis**，或无缝连接至**外部 MongoDB（单机/副本集）、外部 Redis（单机/Sentinel 集群）与外部 S3 存储桶**。

Chart **v4.3.x+** 默认启用[统一日志管道](#unified-log-pipeline)（Vector、Parquet PVC、压缩）。全新安装只需配置下方的 MongoDB 与加密密钥——无需单独的 `logPipeline` 块。

**前置条件：** Kubernetes 1.24+、Helm 3.x、Softprobe 提供的 GCR 拉取凭证，以及用于静态载荷加密的 `encryption.secretKey`。

若使用**内置** MongoDB，集群需有默认或已配置的 `StorageClass` 供 MongoDB PVC 使用。

## MongoDB 模式（二选一）

在 values 文件中**仅配置一种**模式。若两者都设或都未设，`helm install` 会失败。

| 模式 | values 中设置 | Chart 是否部署 MongoDB？ |
|------|---------------|------------------------|
| **内置** | `mongodb.bundled.auth.password` | 是 — Deployment、Service、PVC |
| **外部** | `mongodb.connectionString` | 否 |

**共享外部 MongoDB：** 多个 Helm release 可共用同一 MongoDB 主机。请在各连接字符串中使用**唯一的数据库名**（例如 `acme_prod_sp_storage_db`）。

下载示例 values 文件（始终为当前版本）：

[values.example.yaml](https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/latest/values.example.yaml)

## 安装

### 1. Helm 仓库与命名空间

```bash
helm repo add softprobe \
  https://storage.googleapis.com/softprobe-published-files/helm/sp-backend
helm repo update

kubectl create namespace softprobe
```

### 2. GCR 拉取 Secret

```bash
kubectl create secret docker-registry softprobe-gcr-pull \
  --docker-server=https://gcr.io \
  --docker-username=_json_key \
  --docker-password="$(cat softprobe-registry-puller.json)" \
  --namespace softprobe
```

::: warning
需同时配置 `gcr.io` 与 `https://gcr.io` 认证项。若 plain `kubectl create secret docker-registry` 导致 `ImagePullBackOff`，请参阅 Chart README。
:::

### 3. Values 文件

将示例复制为 `values.yaml` 并按环境编辑。**在下方 MongoDB 块中二选一。**

#### 模式 A — 内置 MongoDB（集群内）

Chart 与 sp-backend 一同部署 MongoDB 7 与 Redis 7。

```yaml
image:
  tag: "v4.3.10"
  pullSecrets:
    - name: softprobe-gcr-pull

mongodb:
  bundled:
    auth:
      password: "CHANGE_ME_mongo_password"
    # 可选：storageClass、storageSize、resources、placement — 见 values.example.yaml

encryption:
  enabled: true
  secretKey: "CHANGE_ME_base64_32_byte_key"
```

#### 模式 B — 外部 MongoDB

使用已有 MongoDB 服务器。**不要**设置 `mongodb.bundled.auth.password`。

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

#### 模式 C — 外部数据存储（MongoDB 副本集、Redis Sentinel、S3 存储桶）

适用于对接外部自建或云托管数据库、Redis Sentinel 高可用集群以及外部 S3 对象存储的企业级部署：

```bash
# 提前创建 S3 访问凭据 Secret：
kubectl create secret generic softprobe-log-s3-credentials -n softprobe \
  --from-literal=access-key-id='YOUR_S3_ACCESS_KEY_ID' \
  --from-literal=secret-access-key='YOUR_S3_SECRET_ACCESS_KEY'
```

```yaml
image:
  tag: "v4.3.10"
  pullSecrets:
    - name: softprobe-gcr-pull

# 1. 外部 MongoDB 副本集（自动禁用内置 MongoDB）
mongodb:
  connectionString: "mongodb://user:password@mongo-1:27017,mongo-2:27017,mongo-3:27017/your_release_sp_storage_db?replicaSet=rs0&authSource=admin&ssl=true"

# 2. 外部 Redis Sentinel（自动禁用内置 Redis）
redis:
  enabled: false

spBackend:
  extraEnv:
    # 格式: redis://<masterName>:<password>@<sentinelHost1>:<port>,<sentinelHost2>:<port>/<dbIndex>
    # 若 Sentinel 无密码，省略密码部分: redis://mymaster@sentinel-1:26379,sentinel-2:26379/0
    - name: SP_REDIS_SENTINELURL
      value: "redis://mymaster:redisPassword@sentinel-1:26379,sentinel-2:26379,sentinel-3:26379/0"

# 3. 外部 S3 存储桶用于统一日志流水线（自动禁用集群内 rclone 与本地 PVC）
logPipeline:
  enabled: true
  storage:
    backend: s3
    s3:
      bucket: my-softprobe-logs
      endpoint: https://s3.amazonaws.com # 或 MinIO / Ceph 端点
      region: us-east-1
      forcePathStyle: false              # MinIO/Ceph 设为 true，AWS S3 设为 false
      prefix: "logs/"                    # 存储桶内可选前缀
      existingSecret: softprobe-log-s3-credentials

encryption:
  enabled: true
  secretKey: "CHANGE_ME_base64_32_byte_key"
```

### 4. Helm 安装

使用 Softprobe 发布版本对应的 Chart 版本与镜像 tag（`v4.3.10` → Chart `4.3.10`，镜像 `v4.3.10`）。

```bash
helm install softprobe softprobe/sp-backend \
  --version 4.3.10 \
  --namespace softprobe \
  -f values.yaml \
  --set image.tag=v4.3.10 \
  --set createNamespace=false
```

## 验证

```bash
kubectl get pods -n softprobe
kubectl port-forward -n softprobe svc/softprobe-sp-backend 8090:8090
curl -s http://127.0.0.1:8090/actuator/health
```

- **内置模式（模式 A）：** 应看到 `mongodb`、`redis`、`sp-backend`、`log-vector` 及 `log-rclone` Pod。
- **外部 MongoDB 模式（模式 B）：** 应看到 `redis`、`sp-backend`、`log-vector` 及 `log-rclone`（无 `{release}-mongo` Pod）。
- **全外部数据存储模式（模式 C）：** 应仅看到 `sp-backend` 与 `log-vector`（由于 MongoDB、Redis 及 S3 均由外部提供，不会部署 `{release}-mongo`、`{release}-redis` 及 `{release}-log-rclone` Pod）。

## 升级已有 Release {#upgrade-existing-release}

使用安装时的 release 名称、命名空间与 `values.yaml`。Softprobe 发布 tag 与 Helm 对应关系：

| 发布 tag | Chart `--version` | `image.tag` |
|----------|-------------------|-------------|
| `v4.3.10` | `4.3.10` | `v4.3.10` |

### 升级前

1. **保留现有 `values.yaml`** — 无需整文件替换。Helm 会将您的文件与新 Chart 默认值合并（未设置的键使用默认值）。
2. **旧文件没有 `logPipeline`？** 若在 v4.3.5 或更早版本安装且仅有 `image`、`mongodb`、`encryption`，只需提升 `--version` 与 `image.tag`。缺失键继承 Chart 默认值 — **`logPipeline.enabled` 为 `true`**，升级时会添加 Vector、Parquet PVC（本地模式）、压缩与保留策略。建议先用 `--dry-run` 预览新资源。
3. **审阅可选覆盖项** — 下载当前的 [values.example.yaml](https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/latest/values.example.yaml)，仅合并所需项（PVC `storageClass`、`placement`、S3 后端）。**不要**更改 `encryption.secretKey` — 已有加密载荷依赖该密钥。
4. **保持 MongoDB 模式不变** — 升级时不要在内置与外部 MongoDB 之间切换。
5. **确认镜像仓库访问** — `softprobe-gcr-pull` Secret 对新 `image.tag` 仍有效。
6. **预览差异**（可选）：

```bash
helm repo update
helm upgrade softprobe softprobe/sp-backend \
  --version 4.3.10 \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.10 \
  --set createNamespace=false \
  --dry-run
```

### 从 Helm 仓库升级

典型升级 — 使用安装时的 `values.yaml`，更新 Chart 与镜像版本：

```bash
helm repo update
helm upgrade softprobe softprobe/sp-backend \
  --version 4.3.10 \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.10 \
  --set createNamespace=false
```

若 release 名称不同，请将 `softprobe` 替换为实际名称。**`image.tag`** 须固定为 Softprobe 提供的 semver 发布版本 — 不要用 `latest`。

**示例 — 旧 values 文件无 `logPipeline` 块：** 文件仍为：

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

升级命令（无需编辑文件）：

```bash
helm upgrade softprobe softprobe/sp-backend \
  --version 4.3.10 \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.10 \
  --set createNamespace=false
```

Helm 会按 Chart 默认值添加日志管道资源。Rollout 完成后，为工作负载配置 `-Dsp.api.url` 指向 sp-backend（见 [Agent 日志导出](#agent-log-export)）。

### 从下载的 Chart 包升级

离线安装或从 GCS 校验 SHA-256 时：

```bash
curl -fLO "https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/v4.3.10/sp-backend-4.3.10.tgz"

helm upgrade softprobe ./sp-backend-4.3.10.tgz \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.10 \
  --set createNamespace=false
```

### 升级后验证

```bash
kubectl rollout status -n softprobe deploy/softprobe-sp-backend
kubectl get pods -n softprobe
kubectl get pods,cronjob,pvc -n softprobe | grep -E 'log-vector|log-parquet|compaction|retention'
kubectl port-forward -n softprobe svc/softprobe-sp-backend 8090:8090
curl -s http://127.0.0.1:8090/actuator/health
```

预期 sp-backend 滚动重启（若 Chart 模板变更，Redis 也可能重启）。内置 MongoDB 在现有 PVC 上的数据会保留。新 Pod 启动后 sp-backend 可能需要约 2 分钟就绪（JVM 预热）。

v4.3.10+ 还应看到 `log-vector` 与 `log-parquet` PVC（本地存储）。为已插桩工作负载配置：

```text
-Dsp.api.url=http://<release>-sp-backend.<namespace>.svc.cluster.local:8090
```

日志通过 `{sp.api.url}/v1/logs` 导出；sp-backend 内部代理到 Vector。

### 自定义或禁用日志管道

管道**默认开启**。仅在需要非默认存储、放置策略或 S3 时，从 [values.example.yaml](https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/latest/values.example.yaml) 合并覆盖项：

```yaml
logPipeline:
  parquet:
    storageSize: 100Gi
    storageClass: managed-csi
```

要在升级时**禁用**，在运行 `helm upgrade` 前添加：

```yaml
logPipeline:
  enabled: false
```

完整选项见[统一日志管道](#unified-log-pipeline)。

### 升级故障排查

| 现象 | 检查项 |
|------|--------|
| 升级后 `ImagePullBackOff` | 新 `image.tag` 存在于 GCR；`softprobe-gcr-pull` Secret 有效 |
| `helm upgrade` 因 MongoDB 失败 | 仍须设置 **`mongodb.connectionString` 或 `mongodb.bundled.auth.password` 之一** — 不可两者都清空 |
| 新日志 Parquet PVC Pending | 集群 `StorageClass` — 设置 `logPipeline.parquet.storageClass` |
| 启用管道后日志查询为空 | Agent OTLP 端点与 trace 时间范围 — 见[故障排查](#troubleshooting) |

## 统一日志管道 {#unified-log-pipeline}

通过 **sp-backend** Helm Chart 启用关联日志采集、Parquet 存储与 trace-id 查询（`sp logs` / `GET /api/recorder/logs`）。

**前置条件：** Chart **v4.3.x+** 上健康的 sp-backend release。管道**默认启用**（`logPipeline.enabled: true`）。已插桩工作负载需 `-Dsp.api.url` 指向 sp-backend（见 [Agent 日志导出](#agent-log-export)）。

### Chart 部署的资源

当 `logPipeline.enabled: true` 时，Helm 会添加：

| 资源 | 用途 |
|------|------|
| **Vector**（`{release}-log-vector`） | OTLP 日志采集（gRPC/HTTP + Agent JSON，端口 `:4320`） |
| **rclone 网关**（`{release}-log-rclone`，本地 + Azure Blob） | 共享 S3 网关（Deployment + Service），供 Vector 与 sp-backend 读写 Parquet |
| **Parquet PVC**（仅本地模式） | 持久存储，仅由 rclone 网关挂载；其他 Pod 均经网关的 S3 端点访问 |
| **Compaction CronJob**（所有后端） | 合并已关闭小时的分钟文件 → `part-hourly.parquet`（DuckDB） |
| **Retention CronJob**（可选，所有后端） | 清理早于 `ttlDays` 的 Parquet |

启用管道时 sp-backend 会配置 Parquet 读取，并导出自身诊断日志（`OTEL_ENABLED=true`，`OTEL_LOGS_EXPORTER=otlp-filtered`）。

### 在 Helm 中配置

Chart 默认启用管道。需要非默认存储、放置策略或禁用时，在 values 文件（或 install/upgrade 的 `--set`）中覆盖：

```yaml
logPipeline:
  enabled: true   # 默认；设为 false 可禁用
  storage:
    backend: local   # local | s3 | azure_blob — 详见"选择日志存储位置"
  parquet:
    storageSize: 100Gi
    # storageClass: managed-csi   # 可选 — 省略时使用集群默认
  retention:
    ttlDays: 4               # 设为 "" 可禁用 Retention CronJob
    cleanupSchedule: "0 3 * * *"
  compaction:
    enabled: true            # 仅本地存储
    schedule: "15 * * * *"   # 上一已关闭 UTC 小时
  # 使用 taint 时将 Vector 与维护任务固定到与 sp-backend 相同的节点池：
  placement:
    nodeSelector:
      workload: softprobe-backend
    tolerations:
      - key: workload
        operator: Equal
        value: backend
        effect: NoSchedule
```

**从没有 `logPipeline` 块的旧 `values.yaml` 升级？** 无需添加 — Chart 默认值会在升级时部署管道。见[升级已有 Release](#upgrade-existing-release)。

显式覆盖的可选升级示例：

```bash
helm upgrade softprobe softprobe/sp-backend \
  --version 4.3.10 \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.10 \
  --set createNamespace=false
```

**`image.tag`** 须固定为 semver 发布版本（例如 `v4.3.10`），不要用 `latest`，以保证后端与 Chart 版本一致。

### 验证日志管道

```bash
kubectl get pods,cronjob,pvc -n softprobe | grep -E 'log-vector|log-parquet|compaction|retention'
kubectl port-forward -n softprobe svc/softprobe-sp-backend 8090:8090
```

运行固定查询（替换 trace id 与时间范围）：

```bash
export SP_API_URL=http://127.0.0.1:8090
sp logs --trace-id <32-hex> --since 2026-06-27T10:00:00Z --until 2026-06-27T10:05:00Z
```

或：

```bash
curl -s "$SP_API_URL/api/recorder/logs?trace_id=<id>&since=2026-06-27T10:00:00Z&until=2026-06-27T10:05:00Z"
```

v1 **没有**专用管道健康 API — 成功的 trace-id 查询可确认采集、存储与查询链路。

### Agent 日志导出 {#agent-log-export}

Java Agent 仅需指向 sp-backend：

```text
-Dsp.api.url=http://<release>-sp-backend.<namespace>.svc.cluster.local:8090
```

release 为 `softprobe`、命名空间为 `softprobe` 时：

```text
-Dsp.api.url=http://softprobe-sp-backend.softprobe.svc.cluster.local:8090
```

录制与回放期间，关联的应用与 Agent 日志导出至 `{sp.api.url}/v1/logs`。日志管道启用时，sp-backend 将 Agent JSON 代理到 Vector `:4320`，OTLP 代理到 `:4318`。

可选高级覆盖 — 直连 Vector（绕过 backend 代理）：

```text
-Dsp.otel.exporter.otlp.log.endpoint=http://<release>-log-vector.<namespace>.svc.cluster.local:4320/v1/logs
```

v1 不使用旧版采集标志（`sp.record.user.log`、`sp-capture-log`、`sp.user.log.level` 等）。

### 选择日志存储位置

通过 `logPipeline.storage.backend` 选择 Parquet 日志文件的存储位置，三选一：

| 后端 | `logPipeline.storage.backend` | 适用场景 | 需要提供的凭证 |
|------|-------------------------------|----------|----------------|
| **本地磁盘**（默认） | `local` | 单集群、最简部署 | 无（集群内卷） |
| **S3 兼容** | `s3` | AWS S3、MinIO、GCS 等任意 S3 API | `access-key-id` + `secret-access-key` |
| **Azure Blob** | `azure_blob` | Azure 存储账户 | `account-key` |

三种后端在查询、压缩与保留上的行为完全一致 — 仅存储位置与凭证不同。

#### 方式一 — 本地磁盘（默认）

无需配置。Chart 会创建 PersistentVolumeClaim 并将 Parquet 存于其中。仅在需要时调整大小/StorageClass：

```yaml
logPipeline:
  storage:
    backend: local
  parquet:
    storageSize: 100Gi
    storageClass: ""      # 集群默认；或如 managed-csi (AKS)、gp3 (EKS)
```

备份：对 `{release}-log-parquet` PVC 做快照。

#### 方式二 — S3 兼容 Bucket

**第 1 步 — 创建凭证 Secret。** 必须包含以下两个键：

```bash
kubectl create secret generic softprobe-log-s3-credentials -n softprobe \
  --from-literal=access-key-id='AKIA...' \
  --from-literal=secret-access-key='...'
```

| Secret 键 | 值 |
|-----------|----|
| `access-key-id` | Bucket 的 Access Key ID |
| `secret-access-key` | Bucket 的 Secret Access Key |

**第 2 步 — 让 Chart 指向您的 Bucket 与该 Secret：**

```yaml
logPipeline:
  storage:
    backend: s3
    s3:
      bucket: my-softprobe-logs
      endpoint: https://s3.amazonaws.com   # 或您的 MinIO / GCS / 其他 S3 端点
      region: us-east-1
      forcePathStyle: true                 # MinIO 保持 true
      prefix: ""                           # Bucket 内可选 key 前缀
      existingSecret: softprobe-log-s3-credentials
```

Bucket 需已存在。此模式下**不会**创建 Parquet PVC。

#### 方式三 — Azure Blob 容器

**第 1 步 — 创建凭证 Secret。** 必须且仅包含一个键 `account-key`，即存储账户访问密钥：

```bash
kubectl create secret generic softprobe-log-azure-credentials -n softprobe \
  --from-literal=account-key='<存储账户访问密钥>'
```

| Secret 键 | 值 |
|-----------|----|
| `account-key` | 存储账户访问密钥（Azure 门户 → **存储账户 → 安全性 + 网络 → 访问密钥**，或 `az storage account keys list --account-name <account> --query '[0].value' -o tsv`） |

**第 2 步 — 让 Chart 指向您的容器与该 Secret：**

```yaml
logPipeline:
  storage:
    backend: azure_blob
    azureBlob:
      container: my-softprobe-logs
      accountName: <account>
      endpoint: https://<account>.blob.core.windows.net
      prefix: ""                           # 容器内可选前缀
      existingSecret: softprobe-log-azure-credentials
```

容器需已存在。Softprobe 使用账户名 + 访问密钥（Azure Shared Key）认证。此模式下**不会**创建 Parquet PVC。

#### 压缩与保留（所有后端）

两者均自动运行，且在 `local`、`s3`、`azure_blob` 上行为一致 — 无需云端生命周期规则：

- **压缩**（`logPipeline.compaction`，每小时，默认开启）：将每个已关闭 UTC 小时的分钟文件合并为单个 `part-hourly.parquet`。
- **保留**（`logPipeline.retention.ttlDays`，默认 `4`）：删除超过 N 天的 Parquet。设 `ttlDays: ""` 可永久保留。

> 压缩使用 `softprobe/duckdb:1.1.3` 镜像（`linux/amd64`）。Apple Silicon 开发集群可本地构建/加载 `arm64` 镜像（`make duckdb-image DUCKDB_PLATFORM=linux/arm64`）并覆盖 `logPipeline.compaction.image`。

**安全：** 终端用户与 Agent Skills **绝不得**获得 Bucket 或存储账户凭证 — 仅通过 `sp logs` / `GET /api/recorder/logs` 查询。

### Helm values 参考

| 值 | 说明 |
|----|------|
| `logPipeline.enabled` | 部署 Vector、存储与查询 wiring（默认 `true`） |
| `logPipeline.storage.backend` | `local`（PVC）、`s3` 或 `azure_blob` |
| `logPipeline.parquet.storageSize` / `storageClass` | 本地 Parquet PVC 大小与 StorageClass |
| `logPipeline.vector.image` | Vector 镜像（默认 `timberio/vector:0.56.0-debian`） |
| `logPipeline.vector.resources` | 日志采集器 CPU/内存 |
| `logPipeline.otlp.httpPort` / `grpcPort` / `agentJsonPort` | OTLP 端口（默认 `4318` / `4317` / `4320`） |
| `logPipeline.retention.ttlDays` | 清理 TTL（天）；`""` 禁用 Retention CronJob |
| `logPipeline.retention.cleanupSchedule` | Retention CronJob 调度（默认 `0 3 * * *`） |
| `logPipeline.compaction.enabled` / `schedule` / `image` | 每小时压缩，适用于所有后端（默认开启，`15 * * * *`，`softprobe/duckdb:1.1.3`） |
| `logPipeline.placement` | Vector 与维护 CronJob 的 `nodeSelector` / `tolerations` / `affinity` |
| `logPipeline.agentLogEndpointProperty` | 文档化 JVM 属性：`sp.otel.exporter.otlp.log.endpoint` |

Chart 默认值中的 `logPipeline.parquet.localRoot`（`/data/parquet/logs`）须与内部存储布局一致 — 运维通常**不要**覆盖。

### 维护任务

| CronJob | 条件 | 作用 |
|---------|------|------|
| `{release}-log-vector-retention` | 已设置 `ttlDays`（任意后端） | 删除早于 TTL 的 Parquet 文件/对象 |
| `{release}-log-vector-compaction` | `compaction.enabled`（任意后端） | DuckDB 合并上一小时的 `part-*.parquet` → `part-hourly.parquet` |

查看最近运行：

```bash
kubectl get cronjob,jobs -n softprobe -l 'app.kubernetes.io/component=log-pipeline-maintenance'
kubectl logs -n softprobe job/<compaction-job-name>
```

### v1 范围外

- Iceberg、即席 SQL、终端用户直接访问 Parquet。
- 本地 PVC 与 S3 双写。
- 专用日志管道健康/状态 API。

## 卸载

```bash
helm uninstall softprobe -n softprobe
```

内置 MongoDB PVC 默认保留。需要时可手动删除：

```bash
kubectl delete pvc -n softprobe -l app.kubernetes.io/instance=softprobe
```

## Java Agent

将已插桩应用指向集群内服务：

```text
-Dsp.api.url=http://softprobe-sp-backend.softprobe.svc.cluster.local:8090
```

## 故障排查 {#troubleshooting}

| 现象 | 检查项 |
|------|--------|
| `helm install` 因 MongoDB 失败 | 须设置 **`mongodb.connectionString` 或 `mongodb.bundled.auth.password` 之一** |
| `sp-backend` Pod `Init:0/1`（内置） | MongoDB 或 Redis 未就绪 — `kubectl get pods -n softprobe` |
| `sp-backend` 启动慢 | JVM 预热 — 最多约 2 分钟（startup probe） |
| `ImagePullBackOff` | 缺少 `softprobe-gcr-pull` Secret 或 `image.tag` 错误 |
| Mongo PVC Pending（内置） | 无 StorageClass — 设置 `mongodb.bundled.storageClass` |
| 外部 MongoDB 连接错误 | URI 从集群可达；数据库名唯一；`authSource` 正确 |
| 预期有数据但 `GET /api/recorder/logs` 为空 | 中断的压缩留下不完整 `part-hourly.parquet` — 删除 hourly 文件或等待下次压缩；确认存在 minute `part-*.parquet` |
| Vector Pod 未就绪 | `kubectl logs -n softprobe deploy/<release>-log-vector -c vector` |
| arm64 上 Compaction `ImagePullBackOff` | 用本地 `arm64` 构建覆盖 `logPipeline.compaction.image` |
| Agent 日志缺失 | `sp.api.url` 须可达 sp-backend；日志管道已启用；导出须带 `trace_id` |
| sp-backend 日志缺失 | `logPipeline.enabled` 会在 sp-backend 上自动启用 OTLP 导出 |

## 下一步

sp-backend 健康后，在开发者机器上安装 Softprobe 客户端：[安装 Softprobe（客户端）](./)。

Linux 上共享团队 Web 工作台见客户端安装页的 [Spcode Service](./index#spcode-service)。

相关：[`sp logs`](/zh/testing/commands/logs) · [日志关联 ID](/zh/testing/reference/log-correlation-ids)
