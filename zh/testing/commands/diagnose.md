---
title: sp diagnose：一键排查
---

# sp diagnose：一键排查

**AI 代理何时使用：** 一条命令完成进度、报告、存储和 trace 的组合查询，比手工串接底层命令省步骤。

## 概要 {#synopsis}

| 子命令 | 说明 |
|------------|-------------|
| `replay <planId>` | 回放计划进度、失败用例、落盘的差异产物 |
| `trace <traceId>` | 录制 trace、完整性、摘要产物 |

## `diagnose replay`

收集排查一个失败回放计划所需的信息：

```bash
sp diagnose replay plan-abc123 --out-dir .sp-work --json
```

| 参数 | 默认值 | 说明 |
|------|---------|-------------|
| `--failed-only` | `true` | 只看没有通过的用例 |
| `--out-dir` | `.sp-work` | 差异文件写到 `<out-dir>/<planId>/` 下 |

执行步骤：

1. `GET /api/progress?planId=…`，查回放计划的进度。
2. `POST /api/report/queryPlanFailCase`，查这个计划里有差异或回放失败的用例（`diffResultCode` 为 1 和 2）；带 `--failed-only=false` 时查全部用例。
3. 对每个有差异的用例，查出可读的差异（`GET /api/report/queryDiffMsgById/{id}`）并写成 JSON 文件。回放失败的用例没有差异，只计数。

`data` 只是汇总，不列出用例。要拿用例编号（`replayId`、`traceId`），用 `sp replay case list --plan <planId> --failed --json`。

JSON 输出示例（`diagnose replay`）：

```json
{
  "ok": true,
  "command": "diagnose replay",
  "data": {
    "planId": "plan-abc123",
    "status": "",
    "classification": "invalid_target",
    "message": "Connection refused: travel-ota:9999",
    "failedCaseCount": 0,
    "invalidCaseCount": 12,
    "artifacts": null
  }
}
```

这个例子里，目标连不上，所有用例都回放失败（`invalidCaseCount`），没有差异，所以 `artifacts` 为 `null`。用例有差异时，`artifacts` 会列出能找到差异内容的那些用例的文件。目前后端的进度接口不返回计划状态，所以 `status` 为空；查进度请用 [sp replay status](./replay)。

`classification` 取值之一：`empty_window`、`invalid_target`、`assertion_failure`、`mixed`、`other`。`message` 来自后端的 `errorMessage` 或用例发送错误（如有），不是 CLI 自己编的文案。

`diagnose replay` 的输出没有 `nextActions` 字段（只有 `diagnose trace` 有）。自动化请用 `classification` 和 `message`。

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
