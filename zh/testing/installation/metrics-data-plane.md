# 指标数据平面

Softprobe 指标复用**与日志相同的采集器和 Parquet 存储体系**：OTLP → Vector → 一分钟聚合 → `metrics/` 数据集下的 Parquet → 产品 HTTP 查询。它面向的是**临时诊断**场景（例如“我们是否收到了 agent 日志？”），而非 Prometheus/Grafana 仪表盘。

需要 chart **v4.3.x+** 并启用[统一日志管道](./server#unified-log-pipeline)（默认启用）。指标会复用该 Vector Deployment —— 无需第二个时序数据库，也无需额外的 pod。

## 摄入 —— `POST /v1/metrics`

客户端将 OpenTelemetry 指标 POST 到 Softprobe。当遥测管道就绪后，sp-backend 会将其代理转发给 Vector。

| Content-Type | Payload |
|--------------|---------|
| `application/x-protobuf` | OTLP `ExportMetricsServiceRequest` |
| `application/json` | OTLP metrics JSON（`resourceMetrics` …） |

**接受的格式：** 仅 OTLP protobuf 和 OTLP JSON。该端点**不**接受扁平 JSON 的指标方言。OTLP JSON 在 Softprobe 处被接受，并以 protobuf 形式转发给 Vector。

| Pipeline state | Response |
|----------------|----------|
| Ready | 接受/代理后返回 `200` |
| Not ready | `503` —— Softprobe **不会**在丢弃数据的同时返回成功 |

示例（OTLP JSON）：

```bash
curl -sS -X POST "$SP_API_URL/v1/metrics" \
  -H 'Content-Type: application/json' \
  --data-binary @export-metrics.json
```

已埋点的后端还会在进程内向同一条 Vector 指标路径**发出**目录计数器（不通过 HTTP 自我 POST）。

## 查询 —— `GET /api/recorder/metrics`

对 `metrics/` 下的 Softprobe Parquet 进行有界、只读的查询。

**必填查询参数：**

| Parameter | Description |
|-----------|-------------|
| `metric_name` | 要选择的指标名称 |
| `since` | ISO-8601 UTC，闭区间（含） |
| `until` | ISO-8601 UTC，开区间（不含）—— 时间窗为 `[since, until)` |

可选的精确匹配过滤器仅作用于提升后的标签列：`status`、`kind`、`source`、`result`、`content_type`。高基数选择器（`trace_id`、完整 URL、异常消息）以及非目录键（例如 `app_id`）会被拒绝。

除了要求提供有效的边界外，产品层面**没有**行数 `limit`，也**没有**最大时间跨度限制（与日志查询理念一致）。缺失的分区会返回 HTTP 200 且 `rows` 为空。

```bash
curl -sS "$SP_API_URL/api/recorder/metrics?metric_name=sp.logs.ingest.requests&since=2026-07-10T18:00:00Z&until=2026-07-10T18:05:00Z"
```

成功响应的示例结构：

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

错误响应体不得暴露 Parquet 路径、bucket 名称或存储凭证。

## 后端 P0 目录（R1）

Softprobe 从日志摄入/转发路径发出以下序列：

| Name | Meaning |
|------|---------|
| `sp.logs.ingest.requests` | 每一次 `POST /v1/logs` 尝试（`status`、`kind`） |
| `sp.logs.ingest.records` | 转换后的记录数（`kind`、`source`） |
| `sp.logs.forward.results` | 导出结果（`success` / `failure` / `skipped_*`） |
| `sp.logs.forward.duration_ms` | 导出耗时直方图 |

经过 Vector 的一分钟聚合后，预计约一分钟内即可查询到相应行（CI 最多轮询 **70 秒**）。

## 不在范围内

- 将 Prometheus 抓取、Grafana 或 PromQL 作为 Softprobe 的产品路径
- `sp metrics` CLI（R1 契约为 HTTP API）
- Agent 侧的 `sp.agent.logs.*` 发射器（后续轮次）
- 面向终端用户的直接 Parquet 或存储凭证
