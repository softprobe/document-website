---
title: sp replay diff：差异与对比
---

# sp replay diff：差异与对比

**AI 代理何时使用：** 深挖一条失败用例 —— 差异消息体、对比 JSON。查关联日志用 [`sp logs`](./logs)。

## 子命令 {#subcommands}

| 子命令 | 说明 |
|------------|-------------|
| `diff get <diffId>` | 基准与本次的消息体（产物文件） |
| `compare` | 全链路对比结果 |
| `mock-tree <replayId>` | 该次回放的 Mock 树 |
| `noise query` | 查询噪音规则 |
| `noise exclude` | 排除噪音（`-f` + `--confirm`） |
| `realtime …` | 实时回放队列（见下文） |

## 示例 {#examples}

```bash
sp replay diff get diff-abc --out-dir .sp-work --json
sp replay compare --trace-id t1 --replay-id r1 --out-dir .sp-work --json
sp logs --trace-id <trace-id> --since 2026-06-27T10:00:00Z --until 2026-06-27T10:05:00Z --json
sp replay mock-tree replay-uuid --json
```

### JSON 输出（`diff get`） {#json-output-diff-get}

```json
{
  "ok": true,
  "command": "replay diff get",
  "data": {
    "artifact": ".sp-work/diff-abc.json",
    "summary": {
      "diffId": "abc",
      "diffResultCode": 1,
      "categoryName": "ResponseBody"
    }
  }
}
```

产物文件中是解码后的 `baseMsg` 和 `testMsg`（能解析时为 JSON）。

### JSON 输出（`compare`） {#json-output-compare}

```json
{
  "ok": true,
  "command": "replay compare",
  "data": {
    "replayId": "r1",
    "traceId": "t1"
  }
}
```

带 `--plan-item` 时，全链路对比详情会写入 `--out-dir`：

```json
{
  "ok": true,
  "command": "replay compare",
  "data": {
    "artifact": ".sp-work/compare-t1.json",
    "replayId": "r1",
    "traceId": "t1",
    "summary": {
      "planItemId": "item-abc"
    }
  }
}
```

### JSON 输出（`mock-tree`） {#json-output-mock-tree}

```json
{
  "ok": true,
  "command": "replay mock-tree",
  "data": {
    "tree": [
      {
        "category": "Database",
        "operation": "SELECT",
        "matchStatus": "MATCHED",
        "invocations": 1
      }
    ]
  }
}
```

### JSON 输出（`noise query`） {#json-output-noise-query}

```json
{
  "ok": true,
  "command": "replay noise query",
  "data": {
    "interfaceNoiseItemList": [
      {
        "categoryName": "ResponseBody",
        "operationName": "GET /api/orders/{id}",
        "path": "data.timestamp",
        "reason": "Dynamic timestamp"
      }
    ]
  }
}
```

### JSON 输出（`noise exclude`） {#json-output-noise-exclude}

```json
{
  "ok": true,
  "command": "replay noise exclude",
  "data": true
}
```

## REST 接口对照 {#rest-mapping}

| 子命令 | 方法 | 路径 |
|------------|--------|------|
| `diff get` | GET | `/api/report/queryDiffMsgById/{id}` |
| `compare` | POST | schedule `/api/compareCase` + 报告接口 |
| `mock-tree` | GET | `/api/storage/replay-mock-tree/{replayId}` |
| `noise query` | GET | `/api/queryNoise` |
| `noise exclude` | POST | `/api/excludeNoise` |

### 实时回放 {#real-time-replay}

| 子命令 | 路径 |
|------------|------|
| `realtime create` | `POST /api/createRealTimePlan` |
| `realtime queue pause <planId>` | `GET /api/queue/control/pause?planId=...`（`--confirm`） |
| `realtime queue resume <planId>` | `GET /api/queue/control/resume?planId=...`（`--confirm`） |
| `realtime log` | `POST /api/realtime/log/query` |

## 替代 `sp_api` {#replaces-sp_api}

| sp_api | sp |
|--------|-----|
| `diff_detail` | `sp replay diff get` |
| `compare_result` | `sp replay compare` |
| `replay_log_overview` | `sp logs --trace-id …` |
| `download_replay_logs` | `sp logs --trace-id …` → 写文件 + `grep` |

## 相关文档 {#related}

- [输出约定](/zh/testing/agents/output-contract)
- [诊断回放失败](/zh/testing/examples/agent-diagnose-replay)
