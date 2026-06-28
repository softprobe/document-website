# Example: Diagnose a failed replay

**Audience:** AI agent skill (OpenCode, Claude Code, Codex)

**Goal:** Given a failing replay plan, find failed cases, fetch diff artifact, optionally inspect record logs.

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

From each item collect `diffId`, `replayId`, `planItemId`, `traceId`.

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

Filter `sp.source=backend` rows for `Replay send start`, `Replay send done`, and `Replay send failed`. See [Replay send log markers](/en/cli/reference/replay-send-log-markers).

When failure may be recording-time agent behavior:

```bash
sp record logs overview --trace-id <traceId> --json
sp record logs download --trace-id <traceId> --out-dir .sp-work --json
```

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
4. For logs: `sp recorder logs --replay-id <replayId> …` — grep backend rows for `Replay send start/done/failed` (see Replay send log markers reference)
5. If traceId unknown, ask user for business ID and run `sp trace find`
```

## Related

- [Replay send log markers](/en/cli/reference/replay-send-log-markers)
- [replay-diff](/en/cli/commands/replay-diff.md)
