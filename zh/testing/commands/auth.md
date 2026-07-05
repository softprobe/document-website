# sp auth

**When agents use this:** When `SP_TOKEN` is unset or expired.

## Synopsis

Authenticate and inspect identity.

## Subcommands

| Subcommand | Flags | Description |
|------------|-------|-------------|
| `login` | `--email`, `--code`, `--guest`, `--no-save` | Obtain JWT |
| `whoami` | — | Current user from token |
| `refresh` | `--user`, `--no-save` | Refresh token |

## Examples

```bash
sp auth login --email ops@corp.com --code 848291 --json
sp auth login --email ops@corp.com --code 848291 --no-save --json
sp auth whoami --json
export SP_TOKEN="$(sp auth login ... --no-save --json | jq -r '.data.token')"
```

By default, `login` and `refresh` save the token to the shared configuration file in
`${XDG_CONFIG_HOME:-~/.config}/softprobe/config.jsonc`. With `--no-save`, the token

is returned in JSON only and no config, cache, data, or state file is modified.

### JSON output (`login`)

```json
{
  "ok": true,
  "command": "auth login",
  "data": {
    "token": "eyJ...",
    "userName": "ops@corp.com",
    "expiresAt": "2026-05-19T12:00:00Z"
  }
}
```

## REST mapping

| Subcommand | Method | Path |
|------------|--------|------|
| `login` (email) | POST | `/api/login/verify` |
| `login` (guest) | POST | `/api/login/loginAsGuest` |
| `refresh` | GET | `/api/login/refresh/{userName}` |
| `whoami` | — | JWT decode locally, or future profile API |

Request body for verify: `VerifyRequestType` (`userName`, `verifyCode`, …).

## Replaces

None (new). CI uses `SP_TOKEN` directly.

## Related

- [Authentication guide](/en/testing/guide/authentication.md)
