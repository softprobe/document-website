# Authentication

Console APIs require the HTTP header:

```http
access-token: <JWT>
```

(Defined as `Constants.ACCESS_TOKEN` in sp-tr-api.)

## Non-interactive login (agents + CI)

### Email verification flow

1. Request code (human step or separate automation):

   ```http
   GET /api/login/getVerificationCode/{userName}
   ```

2. Exchange code for token:

   ```bash
   sp auth login --email user@corp.com --code 123456 --json
   ```

   **REST:** `POST /api/login/verify` with body `{ "userName", "verifyCode", ... }`

3. CLI writes token to the shared config file in
   `${XDG_CONFIG_HOME:-~/.config}/softprobe/config.jsonc` unless `--no-save`.


### CI / agent hosts

**CLI** (record, replay, app management) uses your user JWT:

```bash
export SP_TOKEN="eyJ..."
sp app list --json
```

**Java agent** on Softprobe Cloud uses a **tenant API key** (long-lived, scoped to the org):

```bash
export SP_TENANT_API_KEY="…"   # from sp tenant key ensure or dashboard Settings
export SP_TENANT_ID="35"
sp agent command --app <appId> --json
```

Never commit tokens or API keys to git. Rotate on leak.

### Token refresh

```bash
sp auth refresh --user user@corp.com --json
```

**REST:** `GET /api/login/refresh/{userName}`

Add `--no-save` when an agent or CI job should receive a token without touching
local config:

```bash
export SP_TOKEN="$(sp auth refresh --user user@corp.com --no-save --json | jq -r .data.token)"
```

## Guest login

If enabled on the server:

```bash
sp auth login --guest --json
```

**REST:** `POST /api/login/loginAsGuest`

## OAuth

OAuth flows are browser-based. Agents should use pre-provisioned `SP_TOKEN` rather than driving OAuth interactively.

Document for humans: `GET /api/login/oauthInfo/{oauthType}`, `POST /api/login/oauthLogin`.

## Who am I

```bash
sp auth whoami --json
```

Decodes JWT `userName` or calls profile endpoint when implemented.

## Errors

| Situation | Exit code |
|-----------|-----------|
| Missing token with `--json` | `3` (`AUTH_REQUIRED`) |
| Expired or invalid token | `1` (`API_ERROR`) |

## Related

- [config](/en/testing/installation/configuration)
- [auth command](/en/testing/commands/auth)
