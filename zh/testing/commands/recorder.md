# sp recorder logs（已停用）

> 本页翻译可能滞后于英文版，如有出入以[英文版](/en/testing/commands/recorder)为准。

**本页已停用。** v1 统一日志查询**仅支持按 trace-id 查询**，可通过 [sp logs](./logs) 及 `GET /api/recorder/logs?trace_id=…` 进行。

| Retired | Replacement |
|---------|-------------|
| `sp recorder logs --replay-id` | `sp logs --trace-id <traceId> …` 或使用带 `trace_id` 的 HTTP API |
| `sp recorder logs --plan-id` / `--plan-item-id` | 先解析出每个 case 对应的 **`traceId`**，再使用 `sp logs --trace-id …` |
| `--include-recording-log` | **已移除** —— 录制与回放在回放时共用同一个 `trace_id` |
| 响应中的 `source_summary` | **已移除** —— 请使用 `jq` 按 `source` 对各行分组 |

可从回放 case 的 JSON、pytest 的 **Softprobe correlation** 输出，或[日志关联 ID](/zh/testing/reference/log-correlation-ids)中获取 **`traceId`**。

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

## `sp recorder logs`

按关联字段检索有界的日志行。

```bash
sp recorder logs --trace-id trace-123 --since 1h --limit 500 --json
sp recorder logs --replay-id replay-456 --limit 500 --json
```

结果按事件时间排序，并包含可用的 trace、span、replay、session 及 service 元数据。

对于 sp-backend 的调度分发，请筛选 **`sp.source=backend`** 且 body 中包含 **`Replay send start`**、**`Replay send done`** 或 **`Replay send failed`** 的日志行 —— 这些是回放 HTTP 的入口/出口标记。参见[回放发送日志标记](/zh/testing/reference/replay-send-log-markers)。

## `sp query`

对 Recorder 日志执行有界的只读查询。

```bash
sp query 'SELECT timestamp, severity_text, body FROM logs WHERE trace_id = ? ORDER BY timestamp' \
  --param trace-123 \
  --limit 500 \
  --json
```

## `sp recorder query`

使用显式的 Recorder 命名空间，遵循相同的安全查询约定。

```bash
sp recorder query \
  --sql 'SELECT timestamp, body FROM logs WHERE trace_id = ? ORDER BY timestamp' \
  --param trace-123 \
  --limit 500 \
  --json
```

## Safety Rules

- AI agent 和自动化场景请使用 `--json`。
- 查询为只读，且在第一阶段仅限于受支持的 Recorder 日志表。
- 变更类 SQL、不受支持的表、缺少边界的查询以及大范围扫描均会安全拒绝（fail closed）。
- CLI 用户和 spcode 永远不需要配置 catalog URL、对象存储密钥或独立的查询工具。
- 本地化部署通过现有的 Softprobe Helm chart 启用；生产/SaaS 清单不在第一阶段范围内。
完整的参数、示例、排查流程及 API 映射，请参见 [sp logs](./logs)。
