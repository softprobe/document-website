---
title: sp case, sp test, and sp mcp
---

# sp case, sp test, and sp mcp

Reference for unified `arex.test-case/v1` authoring and execution (`sp case`), external report ingestion, requirement coverage, and bug filing (`sp test`), and the stdio MCP server (`sp mcp`). For workflow guidance, see [Test case management](/en/arex/test-case-management).

## Exit codes and large-output artifacts {#output-behavior}

All API-backed commands accept `--json` and follow the standard [Output contract](/en/arex/agents/output-contract):

- `0`: Command succeeded (and for `sp case run` or `sp test coverage --gate`, all checks passed).
- `1`: Backend API error, failed test run (`sp case run` with `passed == false`), or failed coverage gate (`sp test coverage --gate` with untested or failing requirements).
- `2`: Local flag or `arex.test-case/v1` validation error.
- `3`: Missing or rejected authentication token (`401` or `403`).

Payloads larger than 8 KiB (`8192` bytes) spill automatically to `--out-dir` when `--out` is omitted, returning a summary object with `data.artifact`.

## `sp case` {#sp-case}

Author, fork, inspect, execute, and delete unified `arex.test-case/v1` cases.

| Subcommand | Synopsis |
|------------|----------|
| `sp case list` | List unified test cases for an application |
| `sp case get <caseId>` | Fetch one test case definition by ID |
| `sp case export` | Export a redacted baseline `TestCase` from a recorded trace without saving |
| `sp case fork` | Fork a recorded trace into a persisted `AI_FORKED` case |
| `sp case apply` | Create or update a `TestCase` from a JSON file or stdin |
| `sp case run` | Execute cases or a suite against a target service base URL |
| `sp case delete <caseId>` | Delete a test case and its case-scoped stubs |

### `sp case list`

```bash
sp case list --app <appId> [--suite <prefix>] [--kind <kind>] [--status <status>] [--tag <tag>] [--page <n>] [--limit <n>] --json
```

| Flag | Required | Values and defaults |
|------|----------|---------------------|
| `--app` | Yes | Application ID |
| `--suite` | No | Suite path prefix filter |
| `--kind` | No | `AREX`, `EXTERNAL_AUTOMATED`, or `MANUAL` |
| `--status` | No | `DRAFT`, `ACTIVE`, `FLAKY`, or `DEPRECATED` |
| `--tag` | No | Exact tag filter |
| `--page` | No | Page number (`1` or greater, default `1`) |
| `--limit` | No | Page size (`1` to `200`, default `50`) |

### `sp case get`

```bash
sp case get <caseId> [--out <file>] --json
```

| Argument or flag | Required | Description |
|------------------|----------|-------------|
| `<caseId>` | Yes | Target test case ID |
| `--out` | No | Write formatted `arex.test-case/v1` JSON to `<file>` |

### `sp case export`

```bash
sp case export --app <appId> --record-id <recordId> [--out <file>] --json
```

| Flag | Required | Description |
|------|----------|-------------|
| `--app` | Yes | Application ID |
| `--record-id` | Yes | Source recorded trace or record ID |
| `--out` | No | Write exported `arex.test-case/v1` JSON to `<file>` |

### `sp case fork`

```bash
sp case fork --app <appId> --from <recordId> [--id <newCaseId>] [--suite <suitePath>] [--title <title>] [--description <markdown>] [--out <file>] --json
```

| Flag | Required | Description |
|------|----------|-------------|
| `--app` | Yes | Application ID |
| `--from` | Yes | Source recorded trace or record ID |
| `--id` | No | Custom target case ID (generated when omitted) |
| `--suite` | No | Target `suitePath` |
| `--title` | No | Case title |
| `--description` | No | Markdown description |
| `--out` | No | Write forked `arex.test-case/v1` JSON to `<file>` |

### `sp case apply`

```bash
sp case apply --file <path|-> --json
```

| Flag | Required | Description |
|------|----------|-------------|
| `-f`, `--file` | Yes | Path to an `arex.test-case/v1` JSON file, or `-` to read from stdin |

