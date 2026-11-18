---
title: sp tenant
---

# sp tenant

**Softprobe Cloud only.** Manages the tenant API key that Java agents use to report to your tenant. Self-hosted deployments don't use it.

## `tenant key ensure`

Finds the tenant's API key, or creates one, and saves it to `sp.jsonc` for the current profile:

```bash
sp tenant key ensure --json
```

| Flag | Description |
|------|-------------|
| `--no-save` | Print the key without writing it to `sp.jsonc` |

Requires `sp auth login` first, and a tenant ID (`tenant_id` in `sp.jsonc` or `SP_TENANT_ID`).

```json
{
  "ok": true,
  "command": "tenant key ensure",
  "data": {
    "tenantId": "t-123",
    "tenantApiKey": "…",
    "maskedApiKey": "***abcd",
    "savedToConfig": true
  }
}
```

`sp agent command` puts the saved key into the agent start flags as `-Dsp.api.token=…`, and creates it if it's missing.

## `tenant key show`

Shows the saved key, masked:

```bash
sp tenant key show --json
```

Fails with a usage error (exit `2`) when no key is saved yet.

## Related

- [sp agent](./agent)
- [sp auth](./auth)
