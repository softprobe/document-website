# Non-goals

The `sp` CLI intentionally does **not** expose:

## Embedded source / code leakage

The public `sp` binary must **not** ship a `sp c` (or similar) command that reads encrypted or embedded Softprobe Java/backend source. That surface risks distributing proprietary code to end users and agents.

- Internal agent tooling (e.g. private `sp_read` / `sp_grep` in controlled environments) is out of scope for this spec.
- Public documentation and skills must only describe **HTTP API** commands.

## Agent instrumentation writes

| API | Reason |
|-----|--------|
| `POST /api/storage/record/save` | Java agent (`sp-agent-java`) only |
| `POST /api/storage/record/batchSaveMockers` | Java agent only |
| `POST /api/storage/record/batchSaveReplayResult` | Worker callbacks |

Coding agents must never simulate raw agent-ingest traffic through `/api/storage/record/save`. Authoring, baseline forking (`origin: "AI_FORKED"`), and synthetic case creation (`origin: "AI_SYNTHETIC"`) go through the unified `arex.test-case/v1` catalog APIs (`/api/test-cases*`) exposed by `sp case` and `sp mcp`.

## OTLP ingestion

| API | Reason |
|-----|--------|
| `POST /v1/traces` | OpenTelemetry collectors |
| `POST /v1/logs`, `POST /v1/metrics` | Same |

## In-process replay runner

| API | Reason |
|-----|--------|
| `/api/replay/local/*` | Embedded runner contract |

## Demo / test controllers

Integration-test and demo-app REST controllers are not product APIs.

## Unauthenticated mutating ops

`sp ops` mutating subcommands require `--confirm`. Agents must not auto-confirm.

## Full UI parity

Every `FileSystemController` button and report chart is not mirrored 1:1 in the CLI. Legacy console folder trees stay internal to the web UI, while unified test cases (`origin: "CAPTURED"`, `"AI_FORKED"`, `"AI_SYNTHETIC"`, and `"MANUAL"`) share the `arex.test-case/v1` model managed via `sp case`, `sp test`, and `sp mcp`.

## OpenAPI-only features

Until OpenAPI exists, the CLI does not invent endpoints not present in [API mapping](/zh/cli/reference/api-mapping).
