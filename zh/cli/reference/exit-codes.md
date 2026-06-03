::: warning CLI reference (English)
The `sp` CLI documentation is available in English. [Switch to English CLI docs](/en/cli/guide/overview).
:::

# Exit codes

Contract for agents and CI scripts invoking `sp`.

| Code | Name | Meaning |
|------|------|---------|
| `0` | Success | Parsed JSON on stdout when `--json` |
| `1` | API_ERROR | Backend returned error or HTTP non-success (includes `NO_RECORDED_CASES` on `replay run`) |
| `2` | USAGE / PROFILE_NOT_FOUND / CONFIG_* | Invalid flags, missing config, parse errors, unknown profile |
| `3` | AUTH_REQUIRED | No token available in non-interactive mode |

## stderr with `--json`

On exit `1` or `2` or `3`, stderr contains a JSON error object:

```json
{
  "ok": false,
  "command": "app list",
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Set SP_TOKEN or run sp auth login"
  }
}
```

## Config error codes (exit `2`)

| Code | Cause |
|------|-------|
| `CONFIG_MISSING` | No `config.jsonc` / `sp.jsonc`; run `sp config init` |
| `CONFIG_PARSE_ERROR` | Invalid JSONC or schema validation failure |
| `CONFIG_WRITE_ERROR` | Could not write config file |
| `PROFILE_NOT_FOUND` | Selected profile missing from merged config |

## Agent retry guidance

| Code | Retry? |
|------|--------|
| 0 | No |
| 1 | Sometimes — after fixing data or if transient 5xx |
| 2 | No — fix invocation |
| 3 | After refresh/login |
