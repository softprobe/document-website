# sp app

**When agents use this:** Resolve `appId`, check agent connectivity, register a service, or list recent replay plans for an app.

## Synopsis

List, create, and inspect SoftProbe **applications**. An application is a registered service; recording, replay, and policies are scoped by `appId`. See [Concepts — Application](/en/testing/agents/concepts.md#application-appid).

Use `--json` on all subcommands. See [Output contract](/en/testing/agents/output-contract.md).

## Subcommands

| Subcommand | Args | Description |
|------------|------|-------------|
| `list` | — | Applications visible to the caller, with agent status |
| `create` | `<appName>` | Register a new application (server assigns `appId`) |
| `status` | `<appId>` | Agent connectivity for one application |
| `replays` | `<appId>` | Recent replay plans (`--limit`) |

## `list`

```bash
sp app list --json
```

**REST:** `GET /api/applications/list`

Requires a token when `--json` is set (CLI exits with an auth error if `SP_TOKEN` is unset). Results are filtered by user group, ownership, and cross-group grants; see [Authentication](/en/testing/agents/authentication.md).

### JSON output

`data.items` is an array of list rows. Each row merges app config with live agent status (heartbeat threshold defaults to 60s → `offline`).

| Field | Description |
|-------|-------------|
| `appId` | Stable id for agent config and other `sp` commands |
| `appName`, `name` | Display name |
| `agentStatus` | `online`, `offline`, or `never` |
| `lastSeenAt` | Unix ms, freshest instance heartbeat |
| `agentVersion` | Agent build string |
| `env` | Primary env tag, or `production` |
| `tags` | Flattened tag values |
| `worktreeDirectory` | Optional workspace path |

```json
{
  "ok": true,
  "command": "app list",
  "data": {
    "items": [
      {
        "appId": "a1b2c3d4e5f67890",
        "appName": "order-service",
        "agentStatus": "online",
        "lastSeenAt": 1747564800000
      }
    ]
  }
}
```

## `create`

```bash
sp app create order-service-staging --json
```

**REST:** `POST /api/applications/create`

`appName` must be unique. The CLI sends `{ "appName": "<arg>" }`; the server may set `owners` from the JWT when omitted.

### Request body (REST)

| Field | Required | Description |
|-------|----------|-------------|
| `appName` | Yes | Unique name (CLI positional) |
| `owners` | No | Owner user names; defaults to current user |
| `visibilityLevel` | No | `0` public, `1` private |
| `groupId`, `groupName` | No | User group assignment |

### JSON output

| Field | Description |
|-------|-------------|
| `success` | Whether creation succeeded |
| `appId` | Generated id — use in agent and `sp replay run --app` |
| `msg` | Detail when `success` is false |

```json
{
  "ok": true,
  "command": "app create",
  "data": {
    "success": true,
    "appId": "f3e2d1c0b9a87654"
  }
}
```

## `status`

```bash
sp app status f3e2d1c0b9a87654 --json
```

**REST:** `GET /api/applications/{appId}/agent-status`

Aggregates JVM instance heartbeats for the app. `status` reflects the **freshest** instance:

| Value | Meaning |
|-------|---------|
| `never` | No instances reported |
| `online` | Latest heartbeat within threshold |
| `offline` | Instances exist but heartbeat is stale |

| Field | Description |
|-------|-------------|
| `appId` | Application id |
| `status` | `never`, `online`, or `offline` |
| `instanceCount` | Registered instances |
| `lastSeenAt` | Unix ms |
| `agentVersion` | From freshest instance |

```json
{
  "ok": true,
  "command": "app status",
  "data": {
    "appId": "f3e2d1c0b9a87654",
    "status": "online",
    "instanceCount": 2,
    "lastSeenAt": 1747564800000
  }
}
```

## `replays`

```bash
sp app replays f3e2d1c0b9a87654 --limit 10 --json
```

**REST:** `GET /api/applications/{appId}/replays/recent?limit=N`

| Flag | Default | Description |
|------|---------|-------------|
| `--limit` | `5` | Max plans (CLI rejects &lt; 1; values above 100 are clamped to 100; server also clamps 1–100) |

`data` is an array of plan summaries (`planId`, `planName`, `status`, case counts, `createTime`, `triggeredBy`, …). Use `planId` with [sp replay](replay.md) and [replay case](/en/testing/commands/replay-case.md).

## REST mapping

| Subcommand | Method | Path |
|------------|--------|------|
| `list` | GET | `/api/applications/list` |
| `create` | POST | `/api/applications/create` |
| `status` | GET | `/api/applications/{appId}/agent-status` |
| `replays` | GET | `/api/applications/{appId}/replays/recent` |

Header: `access-token: <JWT>`.

## Replaces `sp_api`

| sp_api endpoint | sp command |
|-----------------|------------|
| `list_applications` | `sp app list` |
| `agent_status` | `sp app status` |
| `recent_replays` | `sp app replays` |

## Related

- [Concepts — Application](/en/testing/agents/concepts.md#application-appid)
- [Quickstart](/en/testing/getting-started.md)
- [sp replay](replay.md)
- [Diagnose replay failure](/en/testing/examples/agent-diagnose-replay.md)
- [JSON types — ApplicationListItem](/en/testing/reference/json-types.md#applicationlistitem)
- [API mapping](/en/testing/reference/api-mapping.md)
