# sp trace

**When agents use this:** User provides business ID (orderId, caseId) instead of traceId — **preferred discovery path**.

## Synopsis

Attribute-based trace lookup, trace summaries, and recorded outbound HTTP calls.

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `find` | Reverse lookup traces by extraction rule or business attribute |
| `get <traceId>` | Summary metadata and extracted attributes |
| `outbound <traceId>` | Recorded `SERVER` entry span and outgoing `CLIENT` HTTP calls |
| `stats` | Attribute rule statistics |

## Flags (`find`)

| Flag | Description |
|------|-------------|
| `--app` | Application id (required) |
| `--attr-name` | Rule name (for example `orderId`) |
| `--attr-value` | Business value (for example `ORD-1234`) |
| `--since` / `--until` | Epoch ms window (default: last 7 days) |
| `--limit` | Max traces (default 20) |

Modes:

1. `--attr-name` + `--attr-value`: exact lookup
2. `--attr-name` only: all traces hit by the rule
3. Neither: recent traces hit by any extraction rule

## Flags (`outbound`)

| Flag | Description |
|------|-------------|
| `--app` | Application id (optional; scopes lookup to one application) |

## Examples

```bash
sp trace find --app my-app --attr-name orderId --attr-value ORD-1234 --json
sp trace get 4bf92f3577b34da6a3ce929d0e0e4736 --json
sp trace outbound 4bf92f3577b34da6a3ce929d0e0e4736 --app my-app --json
sp trace stats --app my-app --json
```

### JSON output (`find`)

```json
{
  "ok": true,
  "command": "trace find",
  "data": {
    "items": [
      {
        "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
        "endpoint": "POST /api/order",
        "status": "OK",
        "durationMs": 120,
        "startedAt": "2026-05-18T10:00:00Z"
      }
    ]
  }
}
```

### JSON output (`get`)

```json
{
  "ok": true,
  "command": "trace get",
  "data": {
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
    "endpoint": "POST /api/order",
    "status": "OK",
    "durationMs": 120,
    "startedAt": "2026-05-18T10:00:00Z",
    "attrs": {
      "orderId": "ORD-1234"
    }
  }
}
```

### JSON output (`outbound`)

When the backend `SERVER` entry span has been ingested (`state: "ingested"`):

```json
{
  "ok": true,
  "command": "trace outbound",
  "data": {
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
    "state": "ingested",
    "serverEntry": {
      "spanId": "00f067aa0ba902b7",
      "method": "POST",
      "routeOrPath": "/api/flights/search",
      "status": 200
    },
    "outboundHttp": [
      {
        "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
        "spanId": "b7ad6b7169203331",
        "parentSpanId": "00f067aa0ba902b7",
        "method": "POST",
        "url": "https://spair.softprobe.ai/ndc/v21.3/airshopping",
        "status": 200,
        "durationMs": 84,
        "request": {
          "headers": {
            "authorization": "[REDACTED]",
            "content-type": "application/json"
          },
          "body": "{\"origin\":\"SFO\",\"destination\":\"JFK\"}",
          "json": {
            "origin": "SFO",
            "destination": "JFK"
          }
        },
        "response": {
          "headers": {
            "content-type": "application/json"
          },
          "body": "{\"offers\":[{\"offerId\":\"OFF-1\"}]}",
          "json": {
            "offers": [
              {
                "offerId": "OFF-1"
              }
            ]
          }
        }
      }
    ]
  }
}
```

When no `SERVER` entry span has been recorded yet for `<traceId>` (`state: "awaiting_server_span"`):

```json
{
  "ok": true,
  "command": "trace outbound",
  "data": {
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
    "state": "awaiting_server_span",
    "serverEntry": null,
    "outboundHttp": []
  }
}
```

`sp-backend` replaces sensitive HTTP header values (`authorization`, `cookie`, `set-cookie`, `apikey`, `x-api-key`, `proxy-authorization`) with `"[REDACTED]"` and applies application sensitive-data policies before returning `outboundHttp`.

### JSON output (`stats`)

```json
{
  "ok": true,
  "command": "trace stats",
  "data": {
    "items": [
      {
        "ruleName": "orderId",
        "hitCount": 1420,
        "lastHitAt": "2026-05-18T10:15:00Z"
      }
    ]
  }
}
```

## REST mapping

| Subcommand | Method | Path |
|------------|--------|------|
| `find` | POST | `/api/traces/find-by-attr` |
| `get` | GET | `/api/traces/{traceId}/summary` |
| `outbound` | GET | `/api/traces/{traceId}/outbound-http` (optional `?appId=<appId>`) |
| `stats` | POST | `/api/traces/attr-rule-statistics` |

## Replaces `sp_api`

| sp_api | sp |
|--------|-----|
| `find_traces_by_attr` | `sp trace find` |
| `get_trace_summary` | `sp trace get` |

## Related

- [Start from a business ID](/en/arex/examples/agent-diagnose-replay#business-id)
- [Write full-stack AI E2E tests](/en/arex/fullstack-e2e-testing)
- [sp test](/en/arex/commands/test)
