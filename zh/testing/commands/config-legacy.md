# sp config legacy

**When agents use this:** Only when migrating old Mongo-backed config — prefer `sp policy` for recording/mock/compare.

## Synopsis

CRUD wrappers for `/api/config/*` abstract configurable controllers.

## Subcommand groups

| Group | Base path |
|-------|-----------|
| `legacy application` | `/api/config/application` |
| `legacy schedule` | `/api/config/schedule` |
| `legacy operation` | `/api/config/applicationOperation` |
| `legacy dynamic-class` | `/api/config/dynamicClass` |
| `legacy comparison` | `/api/config/comparison/*` |
| `legacy multiservice` | `/api/config/multiservice` |
| `legacy yaml-template` | `/api/config/yamlTemplate` |

Common pattern per resource:

```text
GET  …/useResult/appId/{appId}
GET  …/useResultAsList/appId/{appId}
POST …/modify/{modifyType}
POST …/batchModify/{modifyType}
```

## Agent guidance

- **Do not** use legacy schedule operation include/exclude as source of truth — recording policy overlay applies at read time.
- Use `sp policy recording|mock|compare` for declarative config.

## `sp config agent`

| Subcommand | Method | Path |
|------------|--------|------|
| `agent load --app <id>` | POST | `/api/config/agent/load` |
| `agent status` | POST | `/api/config/agent/agentStatus` |

Replaces `sp_api` `app_config`.

## Related

- [policy](/en/testing/commands/policy.md)
- [concepts](/en/testing/guide/concepts.md)
