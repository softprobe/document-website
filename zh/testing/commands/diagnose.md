# sp diagnose

**When agents use this:** One-shot workflows that combine progress, report, storage, and trace APIs — fewer manual steps than chaining low-level commands.

## Synopsis

| Subcommand | Description |
|------------|-------------|
| `replay <planId>` | Plan progress, failed cases, diff artifacts on disk |
| `trace <traceId>` | Record trace, completeness, summary artifacts |

## `diagnose replay`

Replaces the manual sequence in [Diagnose replay failure](/zh/testing/examples/agent-diagnose-replay):

```bash
sp diagnose replay plan-abc123 --failed-only --out-dir .sp-work --json
```

| Flag | Default | Description |
|------|---------|-------------|
| `--failed-only` | `true` | Filter to cases with compare failures |
| `--out-dir` | `.sp-work` | Write `{planId}/{planItemId}-diff.json` files |
| `--page` / `--limit` | global | Pagination for case query |

Steps performed:

1. `GET /api/progress?planId=…`
2. `POST /api/report/queryReplayCase` with `diffResultCode=1` when `--failed-only`
3. For each failed case with `diffId`: `GET /api/report/queryDiffMsgById/{id}` → artifact file

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

`classification` 取值之一：`empty_window`、`invalid_target`、`assertion_failure`、`mixed`、`other`。`message` 在可用时来自后端 `errorMessage` 或 case 发送错误——不是客户端伪造的固定文案。

**注意：** `nextActions` 已从 `diagnose replay --json` 输出中移除（feature 007）。请改用 `classification` + `message` 做自动化。

## `diagnose trace`

```bash
sp diagnose trace 4bf92f3577b34da6a3ce929d0e0e4736 --out-dir .sp-work --json
```

执行步骤：

- `GET /api/storage/record/trace/{traceId}`
- `GET /api/storage/record/completeness?traceId=…`
- Trace summary（可用时）

将 JSON 写入 `{outDir}/trace-{traceId}/`，并返回摘要和 `nextActions`：

### JSON 输出 (`diagnose trace`)

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

## diagnose 之后：统一日志

`diagnose replay` 返回 diff 产物，但不包含运行时日志行。对每个失败的 case：

1. 从 `sp replay case list --plan <planId> --failed --json` 复制 **`traceId`**（v1 日志查询键——不是 `replayId`）。
2. 查询统一日志：

```bash
curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&since=${SINCE}&until=${UNTIL}" \
  -H "Accept: application/json" -o .sp-work/unified-logs.json

jq '.rows | length' .sp-work/unified-logs.json
jq '[.rows[].source] | group_by(.) | map({source: .[0], n: length})' .sp-work/unified-logs.json
```

3. 分诊：rows 为空 + 有 `warnings` → reader/schema 问题；为空 + 无 warnings → 时间窗错误或摄入延迟；来自 `agent`、`app`、`backend` 的 rows → 管道正常，结合 `body` 与 diff 产物一起阅读。

在 **`make e2e`** 失败时，pytest 会打印 **Softprobe correlation**（`trace_id`）和 **Unified logs** 摘要——先看这些，再扩大排查范围。

参见 [日志关联 ID](/zh/testing/reference/log-correlation-ids) 和 [sp logs — 排查回放失败](./logs#troubleshooting-failed-replays)。

## Related

- [日志关联 ID](/zh/testing/reference/log-correlation-ids)
- [replay](./replay)
- [replay diff](./replay-diff)
- [record](./record)
- [trace](./trace)
