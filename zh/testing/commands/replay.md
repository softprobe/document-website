# sp replay

**When agents use this:** Start and monitor replay plans. For failed cases and diffs, see [replay case](./replay-case) and [replay diff](./replay-diff).

## Synopsis

Create, monitor, stop, and rerun replay plans against recorded cases.

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `run` | Create plan (`POST /api/createPlan`) |
| `status <planId>` | Poll progress (`GET /api/progress`) |
| `stop <planId>` | Stop plan |
| `rerun <planId>` | Re-run plan |

## Flags (`run`)

| Flag | API field | Description |
|------|-----------|-------------|
| `--app` | `appId` | Application id (required) |
| `--env` | `targetEnv` | **Replay target base URL** (required), not a symbolic name. Must include `http://` or `https://` and a host, e.g. `http://travel-ota:8080`. The CLI rejects values like `staging` or `dev`. |
| `--suite` | — | 用例套件。设置为 `Pinned` 时只选择手动置顶的用例，不支持选择 `AutoPinned`。 |
| `--from` | `caseSourceFrom` | Rolling 选择的开始时间（如 `-24h` 或 RFC3339）。使用 `--suite Pinned` 时忽略。 |
| `--to` | `caseSourceTo` | Rolling 选择的结束时间（默认当前时间）。使用 `--suite Pinned` 时忽略。 |
| `--limit` | `caseCountLimit` | Max cases |
| `--name` | `planName` | Display name |
| `--operation` | `operationIds` | Repeatable; filter operations |
| `--enable-mock` | `enableMock` | Mock during replay (default true) |
| `--no-mock` | `enableMock` | Disable mock (`enableMock=false`; overrides `--enable-mock`) |
| `--allow-empty` | — | Rolling 在时间窗内没有录制用例时仍创建计划（默认 false）。不能用它让空的 `Pinned` 套件运行。 |
| `--watch` | — | On `run`: create plan then poll until terminal; on `status`: poll an existing plan |

## Examples

```bash
sp record case list --app my-app --since -24h --json   # verify cases exist first
sp replay run --app my-app --env http://travel-ota:8080 --from -24h --enable-mock --json
sp replay run --app my-app --env http://travel-ota:8080 --suite Pinned --watch --json
sp replay run --app my-app --env http://travel-ota:8080 --from -24h --no-mock --watch --json
sp replay status plan-xyz --watch --json
sp replay stop plan-xyz --json
sp replay rerun plan-xyz --json
```

### 用例选择

默认选择模式是 **Rolling**：根据 `--from`/`--to` 时间窗选择用例（省略参数时使用最近 24 小时的默认滚动窗口）。

`--suite Pinned` 选择应用明确保存的手动 **Pinned** 用例集合。这不是时间窗查询，因此会忽略 `--from` 和 `--to`。即使用例早于普通录制窗口，也仍然可以回放。自动管理的 `AutoPinned` 用例不会被包含。

```bash
sp replay run \
  --app my-app \
  --env http://travel-ota:8080 \
  --suite Pinned \
  --watch \
  --json
```

### Preflight（`run`，Rolling）

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

使用 `--suite Pinned` 时，CLI 会改为检查手动 Pinned 集合。如果集合为空，命令会返回 `NO_PINNED_CASES`；`--allow-empty` 不能覆盖这项安全检查。

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
| `status` | GET | `/api/progress?planId=` |
| `stop` | GET | `/api/stopPlan?planId=` |
| `rerun` | POST | `/api/reRunPlan` |

Body for `run`: `BuildReplayPlanRequest` (schedule module).

Response envelope: `CommonResponse` (`result`, `desc`, `data`).

## Related

- [replay case](./replay-case)
- [replay diff](./replay-diff)
- [Diagnose replay failure](/zh/testing/examples/agent-diagnose-replay)
