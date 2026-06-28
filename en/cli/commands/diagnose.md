# sp diagnose

**When agents use this:** One-shot workflows that combine progress, report, storage, and trace APIs — fewer manual steps than chaining low-level commands.

## Synopsis

| Subcommand | Description |
|------------|-------------|
| `replay <planId>` | Plan progress, failed cases, diff artifacts on disk |
| `trace <traceId>` | Record trace, completeness, summary artifacts |

## `diagnose replay`

Replaces the manual sequence in [Diagnose replay failure](/en/cli/examples/agent-diagnose-replay.md):

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

Example `data` shape:

```json
{
  "planId": "plan-abc123",
  "status": "FINISHED",
  "failedCaseCount": 2,
  "artifacts": [
    ".sp-work/plan-abc123/item-1-diff.json"
  ],
  "nextActions": [
    "sp record trace <traceId> --json"
  ]
}
```

## `diagnose trace`

```bash
sp diagnose trace 4bf92f3577b34da6a3ce929d0e0e4736 --out-dir .sp-work --json
```

Fetches:

- `GET /api/storage/record/trace/{traceId}`
- `GET /api/storage/record/completeness?traceId=…`
- Trace summary (when available)

Writes JSON under `{outDir}/trace-{traceId}/` and returns a summary plus `nextActions` (e.g. `sp record query --trace-id …`).

## Related

- [Log correlation IDs](/en/cli/guide/log-correlation-ids.md)
- [replay](./replay.md)
- [replay diff](./replay-diff.md)
- [record](./record.md)
- [trace](./trace.md)
