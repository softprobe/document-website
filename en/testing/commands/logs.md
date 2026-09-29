# sp logs

Look up the application, Java agent and sp-backend log lines that belong to one request, by its `trace_id`. Use it after a replay fails to see what happened on both the recording and the replay side.

This needs the unified log pipeline to be enabled on the backend — see [Install sp-backend (server) — unified log pipeline](/en/testing/installation/server#unified-log-pipeline). When the pipeline is off or unavailable, lookups fail with an error instead of returning an empty result.

Where to get a `trace_id`: [Concepts and IDs — IDs](/en/testing/agents/concepts#ids).

## Synopsis

```bash
sp logs --trace-id <id> --since <time> --until <time> [--json]
```

## Flags

| Flag | Required | Description |
|------|----------|-------------|
| `--trace-id` | Yes | W3C trace ID of the request |
| `--since` | Yes | Start of the window, inclusive — ISO-8601 UTC, e.g. `2026-06-27T10:00:00Z` |
| `--until` | Yes | End of the window, exclusive — ISO-8601 UTC |
| `--json` | No | Standard JSON envelope for scripts and AI agents |

All three lookup flags are required. There is no `--limit`: redirect the output to a file and filter it locally. `sp logs` has no other filter flags; for filtering by replay run or phase, call the HTTP API below.

## Examples

```bash
sp logs \
  --trace-id 2057ad46a7ce03d3955385f2a4142d29 \
  --since 2026-06-27T10:00:00Z \
  --until 2026-06-27T10:05:00Z \
  --json > /tmp/trace-logs.json

jq '.data.rows | length' /tmp/trace-logs.json
jq -r '.data.rows[] | select(.severity=="ERROR") | "\(.timestamp) \(.source) \(.body)"' /tmp/trace-logs.json | head -20
```

Without `--json`, `sp logs` prints one line per row: timestamp, severity, `source`, `service_name` and the message.

## HTTP API {#http-api}

```http
GET /api/recorder/logs?trace_id=<id>[&since=<ts>&until=<ts>][&replay_id=…][&plan_id=…][&plan_item_id=…][&mode=record|replay][&source=…]
```

The API does more than the command:

- **`since` / `until` are optional, as a pair.** When you leave both out, the backend works out the windows from the trace itself, each padded by two minutes: one around the recording, and one around the replay given by `replay_id` — or, without `replay_id`, around each of the **eight most recent** replay runs of that trace (older runs are skipped, with a warning). Passing only one of the two is rejected.
- **Very wide windows are replaced.** If you pass a window longer than three hours, the backend scans the trace's own windows instead, when it can work them out; if it can't, it scans your window as asked (with a warning), and refuses anything longer than seven days.
- **A long request is scanned at both ends only.** If a window worked out from the trace is itself longer than three hours, only 90 minutes at each end are scanned (with a warning).
- The windows actually scanned are always listed in `lookup.windows`.
- **Optional filters:**

| Parameter | Effect |
|-----------|--------|
| `replay_id` | Keep rows from this replay run, plus recording rows (which carry no `replay_id`). Add `mode=replay` to drop the recording rows |
| `plan_id`, `plan_item_id` | Keep rows from this replay plan or plan item |
| `mode` | `record` or `replay` |
| `source` | `agent`, `app` or `backend` |

Any other parameter is rejected, not ignored.

```bash
export SP_API_URL="${SP_API_URL:-http://127.0.0.1:8090}"
TRACE_ID=2057ad46a7ce03d3955385f2a4142d29

# Let the backend pick the windows
curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}" \
  -H "Accept: application/json" -o /tmp/trace-logs.json

# Only one replay run
curl -s "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&replay_id=<replayId>&mode=replay" \
  -H "Accept: application/json" -o /tmp/trace-logs-replay.json
```

The API body is at the top level (`.rows`); `sp logs --json` wraps the same body in `.data` (`.data.rows`).

### When the backend can't work out the window {#explicit-windows}

<a id="case-scoped-lookup-dual-windows"></a>

The backend can't place a replay window when the replay failed before its first dependency call. With `replay_id` it says so in `warnings`; without it there is no warning, so a missing replay window doesn't prove there were no replay logs. A large clock difference between the application and the backend can also put a worked-out window on the wrong minutes. In these cases, query the recording and the replay **separately**, each with an explicit window:

1. From `sp replay case list --plan <planId> --failed --json`, take the case's `recordTime` (when it was recorded) and `requestDateTime` (when the replay request was sent; use `replayTime` if it's empty). Both are epoch milliseconds. If `recordTime` is empty, use the recording time shown for this trace under **Recordings → Rolling recordings**.
2. Query about two minutes either side of each time, with `replay_id` so other replay runs stay out, and keep both responses.

Save this as a script (for example `case-logs.sh`) and run it with `bash`:

```bash
#!/usr/bin/env bash
TRACE_ID=<traceId>; REPLAY_ID=<replayId>
RECORD_MS=<recordTime>; REPLAY_MS=<requestDateTime>
win() { s=$(( ($1 + $2) / 1000 )); date -u -d "@$s" +%FT%TZ 2>/dev/null || date -u -r "$s" +%FT%TZ; }
i=0
for T in "$RECORD_MS" "$REPLAY_MS"; do
  case "$T" in ''|*[!0-9]*|0) echo "missing timestamp: '$T'" >&2; exit 1;; esac
  i=$((i+1)); out="/tmp/logs-${TRACE_ID}-${i}.json"
  curl -sf "${SP_API_URL}/api/recorder/logs?trace_id=${TRACE_ID}&replay_id=${REPLAY_ID}&since=$(win "$T" -120000)&until=$(win "$T" 120000)" \
    -H "Accept: application/json" -o "$out" || { echo "request $i failed" >&2; exit 1; }
  jq -e 'has("rows")' "$out" >/dev/null || { echo "request $i: $(jq -c . "$out")" >&2; exit 1; }
done
# Keep every window and warning; rows found by both queries are kept once
jq -s '{windows: [.[].lookup.windows[]?], warnings: [.[].warnings[]?],
        rows: ([.[].rows[]] | unique_by([.timestamp, .source, .span_id, .body]) | sort_by(.timestamp))}' \
  "/tmp/logs-${TRACE_ID}-1.json" "/tmp/logs-${TRACE_ID}-2.json"
```

If the application's clock differs from the backend's by more than a couple of minutes, shift the windows by the difference or widen them. For a request that itself ran for hours, query consecutive windows of at most three hours each rather than just its start and end.

Don't pass one window that stretches from the recording time to the replay time: it spans every minute in between and is slow, or is refused.

## Output

| Field | Meaning |
|-------|---------|
| `lookup` | `type` (`trace`), `value` (the trace ID) and `windows` — the time windows actually scanned |
| `rows` | Log lines in time order — see [Log query fields](./log-query-fields) |
| `warnings` | Notices that didn't stop the query but may mean the result is **incomplete**: a window that couldn't be worked out, replay runs that were skipped, a window that was replaced or cut short. Read them before concluding that logs are missing |

```json
{
  "ok": true,
  "command": "logs",
  "data": {
    "lookup": {
      "type": "trace",
      "value": "2057ad46a7ce03d3955385f2a4142d29",
      "windows": [
        { "since": "2026-06-27T10:00:00Z", "until": "2026-06-27T10:05:00Z" }
      ]
    },
    "rows": [
      {
        "timestamp": "2026-06-27T10:00:10.123Z",
        "severity": "WARN",
        "body": "Replay comparison mismatch",
        "service_name": "sp-backend",
        "source": "backend",
        "trace_id": "2057ad46a7ce03d3955385f2a4142d29",
        "span_id": "8d10c94a2a6f4e11",
        "replay_id": "6891fd300c676b31",
        "effective_mode": "replay"
      }
    ],
    "warnings": []
  }
}
```

## Reading the result {#triage}

<a id="troubleshooting-failed-replays"></a>

```bash
# Rows per source
jq '[.data.rows[].source] | group_by(.) | map({source: .[0], n: length})' /tmp/trace-logs.json
# Notices
jq '.data.warnings' /tmp/trace-logs.json
# Backend errors first, then agent, then app
jq -r '.data.rows[] | select(.source=="backend" and .severity=="ERROR") | "\(.timestamp) \(.body)"' /tmp/trace-logs.json | head -20
```

| What you see | Likely cause | Next step |
|--------------|--------------|-----------|
| No rows, `warnings` not empty | The window could not be derived, or the backend's log reader doesn't match the stored schema | Read the warning; pass `since`/`until` explicitly, or upgrade sp-backend |
| No rows, no warnings | Wrong `trace_id`, wrong window, or the logs haven't been written yet | Take the `trace_id` from the failed replay case; widen the window; try again a few minutes later |
| Only `backend` rows | The agent isn't exporting logs, or the app logs nothing for this request | Check that the agent is attached and can reach the backend; check the app's log levels |
| Rows from `agent`, `app` and `backend` | The pipeline is fine | Read the ERROR/WARN lines, then look at the diff with [sp diagnose](./diagnose) |

To see whether the backend actually sent the replayed request to your service, filter `backend` rows for `Replay send start` / `done` / `failed` — see [Replay send log markers](/en/testing/reference/replay-send-log-markers).

## Errors

Invalid input and backend errors use the standard stderr envelope (see [Output contract](/en/testing/agents/output-contract#cli-envelope-stderr-on-failure-exit-1)):

```json
{
  "ok": false,
  "command": "logs",
  "error": {
    "code": "API_ERROR",
    "message": "API error 1: log pipeline is disabled",
    "httpStatus": 200,
    "backend": { "responseCode": 1, "responseDesc": "log pipeline is disabled" }
  }
}
```

Messages you may see: `trace_id is required`, `since is required`, `until is required`, `since must be before until`, `since and until must be ISO-8601 UTC timestamps`, `unsupported logs query parameter: <name>`, `log pipeline is disabled`, `log pipeline is unavailable`.

## Removed commands {#legacy}

These older log commands and endpoints no longer exist:

| Removed | Use instead |
|---------|-------------|
| `sp recorder logs`, `sp recorder query`, `sp recorder info`, `sp query` | `sp logs`, or the HTTP API above |
| `sp record logs overview`, `sp record logs download` | `sp logs … > file` |
| `sp replay logs` (including `--overview`) | `sp logs`, or the API with `replay_id` |
| `--include-recording-log` | Not needed: recording and replay share one `trace_id` |
| `source_summary` in the response | `jq` grouping by `source` (see above) |
| `GET /api/record-logs/*`, `GET /api/replay-logs/*` | `GET /api/recorder/logs?trace_id=…` |

## Related

- [Log query fields](./log-query-fields)
- [Concepts and IDs](/en/testing/agents/concepts#ids)
- [Diagnose a failed replay](/en/testing/examples/agent-diagnose-replay)
- [sp diagnose](./diagnose)
