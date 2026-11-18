---
title: sp record：录制数据查询
---

# sp record：录制数据查询

**AI 代理何时使用：** 查看一条 trace 录到了什么；通过日志核实 Agent 行为。

## 概要 {#synopsis}

只读查询已存储的录制数据（不提供 Agent 的写入接口）。

## 子命令 {#subcommands}

| 子命令 | 说明 |
|------------|-------------|
| `case list` | 按应用和时间窗列出已录制的入口用例 |
| `operation list` | 按类别列出已录制的操作（依赖地图） |
| `query` | 按 trace ID 或 replay ID 查询 mocker/record 负载 |
| `trace <traceId>` | trace 树和子节点 |
| `completeness <traceId>` | 全链路录制完整性 |
| `view` | 可视化查询 |

> **日志查询（v1）：** 用顶层的 [`sp logs`](./logs) 加 `--trace-id` —— 不要用 `sp record logs *`（已在统一日志管道中移除）。

## 示例 {#examples}

```bash
sp record case list --app a1b2c3d4e5f67890 --since -1h --json
sp record query --trace-id abc --out-dir .sp-work --json
sp record trace abc --json
sp record completeness abc --json
sp logs --trace-id abc --since 2026-06-27T10:00:00Z --until 2026-06-27T10:05:00Z --json
```

## `case list`

启动插桩应用并发完流量后，立刻用这个命令。它能证明回放有输入数据。

```bash
sp record case list --app a1b2c3d4e5f67890 --since -1h --limit 20 --json
```

注意以下约定：

- `--app` 必填，对应已注册的 `appId`。
- `--since` / `--until` 选择录制时间窗。`-1h` 这类时长表示相对当前时间。
- `--page` / `--limit` 对用例分页。
- 输出包含用例 ID 或 trace ID、操作名、录制时间，以及足够用来发起 trace 或回放的元数据。

JSON 结构示例：

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

按 trace ID 或 replay ID 查询已存储的录制负载：

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

负载超过 4 KiB（紧凑 JSON 4096 字节）时，会写到 `--out-dir` 下的文件里，`data` 只保留摘要和 `artifact`；请先判断有没有 `data.artifact`：

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

查看录制 trace 树和子节点：

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

核实一条 trace 的录制完整性：

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

列出应用已录制的依赖操作和类别：

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

## REST 接口对照 {#rest-mapping}

| 子命令 | 方法 | 路径 |
|------------|--------|------|
| `case list` | POST | `/api/storage/replay/query/replayCase` |
| `query` | POST | `/api/storage/record/query` |
| `trace` | GET | `/api/storage/record/trace/{traceId}` |
| `trace children` | GET | `/api/storage/record/trace/{traceId}/children` |
| `completeness` | GET | `/api/storage/record/completeness` |
| `view` | POST | `/api/storage/visualization/query` |

## 替代 `sp_api` {#replaces-sp_api}

| sp_api | sp |
|--------|-----|
| `record_data` | `sp record query` |
| `record_log_overview` | `sp logs --trace-id …`（见 [logs](./logs)） |
| `download_record_logs` | `sp logs --trace-id …` → 重定向或用 `jq` |

## 本命令不覆盖的接口 {#non-goals}

- `POST /api/storage/record/save`、`batchSave*` —— 仅供 Agent 插桩使用

## 相关文档 {#related}

- [trace](./trace)
- [replay-diff](./replay-diff)
