# Replay send log markers

**When agents use this:** Interpret sp-backend schedule logs around each replay HTTP dispatch — the critical entry and exit boundary between replay scheduling and your application.

These structured lines are emitted by **sp-schedule** (`DefaultHttpReplaySender`) immediately before and after each entry HTTP call. They appear in correlated log lookups (`sp logs --trace-id …`, unified trace log downloads) when `sp.source` is **`backend`** and `service_name` is typically **`sp-backend`**.

Query logs with the case **`traceId`** (same value as `recordedTraceId` in the message when correlation succeeded). See [sp logs command](../commands/logs.md).

---

## Message prefixes

| Prefix | Severity | Meaning |
|--------|----------|---------|
| `Replay send start:` | INFO | Schedule is about to invoke the recorded entry HTTP request |
| `Replay send done:` | INFO | HTTP exchange completed; response status and duration are recorded |
| `Replay send failed:` | WARN | HTTP exchange failed before a normal completion |

Each prefix is followed by comma-separated **`key=value`** pairs (SLF4J structured message, not JSON).

---

## Structured fields

| Field | On | Description |
|-------|-----|-------------|
| `planId` | start, done, failed | Replay **plan** id for the batch run |
| `targetEnv` | start, done, failed | `true` when sending to the configured replay test URL (`--env` / `targetEnv`); `false` for record-side sends |
| `method` | start, done, failed | HTTP method (`GET`, `POST`, …) |
| `url` | start, done, failed | Full URL schedule invoked (path and query string included) |
| `recordedTraceId` | start, done, failed | W3C trace id from the **recording**; should match `trace_id` on the log row when correlation succeeded |
| `spanId` | start, done, failed | OpenTelemetry span id active on the send path |
| `httpStatus` | done, failed | HTTP status code from the response, or **`-1`** when no response was received (connection error, timeout, DNS failure) |
| `durationMs` | done, failed | Wall-clock milliseconds for the HTTP exchange |
| `error` | failed only | Exception or error message when the send did not complete successfully |

---

## Example lines

```text
Replay send start: planId=6a3f2aad59f0c4655b0f99da, targetEnv=true, method=POST, url=http://order-service.test:8080/api/orders, recordedTraceId=2057ad46a7ce03d3955385f2a4142d29, spanId=8d10c94a2a6f4e11

Replay send done: planId=6a3f2aad59f0c4655b0f99da, targetEnv=true, method=POST, url=http://order-service.test:8080/api/orders, recordedTraceId=2057ad46a7ce03d3955385f2a4142d29, spanId=8d10c94a2a6f4e11, httpStatus=200, durationMs=142

Replay send failed: planId=6a3f2aad59f0c4655b0f99da, targetEnv=true, method=POST, url=http://order-service.test:8080/api/orders, recordedTraceId=2057ad46a7ce03d3955385f2a4142d29, spanId=8d10c94a2a6f4e11, httpStatus=-1, durationMs=30001, error=Connection refused
```

---

## How to use them

1. Obtain **`traceId`** from `sp replay case list --plan <planId> --failed --json` or replay metadata.
2. Pull correlated logs for a time window around the failure (see [Diagnose replay failure example](../examples/agent-diagnose-replay.md)).
3. Filter **`sp.source=backend`** rows whose **`body`** contains `Replay send start`, `Replay send done`, or `Replay send failed`.

| Observation | Likely cause |
|-------------|--------------|
| No `Replay send start` in the window | Case may not have reached HTTP send (preload, schedule, or plan cancellation) — check plan status first |
| `start` without matching `done` or `failed` | Send may still be in flight, or logs were truncated — widen the time window |
| `failed` with `httpStatus=-1` | Network or timeout reaching **`targetEnv`** — verify `--env` URL, DNS, firewall, and that the app is running |
| `failed` with 4xx/5xx | Application returned an error HTTP status — inspect agent and application logs after the `start` timestamp |
| `done` with 2xx but compare still fails | Entry request reached the app; investigate agent mock/compare behavior after the `done` line |

---

## Related ERROR lines (same send attempt)

These are **not** the entry/exit markers but often appear on the same failed send:

| Message prefix | Severity | Meaning |
|----------------|----------|---------|
| `Replay send error:` | ERROR | Stack trace after a failed send (follows `Replay send failed`) |
| `Replay send result invalid:` | ERROR | Response received but missing expected trace/replay headers for result extraction |

---

## Related

- [2. Replay and diff](/en/testing/replay-and-diff)
- [Diagnose replay failure example](../examples/agent-diagnose-replay.md)
- [sp logs command](../commands/logs.md)
