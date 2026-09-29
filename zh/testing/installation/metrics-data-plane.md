# 指标数据平面

SoftProbe 的指标复用**与日志相同的采集器和 Parquet 存储体系**：OTLP → Vector → 一分钟聚合 → `metrics/` 数据集下的 Parquet → 产品的 HTTP 查询接口。它面向**临时诊断**场景（例如「我们是否收到了 Agent 日志？」），不用于替代 Prometheus/Grafana 仪表盘。

需要 Chart **v4.3.x+**，并启用[统一日志管道](./server#unified-log-pipeline)（默认启用）。指标复用同一个 Vector Deployment，不需要第二个时序数据库，也不需要额外的 Pod。

## 摄入 —— `POST /v1/metrics`

客户端把 OpenTelemetry 指标 POST 到 SoftProbe；遥测管道就绪后，sp-backend 会将其代理转发给 Vector。

| Content-Type | 请求体 |
|--------------|--------|
| `application/x-protobuf` | OTLP `ExportMetricsServiceRequest` |
| `application/json` | OTLP metrics JSON（`resourceMetrics` …） |

**接受的格式：** 仅 OTLP protobuf 和 OTLP JSON。这个端点不接受扁平 JSON 风格的指标格式。OTLP JSON 由 SoftProbe 接收后，以 protobuf 形式转发给 Vector。

| 管道状态 | 响应 |
|----------|------|
| 就绪 | 接受并代理后返回 `200` |
| 未就绪 | `503`：SoftProbe 不会在丢弃数据的同时返回成功 |

示例（OTLP JSON）：

```bash
curl -sS -X POST "$SP_API_URL/v1/metrics" \
  -H 'Content-Type: application/json' \
  --data-binary @export-metrics.json
```

已埋点的后端还会在进程内向同一条 Vector 指标路径发出目录计数器（不通过 HTTP 自我 POST）。

## 查询 —— `GET /api/recorder/metrics`

对 `metrics/` 下的 SoftProbe Parquet 数据做有界、只读的查询。

**必填查询参数：**

| 参数 | 说明 |
|------|------|
| `metric_name` | 要查询的指标名称 |
| `since` | ISO-8601 UTC，闭区间（含） |
| `until` | ISO-8601 UTC，开区间（不含）—— 时间窗为 `[since, until)` |

可选的精确匹配过滤仅作用于提升为列的标签：`status`、`kind`、`source`、`result`、`content_type`。高基数选择器（`trace_id`、完整 URL、异常消息）和非目录键（例如 `app_id`）会被拒绝。

除了要求给出有效的时间边界外，没有行数 `limit`，也没有最大时间跨度限制（与日志查询的思路一致）。查询缺失的分区时返回 HTTP 200，`rows` 为空。

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

## 后端内置指标

后端在日志接收和转发过程中产生以下指标：

| 指标 | 含义 |
|------|------|
| `sp.logs.ingest.requests` | 每一次 `POST /v1/logs` 尝试（`status`、`kind`） |
| `sp.logs.ingest.records` | 转换后的记录数（`kind`、`source`） |
| `sp.logs.forward.results` | 导出结果（`success` / `failure` / `skipped_*`） |
| `sp.logs.forward.duration_ms` | 导出耗时直方图 |

指标按分钟聚合，新数据通常约一分钟后可以查询到。

## 不提供的功能

- Prometheus 抓取、Grafana 或 PromQL
- `sp metrics` 命令（请使用上面的 HTTP 接口）
- 直接访问底层文件或存储凭证
