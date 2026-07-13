# sp recorder（已停用）

**本页已停用。** v1 统一日志查询**仅支持按 trace-id 查询**，通过 [sp logs](./logs) 及 `GET /api/recorder/logs?trace_id=…` 进行。`sp recorder logs`、`sp query`、`sp recorder query` 均已移除。

| 已停用 | 替代 |
|---------|-------------|
| `sp recorder logs --replay-id` | `sp logs --trace-id <traceId> …` 或使用带 `trace_id` 的 HTTP API |
| `sp recorder logs --plan-id` / `--plan-item-id` | 先解析出每个 case 对应的 **`traceId`**，再使用 `sp logs --trace-id …` |
| `sp query` / `sp recorder query --sql` | 使用 `sp logs --trace-id …`（不再支持任意 SQL 查询） |
| `--include-recording-log` | **已移除** —— 录制与回放在回放时共用同一个 `trace_id` |
| 响应中的 `source_summary` | **已移除** —— 请使用 `jq` 按 `source` 对各行分组 |

可从回放 case 的 JSON、pytest 的 **Softprobe correlation** 输出，或[日志关联 ID](/zh/testing/reference/log-correlation-ids)中获取 **`traceId`**。

## `sp recorder info`（仍有效）

在不暴露 catalog 或对象存储凭据的前提下查看 Recorder 产品健康状态。

```bash
sp recorder info --json
```

JSON 示例结构：

```json
{
  "ok": true,
  "command": "recorder info",
  "data": {
    "healthy": true,
    "profile": "onprem-helm",
    "helmEnabled": true,
    "vector": "ready",
    "ingest": "ready",
    "query": "ready",
    "catalog": "ready",
    "storage": "ready",
    "maintenance": "ready"
  }
}
```

## 日志查询请用 `sp logs`

按 trace 关联日志、筛选 sp-backend 的 `Replay send start` / `done` / `failed` 标记等，完整参数、示例、排查流程及 API 映射，请参见 [sp logs](./logs) 与[回放发送日志标记](/zh/testing/reference/replay-send-log-markers)。
