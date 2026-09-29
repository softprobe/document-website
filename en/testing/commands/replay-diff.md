# sp replay diff

**When agents use this:** Deep dive on a failed case — diff bodies, compare JSON. For correlated logs use [`sp logs`](./logs).

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `diff get <diffId>` | Base vs test messages (artifact) |
| `compare` | Full-link compare result |
| `mock-tree <replayId>` | Mock tree for replay |
| `noise query` | Query noise rules |
| `noise exclude` | Exclude noise (`-f` + `--confirm`) |
| `realtime …` | Real-time replay queue (see below) |

## Examples

```bash
sp replay diff get diff-abc --out-dir .sp-work --json
sp replay compare --trace-id t1 --replay-id r1 --out-dir .sp-work --json
sp logs --trace-id <trace-id> --since 2026-06-27T10:00:00Z --until 2026-06-27T10:05:00Z --json
sp replay mock-tree replay-uuid --json
```

### JSON output (`diff get`)

```json
{
  "ok": true,
  "command": "replay diff get",
  "data": {
    "diffId": "abc",
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

### JSON output (`compare`)

```json
{
  "ok": true,
  "command": "replay compare",
  "data": {
    "replayId": "r1",
    "traceId": "t1"
  }
}
```

When `--plan-item` is provided, full-link compare detail is persisted to `--out-dir`:

```json
{
  "ok": true,
  "command": "replay compare",
  "data": {
    "artifact": ".sp-work/compare-t1.json",
    "replayId": "r1",
    "traceId": "t1",
    "summary": {
      "planItemId": "item-abc"
    }
  }
}
```

### JSON output (`mock-tree`)

```json
{
  "ok": true,
  "command": "replay mock-tree",
  "data": {
    "replayId": "replay-uuid",
    "artifact": ".sp-work/mock-tree-replay-uuid.json"
  }
}
```

The tree is always written to the file in `data.artifact`, never inline.

### JSON output (`noise query`)

```json
{
  "ok": true,
  "command": "replay noise query",
  "data": {
    "interfaceNoiseItemList": [
      {
        "categoryName": "ResponseBody",
        "operationName": "GET /api/orders/{id}",
        "path": "data.timestamp",
        "reason": "Dynamic timestamp"
      }
    ]
  }
}
```

### JSON output (`noise exclude`)

```json
{
  "ok": true,
  "command": "replay noise exclude",
  "data": true
}
```

## REST mapping

| Subcommand | Method | Path |
|------------|--------|------|
| `diff get` | GET | `/api/report/queryDiffMsgById/{id}` |
| `compare` | POST | Schedule `/api/compareCase` + report APIs |
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
| `replay_log_overview` | `sp logs --trace-id …` |
| `download_replay_logs` | `sp logs --trace-id …` → file + `grep` |

## Related

- [Output contract](/en/testing/agents/output-contract)
- [Diagnose replay failure](/en/testing/examples/agent-diagnose-replay)
