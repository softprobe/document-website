# Implementer overview

This section is for engineers building the Go `sp` CLI in [sp-cli](../../sp-cli/main.go).

## Read order

1. [For agents](/en/cli/guide/overview) — primary UX constraints
2. [Output contract](/en/cli/guide/output-contract) — JSON envelopes and exit codes
3. [Architecture](./architecture) — recommended package layout
4. [sp_api migration](./sp-api-migration) — parity with OpenCode plugin
5. [API mapping](/en/cli/reference/api-mapping) — REST truth table
6. [Non-goals](./non-goals)

## Command areas

| Area | Commands | Notes |
|------|----------|-------|
| **Platform** | config, auth, app, policy, replay control, health | HTTP client + profiles |
| **Investigation** | record, trace, replay data, ops, … | Artifacts, pagination |

Do **not** add `sp c` or embedded source to the public binary — see [Non-goals](./non-goals).

## Definition of done (per command)

- Cobra command registered with stable argv
- `--json` output matches [JSON types](/en/cli/reference/json-types)
- Integration test with httptest or recorded fixtures
- Doc page in `document-website/en/cli/commands/` updated if behavior differs

## Testing agents

Provide golden `--json` files under `sp-cli/testdata/` for skill regression.
