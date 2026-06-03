::: warning CLI reference (English)
The `sp` CLI documentation is available in English. [Switch to English CLI docs](/en/cli/guide/overview).
:::

# sp replay

**When agents use this:** Start and monitor replay plans. For failed cases and diffs, see [replay case](./replay-case.md) and [replay diff](./replay-diff.md).

## Synopsis

Create, monitor, stop, and rerun replay plans against recorded cases.

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `run` | Create plan (`POST /api/createPlan`) |
| `status <planId>` | Poll progress (`GET /progress`) |
| `stop <planId>` | Stop plan |
| `rerun <planId>` | Re-run plan |

## Flags (`run`)

| Flag | API field | Description |
|------|-----------|-------------|
| `--app` | `appId` | Application id (required) |
| `--env` | `targetEnv` | **Replay target base URL** (required), not a symbolic name. Must include `http://` or `https://` and a host, e.g. `http://travel-ota:8080`. The CLI rejects values like `staging` or `dev`. |
| `--from` | `caseSourceFrom` | Start time (duration e.g. `-24h` or RFC3339) |
| `--to` | `caseSourceTo` | End time (default: now) |
| `--limit` | `caseCountLimit` | Max cases |
| `--name` | `planName` | Display name |
| `--operation` | `operationIds` | Repeatable; filter operations |
| `--enable-mock` | `enableMock` | Mock during replay (default true) |
| `--no-mock` | `enableMock` | Disable mock (`enableMock=false`; overrides `--enable-mock`) |
| `--allow-empty` | — | Create plan even when no recorded cases in window (default false) |
| `--watch` | — | On `run`: create plan then poll until terminal; on `status`: poll an existing plan |

## Examples

```bash
sp record case list --app my-app --since -24h --json   # verify cases exist first
sp replay run --app my-app --env http://travel-ota:8080 --from -24h --enable-mock --json
sp replay run --app my-app --env http://travel-ota:8080 --from -24h --no-mock --watch --json
sp replay status plan-xyz --watch --json
sp replay stop plan-xyz --json
sp replay rerun plan-xyz --json
```

### Preflight (`run`)

Before `POST /api/createPlan`, the CLI queries `POST /api/storage/replay/query/replayCase` for the same `--app`, `--from`, and `--to` window. If no entry cases exist and `--allow-empty` is not set:

```json
{
  "ok": false,
  "command": "replay run",
  "error": {
    "code": "NO_RECORDED_CASES",
    "message": "no recorded cases for app …; run the app with the agent and send traffic first, or use --allow-empty"
  }
}
```

### JSON output (`run`)

```json
{
  "ok": true,
  "command": "replay run",
  "data": {
    "planId": "plan-xyz",
    "result": 1,
    "desc": "success"
  }
}
```

### JSON output (`run --watch`)

With `--json`, stdout is newline-delimited envelopes:

1. One success envelope for plan creation (`command`: `replay run`).
2. One or more progress envelopes (`command`: `replay status`).
3. The final progress envelope includes `"finished": true` in `data`.

### JSON output (`status`)

```json
{
  "ok": true,
  "command": "replay status",
  "data": {
    "planId": "plan-xyz",
    "status": "RUNNING",
    "percent": 42,
    "finished": false
  }
}
```

## REST mapping

| Subcommand | Method | Path |
|------------|--------|------|
| `run` | POST | `/api/createPlan` |
| `run` (webhook style) | GET | `/api/createPlan?appId=…` (discouraged for CLI; use POST) |
| `status` | GET | `/progress?planId=` |
| `stop` | GET | `/api/stopPlan?planId=` |
| `rerun` | POST | `/api/reRunPlan` |

Body for `run`: `BuildReplayPlanRequest` (schedule module).

Response envelope: `CommonResponse` (`result`, `desc`, `data`).

## Related

- [replay case](./replay-case.md)
- [replay diff](./replay-diff.md)
- [Diagnose replay failure](/en/cli/examples/agent-diagnose-replay.md)
