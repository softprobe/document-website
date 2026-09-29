# sp diagnose

**When agents use this:** One-shot workflows that combine progress, report, storage, and trace APIs — fewer manual steps than chaining low-level commands.

## Synopsis

| Subcommand | Description |
|------------|-------------|
| `replay <planId>` | Plan progress, failed cases, diff artifacts on disk |
| `trace <traceId>` | Record trace, completeness, summary artifacts |

## `diagnose replay`

Collects what you need to look at a failed replay plan:

```bash
sp diagnose replay plan-abc123 --out-dir .sp-work --json
```

| Flag | Default | Description |
|------|---------|-------------|
| `--failed-only` | `true` | Only cases that didn't pass |
| `--out-dir` | `.sp-work` | Where the diff files are written (under `<out-dir>/<planId>/`) |

Steps performed:

1. `GET /api/progress?planId=…` for the plan's progress.
2. `POST /api/report/queryPlanFailCase` for the plan's cases that have differences or failed to replay (`diffResultCode` 1 and 2); with `--failed-only=false`, all cases.
3. For each case with differences, it looks up the readable diff (`GET /api/report/queryDiffMsgById/{id}`) and writes it to a JSON file. Cases that failed to replay have no diff and are only counted.

`data` is a summary: it doesn't list the cases. For case IDs (`replayId`, `traceId`), use `sp replay case list --plan <planId> --failed --json`.

Example JSON output (`diagnose replay`):

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

In this example every case failed to replay because the target was unreachable, so there are no diffs and `artifacts` is `null`. When cases have differences, `artifacts` lists the files for those whose diff could be found. `status` is empty with current backends (the progress API doesn't report a plan status); use [sp replay status](./replay) for progress.

`classification` is one of: `empty_window`, `invalid_target`, `assertion_failure`, `mixed`, `other`. `message` comes from backend `errorMessage` or case send errors when available — not fabricated client copy.

`diagnose replay` has no `nextActions` field (only `diagnose trace` does). Use `classification` and `message` for automation.

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
