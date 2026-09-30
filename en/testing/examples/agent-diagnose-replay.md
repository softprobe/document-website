---
title: Diagnose a failed replay
---

# Diagnose a failed replay

For AI agents and scripts: start from a failed replay plan — or from a business ID such as an order number — and get to the diff and the logs of the failing request.

## Before you start

```bash
export SP_API_URL=http://127.0.0.1:8090
export SP_TOKEN=<token>   # only if your deployment requires one
```

## In one command

```bash
sp diagnose replay <planId> --out-dir .sp-work --json
```

It writes the diffs of the failed cases as files and returns a summary; read the file paths in `data.artifacts`. See [sp diagnose](/en/testing/commands/diagnose).

## Step by step

### 1. Check the backend and find the app

```bash
sp health --json
sp app list --json
```

Take the `appId` from `data.items[].appId`.

### 2. Find the plan

Skip this if you already have a `planId`:

```bash
sp app replays <appId> --limit 5 --json
```

### 3. List the failed cases

```bash
sp replay case list --plan <planId> --failed --json
```

From each item in `data.items`, keep `replayId`, `traceId`, `operationId` and `diffResultCode` (`1` = has differences, `2` = failed to replay). `recordTime` and `replayTime` are useful if you need to query logs by time. `errorMessage` explains a failed replay.

### 4. Get the diffs {#4-get-the-diffs}

```bash
sp diagnose replay <planId> --out-dir .sp-work --json
```

It writes a JSON file for each case with differences whose diff it can find, and lists the paths in `data.artifacts`; go by that list — a case without a file may still have differences. Read the files in a separate step and compare `baseMsg` (recorded) with `testMsg` (replayed). Cases that failed to replay have no diff; start from their `errorMessage` and the logs.

### 5. Read the logs of that request {#logs}

Use the failed case's `traceId`. The HTTP API picks the time windows for you — one around the recording and one around each replay of that trace:

```bash
TRACE_ID=<traceId of the failed case>
curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&replay_id=<replayId>" \
  -H "Accept: application/json" -o .sp-work/logs-${TRACE_ID}.json

jq '[.rows[].source] | group_by(.) | map({source: .[0], n: length})' .sp-work/logs-${TRACE_ID}.json
jq '.warnings' .sp-work/logs-${TRACE_ID}.json
jq -r '.rows[] | select(.severity=="ERROR" or .severity=="WARN") | "\(.timestamp) \(.source) \(.body)"' .sp-work/logs-${TRACE_ID}.json | head -30
```

`replay_id` keeps the recording rows plus that one replay run. Without it, the backend scans the recording and up to the eight most recent replay runs of the trace. Read `warnings`: they tell you when a window couldn't be worked out or was cut short. With `sp logs` you have to give the window yourself:

```bash
sp logs --trace-id "$TRACE_ID" --since 2026-06-27T10:00:00Z --until 2026-06-27T10:05:00Z --json > .sp-work/logs.json
```

To check whether the replayed request actually reached your service, look at `backend` rows for `Replay send start` / `done` / `failed` — see [Replay send log markers](/en/testing/reference/replay-send-log-markers). How to read empty results: [sp logs — Reading the result](/en/testing/commands/logs#triage).

### 6. Optional: replay metadata

```bash
sp replay metadata <replayId> --json
```

Shows the replay's trace and the recording it is linked to.

## Start from a business ID {#business-id}

When the user says "order ORD-1234 failed in replay" and has no trace ID, look the trace up by the business attribute. This works when an [extraction rule](/en/testing/commands/extraction-rule) indexes that attribute:

```bash
sp trace find --app <appId> --attr-name orderId --attr-value ORD-1234 --json
```

If it returns several traces, check each one and keep the one whose time and interface match:

```bash
sp trace get <traceId> --json
```

Then look at what was recorded for it:

```bash
sp record query --trace-id <traceId> --out-dir .sp-work --json
sp record completeness <traceId> --json
```

From here, continue with the [logs](#logs) of that `traceId`, or find its replay cases in the plan.

Don't send the user to the console to find a trace ID when an extraction rule already indexes their business attribute — try `sp trace find` first.

## Prompt snippet for a skill

```markdown
When diagnosing a failed Softprobe replay:
1. `sp replay case list --plan <id> --failed --json` for replayId and traceId of each failed case
2. `sp diagnose replay <id> --out-dir .sp-work --json`, then read the files in data.artifacts; don't parse large stdout
3. Logs: `curl "$SP_API_URL/api/recorder/logs?trace_id=<traceId>&replay_id=<replayId>"`; read warnings first; count rows by source; read backend, then agent, then app ERROR/WARN lines
4. If you only have a business ID, run `sp trace find` first
```

## Related

- [Concepts and IDs](/en/testing/agents/concepts#ids)
- [sp logs](/en/testing/commands/logs)
- [sp replay diff](/en/testing/commands/replay-diff)
- [sp trace](/en/testing/commands/trace)
