# Output contract

All public `sp` commands follow this contract when `--json` is set.

## CLI envelope (stdout on success)

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
| `data` | object | Command-specific payload (see [JSON types](/en/cli/reference/json-types.md)) |

## CLI envelope (stderr on failure, exit 1)

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

`backend` optionally contains the raw SoftProbe `Response` or schedule `CommonResponse` body for debugging.

## Backend response shapes

### sp-tr-api (`Response`)

Most console APIs return:

```json
{
  "responseStatusType": { "responseCode": 0, "responseDesc": "success" },
  "body": { }
}
```

The CLI maps `responseCode !== 0` to exit code `1`.

### sp-replay-schedule (`CommonResponse`)

Replay control (`createPlan`, `progress`, …) uses:

```json
{
  "result": 1,
  "desc": "success",
  "data": { }
}
```

The CLI maps `result !== 1` (per server convention) to exit code `1`.

## Artifacts (large output)

When response bodies exceed an internal threshold (recommended: 64 KiB) or when the command always produces files (diff detail, log download):

**stdout:**

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

Agents should **read the artifact file** with their file tool, not expect full payloads on stdout.

Default `--out-dir`: `.sp-work/` in the current working directory (override per invocation).

## Pagination

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

## Human-readable mode (no `--json`)

- Tables on stdout
- Errors on stderr as plain text
- Colors only when stdout is a TTY and `--pretty` is set (optional; not required for v1 implementers)

## Non-interactive rule

If `--json` is set and authentication is missing, the CLI must **not** prompt. Exit `3` with:

```json
{
  "ok": false,
  "error": { "code": "AUTH_REQUIRED", "message": "Set SP_TOKEN or run sp auth login" }
}
```
