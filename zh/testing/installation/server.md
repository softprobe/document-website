---
title: 安装 Softprobe 服务端
---

# 安装 Softprobe 服务端

使用 Helm 在 Kubernetes 上安装统一的 Softprobe 后端。Chart 会在集群内部署 **Redis**，并选择部署**内置 MongoDB** 或连接您**已有的 MongoDB** 服务器。

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

下载对应 Chart 版本的示例 values 文件：

[values.example.yaml (v4.3.9)](https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/v4.3.9/values.example.yaml)

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
  tag: "v4.3.9"
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
  tag: "v4.3.9"
  pullSecrets:
    - name: softprobe-gcr-pull

mongodb:
  connectionString: "mongodb://USER:PASS@mongo.host:27017/your_release_sp_storage_db?authSource=admin"

encryption:
  enabled: true
  secretKey: "CHANGE_ME_base64_32_byte_key"
```

### 4. Helm 安装

使用 Softprobe 发布版本对应的 Chart 版本与镜像 tag（`v4.3.9` → Chart `4.3.9`，镜像 `v4.3.9`）。

```bash
helm install softprobe softprobe/sp-backend \
  --version 4.3.9 \
  --namespace softprobe \
  -f values.yaml \
  --set image.tag=v4.3.9 \
  --set createNamespace=false
```

## 验证

```bash
kubectl get pods -n softprobe
kubectl port-forward -n softprobe svc/softprobe-sp-backend 8090:8090
curl -s http://127.0.0.1:8090/actuator/health
```

**内置模式：** 应看到 `mongodb`、`redis`、`sp-backend`，以及（Chart v4.3.x+）`log-vector` Pod。

**外部模式：** 应看到 `redis`、`sp-backend` 与 `log-vector`（无 `{release}-mongo` Pod）。

## 升级已有 Release {#upgrade-existing-release}

使用安装时的 release 名称、命名空间与 `values.yaml`。Softprobe 发布 tag 与 Helm 对应关系：

| 发布 tag | Chart `--version` | `image.tag` |
|----------|-------------------|-------------|
| `v4.3.9` | `4.3.9` | `v4.3.9` |

### 升级前

1. **保留现有 `values.yaml`** — 无需整文件替换。Helm 会将您的文件与新 Chart 默认值合并（未设置的键使用默认值）。
2. **旧文件没有 `logPipeline`？** 若在 v4.3.5 或更早版本安装且仅有 `image`、`mongodb`、`encryption`，只需提升 `--version` 与 `image.tag`。缺失键继承 Chart 默认值 — **`logPipeline.enabled` 为 `true`**，升级时会添加 Vector、Parquet PVC（本地模式）、压缩与保留策略。建议先用 `--dry-run` 预览新资源。
3. **审阅可选覆盖项** — 下载目标版本的 [values.example.yaml](https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/v4.3.9/values.example.yaml)，仅合并所需项（PVC `storageClass`、`placement`、S3 后端）。**不要**更改 `encryption.secretKey` — 已有加密载荷依赖该密钥。
4. **保持 MongoDB 模式不变** — 升级时不要在内置与外部 MongoDB 之间切换。
5. **确认镜像仓库访问** — `softprobe-gcr-pull` Secret 对新 `image.tag` 仍有效。
6. **预览差异**（可选）：

```bash
helm repo update
helm upgrade softprobe softprobe/sp-backend \
  --version 4.3.9 \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.9 \
  --dry-run
```

### 从 Helm 仓库升级

典型升级 — 使用安装时的 `values.yaml`，更新 Chart 与镜像版本：

```bash
helm repo update
helm upgrade softprobe softprobe/sp-backend \
  --version 4.3.9 \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.9
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
  --version 4.3.9 \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.9
```

Helm 会按 Chart 默认值添加日志管道资源。Rollout 完成后，将 Agent 指向 Vector（见 [Agent OTLP 导出](#agent-otlp-export)）。

### 从下载的 Chart 包升级

离线安装或从 GCS 校验 SHA-256 时：

```bash
curl -fLO "https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/v4.3.9/sp-backend-4.3.9.tgz"

helm upgrade softprobe ./sp-backend-4.3.9.tgz \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.9
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

v4.3.9+ 还应看到 `log-vector` 与 `log-parquet` PVC（本地存储）。将已插桩工作负载指向 Vector：

```text
-Dsp.otel.exporter.otlp.log.endpoint=http://<release>-log-vector.<namespace>.svc.cluster.local:4320/v1/logs
```

