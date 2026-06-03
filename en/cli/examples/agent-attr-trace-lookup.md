# Example: Business ID → trace

**Audience:** AI agents

**Goal:** User says "order ORD-1234 failed in replay" without providing `traceId`.

## Steps

```bash
sp app list --json
sp trace find \
  --app my-app \
  --attr-name orderId \
  --attr-value ORD-1234 \
  --json
```

If multiple traces:

```bash
sp trace get <traceId> --json
```

Pick the trace matching time window or endpoint.

## Continue diagnosis

```bash
sp record query --trace-id <traceId> --out-dir .sp-work --json
sp record completeness <traceId> --json
```

If a replay already exists:

```bash
sp replay metadata <replayId> --json
```

## Skill note

Do **not** ask the user to open the UI to find traceId when extraction rules index their business attributes. Prefer `sp trace find` first.

## Related

- [trace](/en/cli/commands/trace.md)
- [Diagnose replay failure](./agent-diagnose-replay.md)
