---
title: Replay send log markers
---

# Replay send log markers

When the backend replays a case, it logs one line just before it sends the recorded entry request to your service and one line after. These lines tell you whether a failed case ever reached your application.

They are `backend` rows (`service_name` is usually `sp-backend`) in a log lookup by the case's `traceId` — see [sp logs](/en/testing/commands/logs). When correlation works, `recordedTraceId` in the message equals the row's `trace_id`.

## Messages {#message-prefixes}

| Prefix | Level | Meaning |
|--------|-------|---------|
| `Replay send start:` | INFO | About to send the recorded entry request |
| `Replay send done:` | INFO | Got a response; status and duration are included |
| `Replay send failed:` | WARN | No successful response: connection error, timeout, or a 4xx/5xx status from the service |
| `Replay send slow:` | WARN | The request took longer than 10 seconds (logged after `done`) |

Each prefix is followed by comma-separated `key=value` pairs (plain text, not JSON).

## Fields {#structured-fields}

| Field | In | Description |
|-------|----|-------------|
| `planId` | start, done, failed, slow | Replay plan ID |
| `targetEnv` | start, done, failed | `true` when the request goes to the replay target URL (`--env` / `targetEnv`) |
| `method` | all | HTTP method (`GET`, `POST`, …) |
| `url` | all | Full URL that was called, including the query string |
| `recordedTraceId` | start, done, failed | Trace ID from the recording |
| `spanId` | start, done, failed | Span ID active while sending |
| `httpStatus` | done, failed | Response status code on `done`; always `-1` on `failed` |
| `durationMs` | done, failed, slow | Time spent on the request, in milliseconds |
| `error` | failed | Error message. When the service answered with a 4xx/5xx status, the status is in here (for example `500 Internal Server Error`) |

## Examples {#example-lines}

```text
Replay send start: planId=6a3f2aad59f0c4655b0f99da, targetEnv=true, method=POST, url=http://order-service.test:8080/api/orders, recordedTraceId=2057ad46a7ce03d3955385f2a4142d29, spanId=8d10c94a2a6f4e11

Replay send done: planId=6a3f2aad59f0c4655b0f99da, targetEnv=true, method=POST, url=http://order-service.test:8080/api/orders, recordedTraceId=2057ad46a7ce03d3955385f2a4142d29, spanId=8d10c94a2a6f4e11, httpStatus=200, durationMs=142

Replay send failed: planId=6a3f2aad59f0c4655b0f99da, targetEnv=true, method=POST, url=http://order-service.test:8080/api/orders, recordedTraceId=2057ad46a7ce03d3955385f2a4142d29, spanId=8d10c94a2a6f4e11, httpStatus=-1, durationMs=30001, error=Connection refused
```

## How to use them {#how-to-use-them}

1. Take the `traceId` of the failed case from `sp replay case list --plan <planId> --failed --json`.
2. Look up its logs (see [Diagnose a failed replay — logs](/en/testing/examples/agent-diagnose-replay#logs)).
3. Keep `source=backend` rows whose `body` starts with `Replay send`.

| What you see | Likely cause |
|--------------|--------------|
| No `Replay send start` | The case never got as far as sending — check the plan's status first (it may have been stopped, or failed while preparing) |
| `start` with no `done` or `failed` | The request may still be running, or the window is too narrow — widen it |
| `failed`, and `error` is a connection error or timeout | The backend couldn't reach the target — check the `--env` URL, DNS, firewall, and that the service is running |
| `failed`, and `error` starts with a 4xx/5xx status | The service answered with an error — read the agent and app logs after the `start` time |
| `done` with 2xx, but the case still fails | The request reached the service; the difference is in the response or in mocking — look at the diff |

## Related error lines {#related-error-lines-same-send-attempt}

These often show up for the same request:

| Prefix | Level | Meaning |
|--------|-------|---------|
| `Replay send error:` | ERROR | Stack trace of a failed send (follows `Replay send failed`) |
| `Replay send result invalid:` | ERROR | A response came back, but without the headers needed to read the replay result |

## Related {#related}

- [Replay and diff](/en/testing/replay-and-diff)
- [Diagnose a failed replay](/en/testing/examples/agent-diagnose-replay)
- [sp logs](/en/testing/commands/logs)
