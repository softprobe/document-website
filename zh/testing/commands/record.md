# sp record

**When agents use this:** Inspect what was recorded for a trace; verify agent behavior via logs.

## Synopsis

Read-only access to stored recordings (not agent write APIs).

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `case list` | List recorded entry cases for an app and time window |
| `operation list` | List recorded operations by category (dependency map) |
| `query` | Query mocker/record payload by trace or replay id |
| `trace <traceId>` | Trace tree and children |
| `completeness <traceId>` | Full-link recording completeness |
| `view` | Visualization query/view |

> **日志查询（v1）：** 使用顶层 [`sp logs`](./logs) 加 `--trace-id` —— 不再使用 `sp record logs *`（已在统一日志管线中移除）。

## Examples

```bash
sp record case list --app a1b2c3d4e5f67890 --since -1h --json
sp record query --trace-id abc --out-dir .sp-work --json
sp record trace abc --json
sp record completeness abc --json
sp logs --trace-id abc --since 2026-06-27T10:00:00Z --until 2026-06-27T10:05:00Z --json
```

## `case list`

Use this immediately after running an instrumented app and sending traffic. It proves that replay has input data.

```bash
sp record case list --app a1b2c3d4e5f67890 --since -1h --limit 20 --json
```

Required behavior:

- `--app` is required and maps to the registered `appId`.
- `--since` / `--until` select the recording window. Durations such as `-1h` are resolved relative to now.
- `--page` / `--limit` paginate cases.
- Output includes case ids or trace ids, operation names, recorded time, and enough metadata to start trace or replay workflows.

Example JSON shape:

```json
{
  "ok": true,
  "command": "record case list",
  "data": {
    "items": [
      {
        "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
        "operationName": "GET /api/orders/{id}",
        "recordedAt": "2026-05-19T10:15:00Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

## `query`

根据 trace ID 或 replay ID 查询录制数据 payload：

```bash
sp record query --trace-id 4bf92f3577b34da6a3ce929d0e0e4736 --json
```

```json
{
  "ok": true,
  "command": "record query",
  "data": {
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
    "entryAction": "GET /api/orders/{id}",
    "recordTime": 1747564800000,
    "subTraces": [
      {
        "subTraceId": "sub-001",
        "category": "Database",
        "operation": "SELECT",
        "status": 0
      }
    ]
  }
}
```

当响应内容超过阈值（64 KiB）时，将作为文件写入 `--out-dir`：

```json
{
  "ok": true,
  "command": "record query",
  "data": {
    "artifact": ".sp-work/record-query-4bf92f3577b34da6a3ce929d0e0e4736.json",
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736"
  }
}
```

## `trace`

查看录制 trace 调用树与子调用：

```bash
sp record trace 4bf92f3577b34da6a3ce929d0e0e4736 --json
```

```json
{
  "ok": true,
  "command": "record trace",
  "data": {
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
    "operationName": "GET /api/orders/{id}",
    "durationMs": 85,
    "children": [
      {
        "operationName": "SELECT * FROM orders WHERE id = ?",
        "category": "Database",
        "durationMs": 12
      }
    ]
  }
}
```

## `completeness`

验证单个 trace 的录制完整性：

```bash
sp record completeness 4bf92f3577b34da6a3ce929d0e0e4736 --json
```

```json
{
  "ok": true,
  "command": "record completeness",
  "data": {
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
    "complete": true,
    "recordedNodes": 3,
    "expectedNodes": 3
  }
}
```

## `operation list`

按类别列出应用已录制的依赖接口调用（依赖拓扑）：

```bash
sp record operation list --app a1b2c3d4e5f67890 --json
```

```json
{
  "ok": true,
  "command": "record operation list",
  "data": {
    "appId": "a1b2c3d4e5f67890",
    "operationMap": {
      "Database": ["SELECT", "INSERT"],
      "HttpClient": ["GET https://inventory.internal/items"]
    }
  }
}
```

## REST mapping

| Subcommand | Method | Path |
|------------|--------|------|
| `case list` | POST | `/api/storage/replay/query/replayCase` |
| `query` | POST | `/api/storage/record/query` |
| `trace` | GET | `/api/storage/record/trace/{traceId}` |
| `trace children` | GET | `/api/storage/record/trace/{traceId}/children` |
| `completeness` | GET | `/api/storage/record/completeness` |
| `view` | POST | `/api/storage/visualization/query` |

## Replaces `sp_api`

| sp_api | sp |
|--------|-----|
| `record_data` | `sp record query` |
| `record_log_overview` | `sp logs --trace-id …`（见 [logs](./logs)） |
| `download_record_logs` | `sp logs --trace-id …` → 重定向或用 `jq` |

## Non-goals

- `POST /api/storage/record/save`, `batchSave*` — agent instrumentation only

## Related

- [trace](./trace)
- [replay-diff](./replay-diff)
