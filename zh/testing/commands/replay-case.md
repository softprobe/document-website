---
title: sp replay（数据查询）：用例与元数据
---

# sp replay（数据查询）：用例与元数据

**AI 代理何时使用：** `sp replay run` 跑完后 —— 列出失败用例、取元数据、翻页查用例。

## 概要 {#synopsis}

查询回放计划、用例和元数据（只读的报告/存储接口）。

## 子命令 {#subcommands}

| 子命令 | 说明 |
|------------|-------------|
| `metadata <replayId>` | 回放元数据（节点、fullLink、traceId） |
| `case list` | 计划或计划项下的用例 |
| `case get <caseId>` | 单条用例详情（必须带 `--plan-item`） |

## 参数（`case list`） {#flags-case-list}

| 参数 | 说明 |
|------|-------------|
| `--plan` | 计划 ID |
| `--plan-item` | 计划项 / 接口 ID |
| `--failed` | 只看失败/出错的用例 |
| `--diff-result-code` | 按差异码过滤（1=有差异，2=出错） |
| `--page` / `--limit` | 分页 |

## 示例 {#examples}

```bash
sp replay metadata replay-uuid --json
sp replay case list --plan plan-xyz --failed --page 1 --limit 20 --json
sp replay case list --plan-item item-abc --json
sp replay case get case-001 --plan-item item-abc --json
```

### JSON 输出（`metadata`） {#json-output-metadata}

```json
{
  "ok": true,
  "command": "replay metadata",
  "data": {
    "replayId": "replay-uuid",
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
    "fullLink": true,
    "nodes": [
      {
        "nodeId": "order-service",
        "status": "SUCCESS"
      }
    ]
  }
}
```

### JSON 输出（`case list`） {#json-output-case-list}

```json
{
  "ok": true,
  "command": "replay case list",
  "data": {
    "items": [
      {
        "caseId": "case-001",
        "replayId": "replay-uuid-001",
        "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
        "operationId": "item-abc",
        "diffResultCode": 1,
        "recordTime": 1747564800000,
        "replayTime": 1747568400000
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

### JSON 输出（`case get`） {#json-output-case-get}

```json
{
  "ok": true,
  "command": "replay case get",
  "data": {
    "caseId": "case-001",
    "replayId": "replay-uuid-001",
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
    "diffId": "diff-883311",
    "diffResultCode": 1,
    "operationId": "item-abc",
    "recordTime": 1747564800000,
    "replayTime": 1747568400000
  }
}
```

## REST 接口对照 {#rest-mapping}

| 子命令 | 接口 |
|------------|------|
| `metadata` | 存储回放查询 / schedule 元数据接口 |
| `case list` | `/api/report/queryReplayCase`、存储 `viewRecord`、schedule 报告 |
| `case get` | 按 planItemId 查报告 |

具体路径因部署而异，见 [API 对照](/zh/testing/reference/api-mapping)。

## 替代 `sp_api` {#replaces-sp_api}

| sp_api | sp |
|--------|-----|
| `query_replay_metadata` | `sp replay metadata` |
| `query_plan_fail_cases` | `sp replay case list --plan … --failed` |
| `query_replay_case` | `sp replay case list` |

## 相关文档 {#related}

- [replay-diff](./replay-diff)
- [诊断回放失败](/zh/testing/examples/agent-diagnose-replay)
