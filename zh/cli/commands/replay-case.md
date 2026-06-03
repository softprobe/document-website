::: warning CLI reference (English)
The `sp` CLI documentation is available in English. [Switch to English CLI docs](/en/cli/guide/overview).
:::

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
```

## REST mapping

| Subcommand | APIs |
|------------|------|
| `metadata` | Storage replay query / schedule metadata endpoints |
| `case list` | `/api/report/queryReplayCase`, storage `viewRecord`, schedule report |
| `case get` | Report query by planItemId |

Exact paths vary by deployment; see [API mapping](/en/cli/reference/api-mapping.md).

## Replaces `sp_api`

| sp_api | sp |
|--------|-----|
| `query_replay_metadata` | `sp replay metadata` |
| `query_plan_fail_cases` | `sp replay case list --plan … --failed` |
| `query_replay_case` | `sp replay case list` |

## Related

- [replay-diff](./replay-diff.md)
- [Diagnose replay failure](/en/cli/examples/agent-diagnose-replay.md)
