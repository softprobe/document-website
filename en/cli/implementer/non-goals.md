# Non-goals

The `sp` CLI intentionally does **not** expose:

## Embedded source / code leakage

The public `sp` binary must **not** ship a `sp c` (or similar) command that reads encrypted or embedded SoftProbe Java/backend source. That surface risks distributing proprietary code to end users and agents.

- Internal agent tooling (e.g. private `sp_read` / `sp_grep` in controlled environments) is out of scope for this spec.
- Public documentation and skills must only describe **HTTP API** commands.

## Agent instrumentation writes

| API | Reason |
|-----|--------|
| `POST /api/storage/record/save` | Java agent only |
| `POST /api/storage/record/batchSaveMockers` | Agent only |
| `POST /api/storage/record/batchSaveReplayResult` | Worker callbacks |

Coding agents must not simulate agent traffic through the CLI.

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

Every `FileSystemController` button and report chart is not required in v2. The CLI does not expose console filesystem or manual case authoring; test cases come from recording only.

## OpenAPI-only features

Until OpenAPI exists, the CLI does not invent endpoints not present in [API mapping](/en/cli/reference/api-mapping.md).