Validates `schemaVersion` (`"arex.test-case/v1"`), `appId`, `kind`, optional `status`, and any Google CEL expressions in `arexSpec.assertionRules.assertions` before saving.

### `sp case run`

```bash
sp case run --app <appId> --env <targetUrl> [--case <caseId>...] [--suite <suitePath>] [--git-sha <sha>] --json
```

| Flag | Required | Description |
|------|----------|-------------|
| `--app` | Yes | Application ID |
| `--env` | Yes | Target service base URL (`targetEnv`), such as `http://127.0.0.1:8081` |
| `--case` | No | Case IDs to execute (repeatable or comma-separated) |
| `--suite` | No | Suite path prefix to execute |
| `--git-sha` | No | Git commit SHA recorded on the test run |

Returns `runId`, `appId`, `passed`, `total`, `passedCount`, `failedCount`, and `results[]`. Exits with code `1` when `passed == false`.

### `sp case delete`

```bash
sp case delete <caseId> --app <appId> --json
```

| Argument or flag | Required | Description |
|------------------|----------|-------------|
| `<caseId>` | Yes | Test case ID to delete |
| `--app` | Yes | Application ID |

## `sp test` {#sp-test}

Ingest and export external test results, query requirement coverage, and file defects.

| Subcommand | Synopsis |
|------------|----------|
| `sp test import-results` | Import CTRF JSON or JUnit XML results into the unified catalog |
| `sp test export-results` | Export a test run as JUnit XML or CTRF JSON |
| `sp test coverage` | Query requirement test coverage and optionally enforce a CI gate |
| `sp test bug create` | Create an issue-tracker defect linked to a test case |

### `sp test import-results`

```bash
sp test import-results --app <appId> --file <path|-> [--format <junit|ctrf>] [--runner <name>] [--suite <suitePath>] [--git-sha <sha>] --json
```

| Flag | Required | Description |
|------|----------|-------------|
| `--app` | Yes | Application ID |
| `-f`, `--file` | Yes | Report path (`.xml` or `.json`), or `-` for stdin |
| `--format` | No | `junit` or `ctrf` (auto-detected from file extension or leading character when omitted) |
| `--runner` | No | Runner label (`playwright`, `pytest`, `junit`, `vitest`, or `go`) |
| `--suite` | No | Target `suitePath` |
| `--git-sha` | No | Git commit SHA |

### `sp test export-results`

```bash
sp test export-results --run <runId> [--format <junit|ctrf>] [--out <file>] [--json]
```

| Flag | Required | Description |
|------|----------|-------------|
| `--run` | Yes | Test run ID |
| `--format` | No | `junit` or `ctrf` (default `junit`) |
| `--out` | No | Write exported report content to `<file>` |

Without `--json` or `--out`, `sp test export-results` writes raw XML or JSON directly to stdout when the report is 8 KiB or smaller.

### `sp test coverage`

```bash
sp test coverage --app <appId> [--provider <provider>] [--scope <scope>] [--gate] --json
```

| Flag | Required | Description |
|------|----------|-------------|
| `--app` | Yes | Application ID |
| `--provider` | No | `github`, `jira`, `linear`, `gitlab`, or `local` |
| `--scope` | No | Milestone, epic, label, or cycle filter |
| `--gate` | No | Exit with code `1` when `summary.untested > 0` or `summary.failing > 0` |

### `sp test bug create`

```bash
sp test bug create --app <appId> --case <caseId> --provider <provider> [--project <owner/repo|PROJ|TEAM>] [--external-url <url>] [--result <resultId>] [--title <title>] [--notes <notes>] --json
```

| Flag | Required | Description |
|------|----------|-------------|
| `--app` | Yes | Application ID |
| `--case` | Yes | Test case ID |
| `--provider` | Yes | `github`, `jira`, `linear`, or `gitlab` |
| `--project` | Conditional | Repository (`owner/repo`), Jira project key (`PROJ`), or Linear team key (`TEAM`). Required unless `--external-url` is passed |
| `--external-url` | No | Existing issue URL to link directly without calling a remote tracker API |
| `--result` | No | Failed verdict `resultId` |
| `--title` | No | Defect title override |
| `--notes` | No | Diagnostic notes appended to the defect body |

