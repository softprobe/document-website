---
title: Output contract
---

# Output contract

What `sp` prints and how it exits, for scripts, CI jobs and AI agents that call it with `--json`. This page covers the envelope, exit codes, large output, pagination and common `data` shapes.

Two commands don't follow the envelope: `sp agent command --format shell|docker|maven` prints plain text even with `--json`, and `sp tunnel` runs until stopped without a result envelope (its progress lines go to stderr, and `--json` suppresses them).

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
| `ok` | boolean | `true`: the command ran and produced a result |
| `command` | string | Normalized command name for logging |
| `data` | object | Command-specific payload (see [Common `data` shapes](#json-types)) |

`ok: true` means the command ran — not that everything it checked passed. Three commands write their result with `ok: true` **and** exit `1` when that result is a failure: see [Results that are failures](#results-that-are-failures).

## Failure: envelope on stderr {#cli-envelope-stderr-on-failure-exit-1}

When a command can't do its job — bad arguments, missing config, an unreachable backend, a backend error — it writes an error object to **stderr** and exits non-zero:

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

`httpStatus` is optional status context: an HTTP error usually carries the response status, but a business error returned with HTTP 200 carries `200`, and some paths set the value themselves — it never means the request succeeded. `backend` is optional extra context: usually a summary of the backend's error (`responseCode`/`responseDesc`, or `result`/`desc`), sometimes built by the CLI itself (for example next steps when the agent jar is missing). Don't treat either as proof that a request reached the backend, and don't parse `backend` as the backend's raw response. Without `--json`, the same failure is printed as `error: <message>` (suppressed by `--quiet`).

If a command needs a token and none is configured, the CLI does **not** prompt in `--json` mode; it exits `3` with `"code": "AUTH_REQUIRED"`. This is checked by the CLI before calling the backend.

Flags or arguments the command parser itself rejects (an unknown flag, a missing positional argument) exit `1` **without** a JSON envelope and may print nothing. Check the exit code, not only stderr.

### Results that are failures {#results-that-are-failures}

| Command | When | Output |
|---------|------|--------|
| `sp policy gate` | At least one policy file is invalid | Result on stdout (`ok: true`, `data.valid: false`), exit `1` |
| `sp doctor` | At least one check failed | Result on stdout (`ok: true`, `data.status: "failed"`), exit `1` |
| `sp upgrade` | The installer failed | Result on stdout (`ok: true`, `data.status: "failed"`), exit `1`. The installer's own output is streamed to stdout/stderr as well, so stdout is not a single JSON document |

`sp policy <type> validate` is different again: when the backend completes the check and finds the policy invalid, the command exits `0` with `data.valid: false`. A file that can't be read or parsed is a `USAGE` error (exit `2`), and a failed request is exit `1`. In CI, check both the exit code and `data.valid`.

## Exit codes {#exit-codes}

| Code | Error codes | Meaning | Retry? |
|------|-------------|---------|--------|
| `0` | — | Success | No |
| `1` | `API_ERROR`, `NO_RECORDED_CASES`, `NO_PINNED_CASES`, `CONFIG_MISSING`, `CONFIG_PARSE_ERROR`, `CONFIG_WRITE_ERROR`; parser errors; the [result failures](#results-that-are-failures) above | The backend returned an error or couldn't be reached, there was nothing to replay, the config couldn't be read or written, or a check failed | Sometimes — after fixing data or config, or for a transient backend error |
| `2` | `USAGE`, `PROFILE_NOT_FOUND` | Invalid input the command validated itself, or an unknown profile | No — fix the invocation |
| `3` | `AUTH_REQUIRED` | No token available in non-interactive mode | After `sp auth login` or setting `SP_TOKEN` |

| Error code | Cause |
|------------|-------|
| `CONFIG_PARSE_ERROR` | A config file exists but isn't valid JSONC or fails validation |
| `CONFIG_WRITE_ERROR` | A config file couldn't be written |
| `CONFIG_MISSING` | A command that needs a config file found none. Most commands don't: with no file they fall back to defaults and environment variables such as `SP_API_URL` |
| `PROFILE_NOT_FOUND` | The selected profile doesn't exist in the merged config |

These are the exit codes of `sp` itself. The script in [Replay after deployment](/en/testing/webhook-and-ci#script) defines its own exit codes on top.

## How backend errors map to exit codes {#backend-response-shapes}

Most console APIs return:

```json
{
  "responseStatusType": { "responseCode": 0, "responseDesc": "success" },
  "body": { }
}
```

The CLI maps `responseCode !== 0` to exit `1`, and unwraps `body` into `data` (an array body becomes `data.items`).

Replay control (`createPlan`, `progress`, …) returns:

```json
{
  "result": 1,
  "desc": "success",
  "data": { }
}
```

The CLI maps `result !== 1` to exit `1`. A non-2xx HTTP status is exit `1` too, with one exception: `sp replay run`, `sp replay rerun`, `sp replay compare`, `sp replay noise exclude` and `sp replay realtime create` are judged by `result` only. Every other command, including `sp replay status` and `sp replay case list`, checks the HTTP status first. Network, read and JSON parse errors always fail.

## Large output: artifacts {#artifacts-large-output}

Some commands write their payload to a file and put only a pointer on stdout:

```json
{
  "ok": true,
  "command": "replay diff get",
  "data": {
    "diffId": "abc123",
    "artifact": ".sp-work/diff-abc123.json",
    "summary": {
      "diffId": "abc123",
      "diffResultCode": 1,
      "categoryName": "..."
    }
  }
}
```

`replay diff get` and `replay mock-tree` always do this; `record query` does it when the payload is larger than 4 KiB; `diagnose replay` writes a file for each failed case whose diff it could find and lists them in `data.artifacts`. Cases that failed to replay, and cases without a readable diff, get no file, so the number of files is not the number of failures. `sp logs` never writes a file: redirect its stdout. Check for `data.artifact` before reading the payload from stdout. The default `--out-dir` is `.sp-work/` in the current working directory.

## Pagination {#pagination}

List commands that page accept:

| Flag | Default | Description |
|------|---------|-------------|
| `--page` | `1` | 1-based page index |
| `--limit` | `20` | Page size, at most `100` |

Not every list endpoint pages: for example `sp replay case list --plan <id>` (without `--plan-item`) returns the plan's cases in one response. Some commands take their own `--limit` with a different meaning; see the command's page.

A paged result looks like:

```json
{
  "ok": true,
  "command": "replay case list",
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 142
  }
}
```

`total` is present only when the backend reports a count. There is no field filter; select fields with `jq`, for example `jq '[.data.items[] | {replayId, traceId}]'`.

## Without `--json` {#human-readable-mode-no-json}

Results go to stdout as readable text or indented JSON (no envelope), and errors to stderr as `error: <message>`.

## Common `data` shapes {#json-types}

These pass through what the backend returns, so extra fields may appear; ignore fields you don't know.

### ApplicationListItem

`sp app list` → `data.items[]`.

```json
{
  "id": "string",
  "appId": "string",
  "appName": "string",
  "name": "string",
  "env": "string",
  "agentVersion": "string",
  "agentStatus": "online | degraded | offline | never",
  "lastSeenAt": 0,
  "tags": ["string"],
  "worktreeDirectory": "string"
}
```

### AgentStatus

`sp app status <appId>` → `data`.

```json
{
  "appId": "string",
  "status": "online | degraded | offline | never",
  "agentVersion": "string",
  "lastSeenAt": 0,
  "instanceCount": 0
}
```

`instanceCount` counts instances whose last heartbeat is within the online threshold, not every instance ever registered. `agentVersion`, `lastSeenAt` and similar fields can be empty or missing. What each status means: [Concepts and IDs — Application](/en/testing/agents/concepts#application-appid).

### ApplicationCreateResult

`sp app create` → `data`.

```json
{
  "success": true,
  "appId": "string",
  "msg": "string"
}
```

### PolicyValidateResult

`sp policy <type> validate` → `data`. `details` is the backend's validation result as is.

```json
{
  "valid": false,
  "details": {
    "valid": false,
    "errors": ["..."],
    "warnings": []
  }
}
```

### ReplayPlanCreated

`sp replay run` → `data`.

```json
{
  "planId": "string",
  "result": 1,
  "desc": "string"
}
```

### ReplayProgress

`sp replay status <planId>` → `data`.

```json
{
  "percent": 0,
  "lastUpdateTime": "2026-06-27 10:00:05"
}
```

`lastUpdateTime` is the scheduler's local time in GMT+8, without a time zone suffix.

With `--watch` (on `status` or `run`), the command prints one envelope per poll until the plan finishes; the last one adds `"finished": true`. If the plan hasn't finished after 10 minutes, it stops with `API_ERROR` (exit `1`).

### ArtifactResult

```json
{
  "artifact": "relative/path.json",
  "summary": {}
}
```

## Versions {#versioning}

`sp version` (or `sp -v`, `sp --version`) prints the CLI version; `sp version --json` wraps it in the envelope. Log it with each session so behavior can be matched to a release, and pin the CLI version in CI.

The CLI talks to one **sp-backend** URL; the storage and scheduling services behind it are internal and not addressed separately.
