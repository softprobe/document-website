# sp recorder logs (retired)

**This page is retired.** v1 unified log lookup is **trace-id-only** via [sp logs](./logs.md) and `GET /api/recorder/logs?trace_id=…`.

| Retired | Replacement |
|---------|-------------|
| `sp recorder logs --replay-id` | `sp logs --trace-id <traceId> …` or HTTP API with `trace_id` |
| `sp recorder logs --plan-id` / `--plan-item-id` | Resolve per-case **`traceId`**, then `sp logs --trace-id …` |
| `--include-recording-log` | **Removed** — record and replay share the same `trace_id` on replay |
| `source_summary` in responses | **Removed** — use `jq` to group rows by `source` |

Obtain **`traceId`** from replay case JSON, pytest **Softprobe correlation** output, or [Log correlation IDs](/en/cli/guide/log-correlation-ids.md).

See [sp logs](./logs.md) for flags, examples, triage workflow, and API mapping.
