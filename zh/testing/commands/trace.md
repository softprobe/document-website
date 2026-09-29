---
title: sp trace：链路查询
---

# sp trace：链路查询

**AI 代理何时使用：** 用户给的是业务 ID（orderId、caseId）而不是 traceId —— **首选的排查入口**。

## 概要 {#synopsis}

按属性反查 trace，以及轻量的 trace 摘要。

## 子命令 {#subcommands}

| 子命令 | 说明 |
|------------|-------------|
| `find` | 按提取规则 / 属性反查 trace |
| `get <traceId>` | 摘要元数据和提取出的属性 |
| `stats` | 属性规则统计（可选） |

## 参数（`find`） {#flags-find}

| 参数 | 说明 |
|------|-------------|
| `--app` | 应用 ID（必填） |
| `--attr-name` | 规则名（如 `orderId`） |
| `--attr-value` | 业务值（如 `ORD-1234`） |
| `--since` / `--until` | Epoch 毫秒时间窗（默认：最近 7 天） |
| `--limit` | 最大 trace 条数（默认 20） |

三种模式：

1. `--attr-name` + `--attr-value` —— 精确查找  
2. 只有 `--attr-name` —— 命中该规则的全部 trace  
3. 都不带 —— 最近命中任意提取规则的 trace

## 示例 {#examples}

```bash
sp trace find --app my-app --attr-name orderId --attr-value ORD-1234 --json
sp trace get 4bf92f3577b34da6a3ce929d0e0e4736 --json
sp trace stats --app my-app --json
```

### JSON 输出（`find`） {#json-output-find}

```json
{
  "ok": true,
  "command": "trace find",
  "data": {
    "items": [
      {
        "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
        "endpoint": "POST /api/order",
        "status": "OK",
        "durationMs": 120,
        "startedAt": "2026-05-18T10:00:00Z"
      }
    ]
  }
}
```

### JSON 输出（`get`） {#json-output-get}

```json
{
  "ok": true,
  "command": "trace get",
  "data": {
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
    "endpoint": "POST /api/order",
    "status": "OK",
    "durationMs": 120,
    "startedAt": "2026-05-18T10:00:00Z",
    "attrs": {
      "orderId": "ORD-1234"
    }
  }
}
```

### JSON 输出（`stats`） {#json-output-stats}

```json
{
  "ok": true,
  "command": "trace stats",
  "data": {
    "items": [
      {
        "ruleName": "orderId",
        "hitCount": 1420,
        "lastHitAt": "2026-05-18T10:15:00Z"
      }
    ]
  }
}
```

## REST 接口对照 {#rest-mapping}

| 子命令 | 方法 | 路径 |
|------------|--------|------|
| `find` | POST | `/api/traces/find-by-attr` |
| `get` | GET | `/api/traces/{traceId}/summary` |
| `stats` | POST | `/api/traces/attr-rule-statistics` |

## 替代 `sp_api` {#replaces-sp_api}

| sp_api | sp |
|--------|-----|
| `find_traces_by_attr` | `sp trace find` |
| `get_trace_summary` | `sp trace get` |

## 相关文档 {#related}

- [从业务编号开始排查](/zh/testing/examples/agent-diagnose-replay#business-id)
