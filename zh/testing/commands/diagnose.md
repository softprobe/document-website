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

1. `GET /api/progress?planId=…` — plan progress (feeds diagnose summary / classification inputs)
2. `POST /api/report/queryPlanFailCase` with `diffResultCodeList=[1,2]` when `--failed-only` (plan-scoped fail/invalid cases)
3. For each assertion-failure case with a resolvable diff id: `GET /api/report/queryDiffMsgById/{id}` → artifact file

Example `data` shape:

```json
{
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
```

`classification` 取值之一：`empty_window`、`invalid_target`、`assertion_failure`、`mixed`、`other`。`message` 在可用时来自后端 `errorMessage` 或 case 发送错误——不是客户端伪造的固定文案。

**注意：** `nextActions` 已从 `diagnose replay --json` 输出中移除（feature 007）。请改用 `classification` + `message` 做自动化。

## `diagnose trace`

```bash
sp diagnose trace 4bf92f3577b34da6a3ce929d0e0e4736 --out-dir .sp-work --json
```

Fetches:

- `GET /api/storage/record/trace/{traceId}`
- `GET /api/storage/record/completeness?traceId=…`
- Trace summary (when available)

Writes JSON under `{outDir}/trace-{traceId}/` and returns a summary plus `nextActions` (e.g. `sp record query --trace-id …`).

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
