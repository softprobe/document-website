---
title: sp test
---

# sp test

Command reference for running `@softprobe/e2e` browser and distributed-trace suites. For task steps and `.e2e/cache/` setup, see [Write full-stack AI E2E tests](/en/arex/fullstack-e2e-testing).

## Synopsis

Scaffold, run, and interactively explore `@softprobe/e2e` projects on a verified Node.js subprocess.

```bash
sp test init [--dir <dir>] [--force] [--json]
sp test run [args...] [--dir <dir>] [--json]
sp test explore [args...] [--dir <dir>]
```

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `init` | Create `e2e.config.ts` and `tests/example.e2e.ts` if missing |
| `run [args...]` | Execute `@softprobe/e2e` specs via `./node_modules/e2e` |
| `explore [args...]` | Start an interactive `e2e explore` session |

## Flags

### `init`

| Flag | Description |
|------|-------------|
| `--dir <string>` | Project directory (default: current working directory) |
| `--force` | Overwrite existing `e2e.config.ts` and `tests/example.e2e.ts` files |

### `run` and `explore`

| Flag | Description |
|------|-------------|
| `--dir <string>` | Project directory containing `e2e.config.ts` and `node_modules/e2e` (default: current working directory) |

`sp test run` and `sp test explore` strip `sp` global flags (`--json`, `--quiet`, `--confirm`, `--profile`, `--api-url`, `--token`, `--config`, `--out-dir`, `--page`, `--limit`) plus `--dir`, and forward all remaining arguments to the underlying `e2e` CLI. Pass `--` to forward literal arguments unchanged.

## Runtime and environment

`e2e` requires Node.js `^22.22.3 || >=24.8.0`. Running `e2e/runner` under Bun fails with `NODE_UNSUPPORTED`. Before spawning `./node_modules/e2e`, `sp test` resolves a compatible Node.js binary from `SP_E2E_NODE_BIN` or `node` on `PATH`.

Check the Node.js runtime before running tests:

```bash
sp doctor --e2e --json
```

`sp doctor --e2e` adds the `e2e-node` check to the standard health output (the check also runs automatically whenever `SP_E2E_NODE_BIN` is set).

When spawning `e2e`, `sp test` sets these environment variables on the child process:

| Variable | Value |
|----------|-------|
| `E2E_TELEMETRY_DISABLED` | Always `"1"` so upstream telemetry stays off and `--json` stderr stays empty |
| `SPCODE_MODE` | `"true"` |
| `SP_API_URL` | Resolved backend URL from `--api-url`, `SP_API_URL`, or `~/.config/softprobe/config.jsonc` |
| `SP_TOKEN` | Resolved access token when configured |
| `SP_TENANT_ID` | Resolved tenant ID when configured |
| `SP_TENANT_API_KEY` | Resolved tenant API key when configured |

## Examples

```bash
sp doctor --e2e --json
sp test init --dir ./e2e --json
sp test run tests/workspace-invite.e2e.ts --dir ./e2e --json
sp test explore --dir ./e2e
```

## JSON output

### `sp test init --json`

```json
{
  "ok": true,
  "command": "test init",
  "data": {
    "dir": "/workspace/app/e2e",
    "created": [
      "e2e.config.ts",
      "tests/example.e2e.ts"
    ],
    "skipped": []
  }
}
```

### `sp test run --json`

When `--json` is set, `sp test run` appends `--reporter json` to the child `e2e run` invocation, reads the run report alongside `.e2e/softprobe-traces.json` written by `softprobeReporter()`, and prints one JSON envelope to stdout.

```json
{
  "ok": true,
  "command": "test run",
  "data": {
    "dir": "/workspace/app/e2e",
    "runId": "run_01j8x9m2v4",
    "status": "passed",
    "discovered": 2,
    "selected": 2,
    "executed": 2,
    "passed": 2,
    "failed": 0,
    "skipped": 0,
    "flaky": 0,
    "interrupted": 0,
    "modelCalls": 0,
    "modelTokens": 0,
    "verifiedTraces": [
      {
        "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
        "sinkKind": "blackbox",
        "sinkUrl": "http://127.0.0.1:8091",
        "mode": "outboundHttp",
        "targetName": "local-explorer",
        "testId": "test_invite_email",
        "title": "workspace invitations > sends invite email",
        "file": "tests/workspace-invite.e2e.ts",
        "triggeredBy": {
          "method": "POST",
          "url": "http://localhost:5179/api/workspaces/ws-1/invites",
          "pathname": "/api/workspaces/ws-1/invites",
          "headerSource": "minted"
        },
        "outboundCall": {
          "spanId": "00f067aa0ba902b7",
          "method": "POST",
          "url": "http://127.0.0.1:9025/v1/account/invite/submit",
          "status": 200,
          "serviceName": "softprobe-explorer"
        },
        "explorerTraceUrl": "http://localhost:5179/?traceId=4bf92f3577b34da6a3ce929d0e0e4736",
        "verifiedAt": "2026-11-21T09:30:00.000Z"
      }
    ],
    "failures": []
  }
}
```

### Envelope fields (`test run`)

| Field | Type | Description |
|-------|------|-------------|
| `dir` | `string` | Absolute project directory |
| `runId` | `string` | `e2e` run identifier (present when `e2e` wrote a report) |
| `status` | `string` | Run status from `e2e` (`"passed"`, `"failed"`, or `"unknown"`) |
| `passed` | `number` | Passed test count |
| `failed` | `number` | Failed test count |
| `skipped` | `number` | Skipped test count |
| `flaky` | `number` | Tests that passed on retry |
| `interrupted` | `number` | Interrupted test count |
| `modelCalls` | `number` | Total LLM step calls across all attempts (`0` on cached `.e2e/cache/` replay) |
| `modelTokens` | `number` | Total LLM tokens consumed across the run |
| `verifiedTraces` | `array` | Entries recorded by `softprobeReporter()` for `trace.outboundHttp` and `trace.expectNoOutboundHttp` |
| `failures` | `array` | Failed tests or run-level errors (`testId`, `file`, `title`, `code`, `message`) |

When a test fails, `sp test run --json` writes `"ok": false` with `error.code: "E2E_FAILED"`, includes the same `data` summary object, and exits with the child runner's non-zero exit code.

## Related

- [Write full-stack AI E2E tests](/en/arex/fullstack-e2e-testing)
- [sp trace](/en/arex/commands/trace)
- [Install the sp command line](/en/arex/installation/#doctor)
