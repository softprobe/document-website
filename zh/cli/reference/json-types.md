::: warning CLI reference (English)
The `sp` CLI documentation is available in English. [Switch to English CLI docs](/en/cli/guide/overview).
:::

# JSON types

CLI-level envelope: see [Output contract](/en/cli/guide/output-contract.md).

## Common `data` shapes

### ApplicationListItem

Used in `sp app list` → `data.items[]`.

```json
{
  "appId": "string",
  "appName": "string",
  "name": "string",
  "agentStatus": "online | offline | never",
  "lastSeenAt": 0,
  "agentVersion": "string",
  "env": "string",
  "tags": ["string"],
  "worktreeDirectory": "string"
}
```

### ApplicationCreateResult

Used in `sp app create` → `data`.

```json
{
  "success": true,
  "appId": "string",
  "msg": "string"
}
```

### AgentStatus

Used in `sp app status` → `data`.

```json
{
  "appId": "string",
  "status": "online | offline | never",
  "instanceCount": 0,
  "lastSeenAt": 0,
  "agentVersion": "string"
}
```

### PolicyValidateResult

```json
{
  "valid": true,
  "errors": [{ "path": "spec.sampling.rate", "message": "..." }],
  "warnings": []
}
```

### ReplayPlanCreated

```json
{
  "planId": "string",
  "result": 1,
  "desc": "string"
}
```

### ReplayProgress

```json
{
  "planId": "string",
  "status": "RUNNING | FINISHED | FAILED | CANCELLED",
  "percent": 0,
  "finished": false
}
```

### TraceSummary

```json
{
  "traceId": "string",
  "endpoint": "string",
  "status": "string",
  "durationMs": 0,
  "startedAt": "ISO-8601",
  "attrs": { "orderId": "ORD-123" }
}
```

### ArtifactResult

```json
{
  "artifact": "relative/path.json",
  "summary": {}
}
```

### PaginatedList

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 0,
  "hasMore": false
}
```

## Backend passthrough

When `--include-backend` (optional debug flag) is set, implementers may add `data._backend` with the raw `Response.body` or `CommonResponse.data`.

Agents should not depend on `_backend` in production skills.

## schemaVersion

Future CLI releases may add top-level `"schemaVersion": 1` in the envelope. Agents must ignore unknown top-level fields.
