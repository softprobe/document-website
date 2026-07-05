# Example: Diagnose a failed replay

**Audience:** AI agent skill (OpenCode, Claude Code, Codex)

**Goal:** Given a failing replay plan, find failed cases, fetch diff artifact, triage unified logs by `trace_id`.

## Prerequisites

```bash
export SP_API_URL=http://127.0.0.1:8090
export SP_TOKEN=<jwt>
```

## One-shot (preferred)

```bash
sp diagnose replay plan-xyz --failed-only --out-dir .sp-work --json
```

Read `data.artifacts[]` paths locally. See [diagnose](/en/cli/commands/diagnose.md).

## Manual steps

### 1. Confirm backend and list apps

```bash
sp health --json
sp app list --json
```

Select `appId` from `data.items[].appId`.

### 2. Find the plan

If the user supplied `planId`, skip. Otherwise:

```bash
sp app replays my-app --limit 5 --json
```

### 3. List failed cases

```bash
sp replay case list --plan plan-xyz --failed --page 1 --limit 20 --json
```

From each item collect `diffId`, `replayId`, `planItemId`, and **`traceId`** (log lookup key).

### 4. Fetch diff (artifact)

```bash
sp replay diff get diff-abc --out-dir .sp-work --json
```

Parse `data.artifact` and read the JSON file in a follow-up tool call. Inspect `baseMsg` vs `testMsg`.

### 5. Optional: correlated runtime logs

Pull agent, application, and sp-backend logs for a failed case. Start with **backend replay send markers** — they show whether schedule reached your app:

```bash
sp recorder logs --replay-id <replayId> --since <start> --until <end> --json
# or: sp recorder logs --trace-id <traceId> --since <start> --until <end> --json
```

Filter `backend` rows for `Replay send start`, `Replay send done`, and `Replay send failed`. See [Replay send log markers](/en/cli/reference/replay-send-log-markers).

When failure may be recording-time agent behavior:

```bash
TRACE_ID="<traceId from failed case>"
SINCE="2026-06-27T10:00:00Z"
UNTIL="2026-06-27T10:05:00Z"

curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&since=${SINCE}&until=${UNTIL}" \
  -H "Accept: application/json" -o .sp-work/unified-logs.json

jq '.rows | length' .sp-work/unified-logs.json
jq '[.rows[].source] | group_by(.) | map({source: .[0], n: length})' .sp-work/unified-logs.json
jq '.warnings' .sp-work/unified-logs.json
jq -r '.rows[] | select(.source=="backend" and .severity=="ERROR") | .body' .sp-work/unified-logs.json | head -20
```

When `sp logs` CLI ships:

```bash
sp logs --trace-id "$TRACE_ID" --since "$SINCE" --until "$UNTIL" --json > .sp-work/unified-logs.json
```

**Triage:** empty rows + `warnings` → backend/schema skew; empty + no warnings → wrong window or ingest lag; all three `source` values → pipeline OK, focus on diff + log bodies.

See [Log correlation IDs](/en/cli/guide/log-correlation-ids.md) and [sp logs](/en/cli/commands/logs.md).

Do **not** use `sp recorder logs --replay-id`, `sp record logs`, `sp replay logs`, or legacy `/api/record-logs/*` / `/api/replay-logs/*`.

### 6. Optional: metadata for full-link

```bash
sp replay metadata <replayId> --json
```

Use `data.fullLink` to decide if `sp replay compare` needs `traceId`.

## Skill prompt snippet

```markdown
When diagnosing SoftProbe replay failures:
1. Run `sp replay case list --plan <id> --failed --json`
2. For each diffId: `sp replay diff get <id> --out-dir .sp-work --json`
3. Read the artifact file path from JSON; do not parse multi-MB stdout
4. For logs: copy `traceId` from the failed case; curl `GET /api/recorder/logs?trace_id=…&since=…&until=…`; jq row count and group by `source`; read backend then agent then app ERROR lines
5. On pytest failure: read Softprobe correlation (`trace_id`) and Unified logs summary in output
6. If traceId unknown, ask user for business ID and run `sp trace find`
```

## Related

- [Replay send log markers](/en/cli/reference/replay-send-log-markers)
- [replay-diff](/en/cli/commands/replay-diff.md)
- [sp logs](/en/cli/commands/logs.md)
- [Log correlation IDs](/en/cli/guide/log-correlation-ids.md)
