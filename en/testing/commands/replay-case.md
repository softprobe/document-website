# sp replay (data)

**When agents use this:** After `sp replay run` completes — list failed cases, fetch metadata, paginate cases.

## Synopsis

Query replay plans, cases, and metadata (read-only report/storage APIs).

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `metadata <replayId>` | Replay metadata (nodes, fullLink, traceId) |
| `case list` | Cases under plan or plan item |
| `case get <caseId>` | Single case detail (`--plan-item` required) |

## Flags (`case list`)

| Flag | Description |
|------|-------------|
| `--plan` | Plan id |
| `--plan-item` | Plan item / operation id |
| `--failed` | Only failed/error cases |
| `--diff-result-code` | Filter by diff code (1=diff, 2=error) |
| `--page` / `--limit` | Pagination |

## Examples

```bash
sp replay metadata replay-uuid --json
sp replay case list --plan plan-xyz --failed --page 1 --limit 20 --json
sp replay case list --plan-item item-abc --json
sp replay case get case-001 --plan-item item-abc --json
```

### JSON output (`metadata`)

```json
{
  "ok": true,
  "command": "replay metadata",
  "data": {
    "replayId": "replay-uuid",
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
    "fullLink": true,
    "nodes": [
      {
        "nodeId": "order-service",
        "status": "SUCCESS"
      }
    ]
  }
}
```

### JSON output (`case list`)

```json
{
  "ok": true,
  "command": "replay case list",
  "data": {
    "items": [
      {
        "caseId": "case-001",
        "replayId": "replay-uuid-001",
        "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
        "operationId": "item-abc",
        "diffResultCode": 1,
        "recordTime": 1747564800000,
        "replayTime": 1747568400000
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1
  }
}
```

### JSON output (`case get`)

```json
{
  "ok": true,
  "command": "replay case get",
  "data": {
    "caseId": "case-001",
    "replayId": "replay-uuid-001",
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
    "diffId": "diff-883311",
    "diffResultCode": 1,
    "operationId": "item-abc",
    "recordTime": 1747564800000,
    "replayTime": 1747568400000
  }
}
```

## REST mapping

| Subcommand | APIs |
|------------|------|
| `metadata` | Storage replay query / schedule metadata endpoints |
| `case list` | `/api/report/queryReplayCase`, storage `viewRecord`, schedule report |
| `case get` | Report query by planItemId |

Exact paths vary by deployment; see [API mapping](/en/testing/reference/api-mapping).

## Replaces `sp_api`

| sp_api | sp |
|--------|-----|
| `query_replay_metadata` | `sp replay metadata` |
| `query_plan_fail_cases` | `sp replay case list --plan … --failed` |
| `query_replay_case` | `sp replay case list` |

## Related

- [replay-diff](./replay-diff)
- [Diagnose replay failure](/en/testing/examples/agent-diagnose-replay)
