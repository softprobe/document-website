---
title: sp diagnose：打包好的排查工作流
---

# sp diagnose：打包好的排查工作流

**AI 代理何时使用：** 一次性完成「进度 + 报告 + 存储 + trace」组合查询的工作流 —— 比手工串接底层命令步骤更少。

## 概要 {#synopsis}

| 子命令 | 说明 |
|------------|-------------|
| `replay <planId>` | 回放计划进度、失败用例、落盘的差异产物 |
| `trace <traceId>` | 录制 trace、完整性、摘要产物 |

## `diagnose replay`

替代 [诊断回放失败](/zh/testing/examples/agent-diagnose-replay) 中的手工步骤序列：

```bash
sp diagnose replay plan-abc123 --failed-only --out-dir .sp-work --json
```

| 参数 | 默认值 | 说明 |
|------|---------|-------------|
| `--failed-only` | `true` | 只看对比失败的用例 |
| `--out-dir` | `.sp-work` | 写入 `{planId}/{planItemId}-diff.json` 文件 |
| `--page` / `--limit` | 全局 | 用例查询的分页 |

执行步骤：

1. `GET /api/progress?planId=…`
2. 带 `--failed-only` 时，`POST /api/report/queryReplayCase` 会带上 `diffResultCode=1`
3. 对每个带 `diffId` 的失败用例：`GET /api/report/queryDiffMsgById/{id}` → 产物文件

JSON 输出示例（`diagnose replay`）：

```json
{
  "ok": true,
  "command": "diagnose replay",
  "data": {
    "planId": "plan-abc123",
    "status": "FINISHED",
    "classification": "invalid_target",
    "message": "Connection refused: travel-ota:9999",
    "failedCaseCount": 0,
    "invalidCaseCount": 12,
    "artifacts": [
      ".sp-work/plan-abc123/item-1-diff.json"
    ]
  }
}
```

`classification` 取值之一：`empty_window`、`invalid_target`、`assertion_failure`、`mixed`、`other`。`message` 来自后端的 `errorMessage` 或用例发送错误（如果有）—— 不是 CLI 自己编的文案。

**注意：** `nextActions` 已从 `diagnose replay --json` 的输出中移除（feature 007）。自动化请用 `classification` + `message`。

## `diagnose trace`

```bash
sp diagnose trace 4bf92f3577b34da6a3ce929d0e0e4736 --out-dir .sp-work --json
```

拉取：

- `GET /api/storage/record/trace/{traceId}`
- `GET /api/storage/record/completeness?traceId=…`
- trace 摘要（如果有）

JSON 写入 `{outDir}/trace-{traceId}/` 下，返回摘要和 `nextActions`：

### JSON 输出（`diagnose trace`） {#json-output-diagnose-trace}

```json
{
  "ok": true,
  "command": "diagnose trace",
  "data": {
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
    "complete": true,
    "artifacts": [
      ".sp-work/trace-4bf92f3577b34da6a3ce929d0e0e4736/record-trace.json",
      ".sp-work/trace-4bf92f3577b34da6a3ce929d0e0e4736/completeness.json",
      ".sp-work/trace-4bf92f3577b34da6a3ce929d0e0e4736/trace-summary.json"
    ],
    "nextActions": [
      "Inspect artifacts or query details: sp record query --trace-id 4bf92f3577b34da6a3ce929d0e0e4736 --json"
    ]
  }
}
```

## diagnose 之后：看日志 {#after-diagnose-logs}

`diagnose replay` 只写差异文件，不含日志。要看某个失败用例的日志，先从 `sp replay case list --plan <planId> --failed --json` 取它的 `traceId`，再按 [排查回放失败 — 查看日志](/zh/testing/examples/agent-diagnose-replay#logs) 和 [sp logs](./logs) 查询。

## 相关文档 {#related}

- [sp logs](./logs)
- [概念与编号](/zh/testing/agents/concepts#ids)
- [replay](./replay)
- [replay diff](./replay-diff)
- [record](./record)
- [trace](./trace)