### 自定义或禁用日志管道

管道**默认开启**。仅在需要非默认存储、放置策略或 S3 时，从 [values.example.yaml](https://storage.googleapis.com/softprobe-published-files/helm/sp-backend/v4.3.9/values.example.yaml) 合并覆盖项：

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

**前置条件：** Chart **v4.3.x+** 上健康的 sp-backend release。管道**默认启用**（`logPipeline.enabled: true`）。已插桩工作负载需集群内 Vector OTLP 日志端点（见 [Agent OTLP 导出](#agent-otlp-export)）。

### Chart 部署的资源

当 `logPipeline.enabled: true` 时，Helm 会添加：

| 资源 | 用途 |
|------|------|
| **Vector**（`{release}-log-vector`） | OTLP 日志采集（gRPC/HTTP + Agent JSON，端口 `:4320`） |
| **rclone sidecar**（仅本地模式） | 类 S3 文件系统网关，供 Vector 经 `aws_s3` sink 写入 Parquet |
| **Parquet PVC**（仅本地模式） | Vector、sp-backend、压缩与保留任务共享的持久存储 |
| **Compaction CronJob**（仅本地模式） | 合并已关闭小时的分钟文件 → `part-hourly.parquet`（DuckDB） |
| **Retention CronJob**（可选） | 清理早于 `ttlDays` 的 Parquet |

启用管道时 sp-backend 会配置 Parquet 读取，并导出自身诊断日志（`OTEL_ENABLED=true`，`OTEL_LOGS_EXPORTER=otlp-filtered`）。

### 在 Helm 中配置

Chart 默认启用管道。需要非默认存储、放置策略或禁用时，在 values 文件（或 install/upgrade 的 `--set`）中覆盖：

```yaml
logPipeline:
  enabled: true   # 默认；设为 false 可禁用
  storage:
    backend: local   # 或 s3
  parquet:
    storageSize: 100Gi
    # storageClass: managed-csi   # 可选 — 省略时使用集群默认
  retention:
    ttlDays: 30              # 设为 "" 可禁用 Retention CronJob
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
  --version 4.3.9 \
  -n softprobe \
  -f values.yaml \
  --set image.tag=v4.3.9
```

**`image.tag`** 须固定为 semver 发布版本（例如 `v4.3.9`），不要用 `latest`，以保证后端与 Chart 版本一致。

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

### Agent OTLP 导出 {#agent-otlp-export}

将 Java Agent 指向集群内 Vector JSON 日志采集 URL：

```text
-Dsp.otel.exporter.otlp.log.endpoint=http://<release>-log-vector.<namespace>.svc.cluster.local:4320/v1/logs
```

release 为 `softprobe`、命名空间为 `softprobe` 时：

```text
http://softprobe-log-vector.softprobe.svc.cluster.local:4320/v1/logs
```

设置该属性后，录制与回放期间会导出关联的应用与 Agent 日志。v1 不使用旧版采集标志（`sp.record.user.log`、`sp-capture-log`、`sp.user.log.level` 等）。

### 存储模式

| 模式 | `logPipeline.storage.backend` | 写入路径 | 查询路径 |
|------|------------------------------|----------|----------|
| **本地 PVC**（默认） | `local` | Vector → Parquet PVC | sp-backend 读取挂载卷 |
| **S3 兼容** | `s3` | Vector → 您的 Bucket | sp-backend 经 S3 API 读取 |

#### 本地磁盘

**目录布局（由 Chart 固定 — 请勿改路径）：**

- PVC 挂载于 Vector、sp-backend、压缩与保留 Pod 的 `/data/parquet`。
- Parquet 分区位于 `/data/parquet/logs/`：
  - 分钟文件：`year=YYYY/month=MM/day=DD/hour=HH/minute=mm/part-<epoch>-<uuid>.parquet`
  - 压缩后：`year=.../hour=HH/part-hourly.parquet`（该小时的 minute 目录被移除）

**压缩：**  hourly CronJob（`logPipeline.compaction`）读取**上一已关闭 UTC 小时**的全部 `minute=*/part-*.parquet`，写入 `part-hourly.parquet`，再删除分钟文件。该小时存在 hourly 文件时 sp-backend 优先使用。

**镜像：** Docker Hub 上的 `softprobe/duckdb:1.1.3`（`linux/amd64`）。Apple Silicon 开发集群可在本地构建/加载 `arm64` 镜像（`make duckdb-image DUCKDB_PLATFORM=linux/arm64`）并覆盖 `logPipeline.compaction.image`。

**备份：** 对 `{release}-log-parquet` PVC 做快照，或在 Vector 静止时复制 PVC 内文件。

**保留：** `logPipeline.retention.ttlDays`（默认 `30`）启用清理 CronJob。设 `ttlDays: ""` 可禁用。

#### S3 兼容对象存储

```yaml
logPipeline:
  enabled: true
  storage:
    backend: s3
    s3:
      bucket: my-softprobe-logs
      endpoint: https://s3.amazonaws.com          # 或 MinIO / GCS / Azure S3 端点
      region: us-east-1
      forcePathStyle: true                        # MinIO 通常设为 true
      prefix: ""                                  # 可选 key 前缀
      existingSecret: softprobe-log-s3-credentials
      secretAccessKeyIdField: access-key-id
      secretSecretAccessKeyField: secret-access-key
```

创建 Secret：

```bash
kubectl create secret generic softprobe-log-s3-credentials \
  --from-literal=access-key-id='AKIA...' \
  --from-literal=secret-access-key='...' \
  -n softprobe
```

- `backend: s3` 时**不会**创建 Parquet PVC。
- **保留：** 设置 `ttlDays` 启用 S3 对象清理（按 last-modified）。
- **压缩：** v1 对 S3 无自动化 — `backend: s3` 时不部署本地 DuckDB CronJob。

终端用户与 Agent Skills **不得**获得 Bucket 凭证 — 仅通过 `sp logs` / `GET /api/recorder/logs` 查询。

### Helm values 参考

| 值 | 说明 |
|----|------|
| `logPipeline.enabled` | 部署 Vector、存储与查询 wiring（默认 `true`） |
| `logPipeline.storage.backend` | `local`（PVC）或 `s3` |
| `logPipeline.parquet.storageSize` / `storageClass` | 本地 Parquet PVC 大小与 StorageClass |
| `logPipeline.vector.image` | Vector 镜像（默认 `timberio/vector:0.56.0-debian`） |
| `logPipeline.vector.resources` | Vector CPU/内存（本地模式含 rclone sidecar） |
| `logPipeline.otlp.httpPort` / `grpcPort` / `agentJsonPort` | OTLP 端口（默认 `4318` / `4317` / `4320`） |
| `logPipeline.retention.ttlDays` | 清理 TTL（天）；`""` 禁用 Retention CronJob |
| `logPipeline.retention.cleanupSchedule` | Retention CronJob 调度（默认 `0 3 * * *`） |
| `logPipeline.compaction.enabled` / `schedule` / `image` | 本地 hourly 压缩（默认开启，`15 * * * *`，`softprobe/duckdb:1.1.3`） |
| `logPipeline.placement` | Vector 与维护 CronJob 的 `nodeSelector` / `tolerations` / `affinity` |
| `logPipeline.agentLogEndpointProperty` | 文档化 JVM 属性：`sp.otel.exporter.otlp.log.endpoint` |

Chart 默认值中的 `logPipeline.parquet.localRoot`（`/data/parquet/logs`）须与 rclone bucket 布局一致 — 运维通常**不要**覆盖。

### 维护任务

| CronJob | 条件 | 作用 |
|---------|------|------|
| `{release}-log-vector-retention` | 已设置 `ttlDays` | 删除早于 TTL 的 Parquet 文件/对象 |
| `{release}-log-vector-compaction` | `compaction.enabled` + `backend: local` | DuckDB 合并上一小时的 `part-*.parquet` → `part-hourly.parquet` |

查看最近运行：

```bash
kubectl get cronjob,jobs -n softprobe -l 'app.kubernetes.io/component=log-pipeline-maintenance'
kubectl logs -n softprobe job/<compaction-job-name>
```

### v1 范围外

- 原生 Azure Blob SDK（请使用 S3 兼容端点）。
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

## 故障排查

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
| Agent 日志缺失 | `sp.otel.exporter.otlp.log.endpoint` 须可达 Vector `:4320`；导出须带 `trace_id` |
| sp-backend 日志缺失 | `logPipeline.enabled` 会在 sp-backend 上自动启用 OTLP 导出 |

## 下一步

sp-backend 健康后，在开发者机器上安装 Softprobe 客户端：[安装 Softprobe（客户端）](./)。

Linux 上共享团队 Web 工作台见客户端安装页的 [Spcode Service](./index.md#spcode-service)。

相关：[`sp logs`](/en/testing/commands/logs) · [日志关联 ID](/en/testing/reference/log-correlation-ids)
