# Implementer overview

This section is for engineers building the Go `sp` CLI in [sp-cli](../../sp-cli/main.go).

## Read order

1. [For agents](/en/cli/guide/for-agents.md) — primary UX constraints
2. [Output contract](/en/cli/guide/output-contract.md) — JSON envelopes and exit codes
3. [Architecture](./architecture.md) — recommended package layout
4. [sp_api migration](./sp-api-migration.md) — parity with OpenCode plugin
5. [API mapping](/en/cli/reference/api-mapping.md) — REST truth table
6. [Non-goals](./non-goals.md)

## Command areas

| Area | Commands | Notes |
|------|----------|-------|
| **Platform** | config, auth, app, policy, replay control, health | HTTP client + profiles |
| **Investigation** | record, trace, replay data, ops, … | Artifacts, pagination |

Do **not** add `sp c` or embedded source to the public binary — see [Non-goals](./non-goals.md).

## Definition of done (per command)

- Cobra command registered with stable argv
- `--json` output matches [JSON types](/en/cli/reference/json-types.md)
- Integration test with httptest or recorded fixtures
- Doc page in `docs-site/commands/` updated if behavior differs

## Testing agents

Provide golden `--json` files under `sp-cli/testdata/` for skill regression.
