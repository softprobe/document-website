---
title: Output contract
---

# Output contract

What `sp` prints and how it exits, for scripts, CI jobs and AI agents that call it with `--json`. This page covers the envelope, exit codes, large output, pagination, common `data` shapes and what may change between versions.

## Success: envelope on stdout {#cli-envelope-stdout-on-success}

```json
{
  "ok": true,
  "command": "app list",
  "data": { }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | Always `true` on exit 0 |
| `command` | string | Normalized command name for logging |
| `data` | object | Command-specific payload (see [Common `data` shapes](#json-types)) |

## Failure: envelope on stderr {#cli-envelope-stderr-on-failure-exit-1}

On exit `1`, `2` or `3`, stderr carries a JSON error object:

```json
{
  "ok": false,
  "command": "replay run",
  "error": {
    "code": "API_ERROR",
    "message": "Human-readable summary",
    "httpStatus": 500,
    "backend": { }
  }
}
```

`backend` optionally contains the raw backend response body for debugging.

If `--json` is set and authentication is missing, the CLI does **not** prompt. It exits `3`:

```json
{
  "ok": false,
  "error": { "code": "AUTH_REQUIRED", "message": "Set SP_TOKEN or run sp auth login" }
}
```

## Exit codes {#exit-codes}

| Code | Name | Meaning | Retry? |
|------|------|---------|--------|
| `0` | Success | Parsed JSON on stdout when `--json` | No |
| `1` | API_ERROR | Backend returned an error or a non-success HTTP status (includes `NO_RECORDED_CASES` on `replay run`) | Sometimes — after fixing data, or for a transient 5xx |
| `2` | USAGE / PROFILE_NOT_FOUND / CONFIG_* | Invalid flags, missing config, parse errors, unknown profile | No — fix the invocation |
| `3` | AUTH_REQUIRED | No token available in non-interactive mode | After refresh or login |

Config error codes (exit `2`):

| Code | Cause |
|------|-------|
| `CONFIG_MISSING` | No `config.jsonc` / `sp.jsonc`; run `sp config init` |
| `CONFIG_PARSE_ERROR` | Invalid JSONC or schema validation failure |
| `CONFIG_WRITE_ERROR` | Could not write config file |
| `PROFILE_NOT_FOUND` | Selected profile missing from merged config |

These are the exit codes of `sp` itself. The script in [Replay after deployment](/en/testing/webhook-and-ci#script) defines its own exit codes on top.

## How backend errors map to exit codes {#backend-response-shapes}

Most console APIs return:

```json
{
  "responseStatusType": { "responseCode": 0, "responseDesc": "success" },
  "body": { }
}
```

The CLI maps `responseCode !== 0` to exit `1`.

Replay control (`createPlan`, `progress`, …) returns:

```json
{
  "result": 1,
  "desc": "success",
  "data": { }
}
```

The CLI maps `result !== 1` to exit `1`.

## Large output: artifacts {#artifacts-large-output}

When a response is large, or the command always produces files (diff detail, log download), stdout carries a pointer instead of the full payload:

```json
{
  "ok": true,
  "command": "replay diff get",
  "data": {
    "artifact": ".sp-work/diff-abc123.json",
    "summary": {
      "diffId": "abc123",
      "diffResultCode": 1,
      "categoryName": "..."
    }
  }
}
```

Read the artifact file instead of expecting the full payload on stdout. The default `--out-dir` is `.sp-work/` in the current working directory; override it per invocation.

## Pagination {#pagination}

List commands accept:

| Flag | Default | Description |
|------|---------|-------------|
| `--page` | `1` | 1-based page index |
| `--limit` | `20` | Page size (max 100 unless documented) |
| `--fields` | all | Comma-separated field filter |

Paginated JSON:

```json
{
  "ok": true,
  "command": "replay case list",
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 142,
    "hasMore": true
  }
}
```

## Without `--json` {#human-readable-mode-no-json}

Tables go to stdout and errors to stderr as plain text.

## Common `data` shapes {#json-types}

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

## Versions and stability {#versioning}

`sp version` prints the CLI build version (semver). Log it with each session so support can match behavior to a release.

| Change | Policy |
|--------|--------|
| New subcommand or optional flag | Allowed anytime |
| Renaming a subcommand or flag | Deprecated for one minor release first, with a warning on stderr |
| Removing a subcommand or flag | Major version only |
| New fields in `data` | Allowed anytime; ignore fields you don't know |
| Renaming or removing fields, changing field types | Major version only |

Deprecations are listed in the release notes and in the command's `--help`.

The CLI talks to one **sp-backend** URL; the storage and scheduling services behind it are internal and not addressed separately.
