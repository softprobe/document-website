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

1. `GET /api/progress?planId=…`
2. `POST /api/report/queryReplayCase` with `diffResultCode=1` when `--failed-only`
3. For each failed case with `diffId`: `GET /api/report/queryDiffMsgById/{id}` → artifact file

Example JSON output (`diagnose replay`):

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

Writes JSON under `{outDir}/trace-{traceId}/` and returns a summary plus `nextActions`:

### JSON output (`diagnose trace`)

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

## After diagnose: logs {#after-diagnose-logs}

`diagnose replay` writes diff files but no log lines. For the logs of a failed case, take its `traceId` from `sp replay case list --plan <planId> --failed --json` and look them up — see [Diagnose a failed replay — logs](/en/testing/examples/agent-diagnose-replay#logs) and [sp logs](./logs).

## Related

- [sp logs](./logs)
- [Concepts and IDs](/en/testing/agents/concepts#ids)
- [replay](./replay)
- [replay diff](./replay-diff)
- [record](./record)
- [trace](./trace)
