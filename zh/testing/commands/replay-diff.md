# sp replay diff & logs

**When agents use this:** Deep dive on a failed case — diff bodies, compare JSON, replay-phase logs.

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `diff get <diffId>` | Base vs test messages (artifact) |
| `compare` | Full-link compare result |
| `logs [replayId]` | Replay log stream/query (`--overview` for summary) |
| `mock-tree <replayId>` | Mock tree for replay |
| `noise query` | Query noise rules |
| `noise exclude` | Exclude noise (`-f` + `--confirm`) |
| `realtime …` | Real-time replay queue (see below) |

## Examples

```bash
sp replay diff get diff-abc --out-dir .sp-work --json
sp replay compare --trace-id t1 --replay-id r1 --out-dir .sp-work --json
sp replay logs r1 --overview --json
sp replay logs r1 --limit 200 --keyword timeout --json
sp replay mock-tree replay-uuid --json
```

### JSON output (`diff get`)

```json
{
  "ok": true,
  "command": "replay diff get",
  "data": {
    "artifact": ".sp-work/diff-abc.json",
    "summary": {
      "diffId": "abc",
      "diffResultCode": 1,
      "categoryName": "ResponseBody"
    }
  }
}
```

Artifact contains decoded `baseMsg` and `testMsg` (JSON when parseable).

## REST mapping

| Subcommand | Method | Path |
|------------|--------|------|
| `diff get` | GET | `/api/report/queryDiffMsgById/{id}` |
| `compare` | POST | Schedule `/api/compareCase` + report APIs |
| `logs` (`--overview`) | GET | `/api/replay-logs/overview?replayId=...` |
| `logs` | GET | `/api/replay-logs/download?...` (normalized log entries) |
| `mock-tree` | GET | `/api/storage/replay-mock-tree/{replayId}` |
| `noise query` | GET | `/api/queryNoise` |
| `noise exclude` | POST | `/api/excludeNoise` |

### Real-time replay

| Subcommand | Path |
|------------|------|
| `realtime create` | `POST /api/createRealTimePlan` |
| `realtime queue pause <planId>` | `GET /api/queue/control/pause?planId=...` (`--confirm`) |
| `realtime queue resume <planId>` | `GET /api/queue/control/resume?planId=...` (`--confirm`) |
| `realtime log` | `POST /api/realtime/log/query` |

## Replaces `sp_api`

| sp_api | sp |
|--------|-----|
| `diff_detail` | `sp replay diff get` |
| `compare_result` | `sp replay compare` |
| `replay_log_overview` | `sp replay logs <replayId> --overview` |
| `download_replay_logs` | `sp replay logs <replayId>` |

## Related

- [Output contract](/zh/testing/agents/output-contract)
- [Diagnose replay failure](/zh/testing/examples/agent-diagnose-replay)