### `sp test tracker configure`

```bash
sp test tracker configure --app <appId> --provider <provider> --token <token> [--base-url <url>] [--username <email>] [--project <defaultProject>] --json
```

| Flag | Required | Description |
|------|----------|-------------|
| `--app` | Yes | Application ID |
| `--provider` | Yes | `github`, `jira`, `linear`, or `gitlab` |
| `--token` | No | Personal access token or API key (stored write-only) |
| `--base-url` | No | Self-hosted or custom API base URL |
| `--username` | No | Account email for Jira Cloud Basic auth |
| `--project` | No | Default repository, project key, or team key |

## `sp mcp` {#sp-mcp}

Run the Softprobe Arex MCP server (`softprobe-arex-mcp`) over stdio using MCP protocol versions `2024-11-05` and `2025-03-26`, or generate client configuration files.

```bash
sp mcp
sp mcp setup --client <cursor|claude|antigravity|codex> [--dir <path>] [--json]
```

| Subcommand and flags | Required | Description |
|----------------------|----------|-------------|
| `sp mcp` | No flags | Start the JSON-RPC 2.0 MCP server on stdin and stdout |
| `sp mcp setup --client` | Yes | Target AI coding client: `cursor` (writes `.cursor/mcp.json`) or `claude`, `antigravity`, `codex` (writes `.mcp.json`) |
| `sp mcp setup --dir` | No | Directory in which to create or merge the MCP config file. Prints the config snippet when omitted |

### MCP tools exposed by `sp mcp` {#mcp-tools}

| Tool | Required arguments | Purpose |
|------|--------------------|---------|
| `arex_discover_context` | `appId` | Fetch agent heartbeat status, recorded operation map, and unified cases |
| `arex_list_cases_and_coverage` | `appId` | List cases (`suitePath`, `kind`, `status`, `tag`, `page`, `pageSize`) alongside requirement coverage (`provider`, `scope`) |
| `arex_export_baseline` | `appId`, `recordId` | Export a redacted `arex.test-case/v1` baseline from a recording without persisting |
| `arex_apply_test_case` | `appId`, `kind` | Validate and upsert an `arex.test-case/v1` case (`arexSpec`, `externalSpec`, or `manualSpec`) |
| `arex_run_test_case` | `appId`, `targetEnv` | Run `caseIds`, `caseId`, or `suitePath` and return 4-way `failureCategory` verdicts and `unmockedCalls[].stubTemplate` |
| `arex_import_external_results` | `appId` | Import CTRF JSON or JUnit XML from `filePath` or raw `content` |
| `arex_link_or_file_issue` | `appId`, `caseId`, `provider` | File a defect in `repositoryOrProject` or link an existing `externalUrl` |
| `arex_query_logs` | `traceId`, `since`, `until` | Query correlated application logs for a UTC ISO-8601 window |

## REST mapping {#rest-mapping}

| Command | Method | Path |
|---------|--------|------|
| `sp case list` | GET | `/api/test-cases` |
| `sp case get <caseId>` | GET | `/api/test-cases/{caseId}` |
| `sp case export` | POST | `/api/test-cases/export-baseline` |
| `sp case fork` | POST | `/api/test-cases/fork` |
| `sp case apply` | PUT | `/api/test-cases` |
| `sp case delete <caseId>` | DELETE | `/api/test-cases/{caseId}` |
| `sp case run` / `sp replay run --suite <suitePath>` | POST | `/api/test-runs/execute` |
| `sp test import-results` | POST | `/api/test-runs/import` |
| `sp test export-results` | GET | `/api/test-runs/{runId}/export` |
| `sp test coverage` | GET | `/api/issue-trackers/coverage` |
| `sp test bug create` | POST | `/api/issue-trackers/bugs` |
| `sp test tracker configure` | PUT | `/api/issue-trackers/config` |

## Related {#related}

- [Test case management](/en/arex/test-case-management)
- [sp record](./record)
- [sp logs](./logs)
- [Output contract](/en/arex/agents/output-contract)
