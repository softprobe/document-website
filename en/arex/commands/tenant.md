---
title: sp tenant
---

# sp tenant

**Softprobe Cloud only.** Manages the Softprobe API Key used by Softprobe APIs and Java agents. It is separate from an Agent’s Ingestion Key. Self-hosted deployments don’t use it.

## `tenant softprobe-api-key ensure`

Finds the tenant's Softprobe API Key, or creates one, and saves it to `config.jsonc` for the current profile:

```bash
sp tenant softprobe-api-key ensure --json
```

| Flag | Description |
|------|-------------|
| `--no-save` | Print the key without writing it to `config.jsonc` |

First select the organization at [app.softprobe.ai/orgs](https://app.softprobe.ai/orgs), then run `sp auth login`. The command also needs that organization’s numeric tenant ID, provided by the selected profile or `SP_TENANT_ID`.

```json
{
  "ok": true,
  "command": "tenant softprobe-api-key ensure",
  "data": {
    "tenantId": "35",
    "softprobeApiKey": "…",
    "maskedSoftprobeApiKey": "***abcd",
    "savedToConfig": true
  }
}
```

`sp agent command` puts the saved key into the agent start flags as `-Dsoftprobe.api.key=…`, and creates it if it's missing.

## `tenant softprobe-api-key show`

Shows the saved key, masked:

```bash
sp tenant softprobe-api-key show --json
```

Fails with a usage error (exit `2`) when no key is saved yet.

## Related

- [sp agent](./agent)
- [sp auth](./auth)
