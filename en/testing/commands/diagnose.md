# sp diagnose

**When agents use this:** One-shot workflows that combine progress, report, storage, and trace APIs — fewer manual steps than chaining low-level commands.

## Synopsis

| Subcommand | Description |
|------------|-------------|
| `replay <planId>` | Plan progress, failed cases, diff artifacts on disk |
| `trace <traceId>` | Record trace, completeness, summary artifacts |

## `diagnose replay`

Replaces the manual sequence in [Diagnose replay failure](/en/testing/examples/agent-diagnose-replay):

```bash
sp diagnose replay plan-abc123 --failed-only --out-dir .sp-work --json
```

| Flag | Default | Description |
|------|---------|-------------|
| `--failed-only` | `true` | Filter to cases with compare failures |
| `--out-dir` | `.sp-work` | Write `{planId}/{planItemId}-diff.json` files |
| `--page` / `--limit` | global | Pagination for case query |

Steps performed:

1. `POST /api/report/queryPlanStatistic` — plan status + case counts (drives `classification` when fail-case rows are empty)
2. `POST /api/report/queryPlanFailCase` with `diffResultCodeList=[1,2]` when `--failed-only` (plan-scoped fail/invalid cases)
3. For each assertion-failure case with a diff id: `GET /api/report/queryDiffMsgById/{id}` → artifact file

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

`classification` is one of: `empty_window`, `invalid_target`, `assertion_failure`, `mixed`, `other`. `message` comes from backend `errorMessage` or case send errors when available — not fabricated client copy.

**Note:** `nextActions` was removed from `diagnose replay --json` output (feature 007). Use `classification` + `message` for automation.

## `diagnose trace`

```bash
sp diagnose trace 4bf92f3577b34da6a3ce929d0e0e4736 --out-dir .sp-work --json
```

Fetches:

- `GET /api/storage/record/trace/{traceId}`
- `GET /api/storage/record/completeness?traceId=…`
- Trace summary (when available)

Writes JSON under `{outDir}/trace-{traceId}/` and returns a summary plus `nextActions` (e.g. `sp record query --trace-id …`).

## After diagnose: unified logs

`diagnose replay` returns diff artifacts but not runtime log lines. For each failed case:

1. Copy **`traceId`** from `sp replay case list --plan <planId> --failed --json` (v1 log lookup key — not `replayId`).
2. Query unified logs:

```bash
curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&since=${SINCE}&until=${UNTIL}" \
  -H "Accept: application/json" -o .sp-work/unified-logs.json

jq '.rows | length' .sp-work/unified-logs.json
jq '[.rows[].source] | group_by(.) | map({source: .[0], n: length})' .sp-work/unified-logs.json
```

3. Triage: empty rows + `warnings` → reader/schema issue; empty + no warnings → wrong window or ingest lag; rows from `agent`, `app`, and `backend` → pipeline OK, read `body` and diff artifacts together.

On **`make e2e`** failures, pytest prints **Softprobe correlation** (`trace_id`) and **Unified logs** summaries — use those before widening the investigation.

See [Log correlation IDs](/en/testing/reference/log-correlation-ids) and [sp logs — troubleshooting](./logs#troubleshooting-failed-replays).

## Related

- [Log correlation IDs](/en/testing/reference/log-correlation-ids)
- [replay](./replay)
- [replay diff](./replay-diff)
- [record](./record)
- [trace](./trace)
