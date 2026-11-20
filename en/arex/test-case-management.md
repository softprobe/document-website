---
title: Test case management
---

# Manage unified test cases and coverage

Softprobe Arex stores recorded traffic, AI-authored feature tests, external automated reports, and manual test procedures in one `arex.test-case/v1` catalog. You can author or fork cases with `sp case` and `sp mcp`, ingest JUnit XML or CTRF JSON results with `sp test`, gate pull requests on requirement coverage, and file defects in GitHub, Jira, Linear, or GitLab.

## Unified test case kinds and origins {#kinds-and-origins}

Every catalog entry uses `"schemaVersion": "arex.test-case/v1"` and belongs to an `appId`, an optional hierarchical `suitePath` (such as `flights/baggage/vip-tier`), and one of three `kind` values:

| `kind` | Spec block | What it represents |
|--------|------------|--------------------|
| `AREX` | `arexSpec` | Entry request, optional reference output, dependency stubs, case-level injection rules, and Google CEL assertions executed against an Arex-instrumented service |
| `EXTERNAL_AUTOMATED` | `externalSpec` | Automated tests executed by Playwright, Pytest, JUnit, Vitest, or Go and imported from CTRF JSON or JUnit XML reports |
| `MANUAL` | `manualSpec` | Human test procedures with `preconditions`, `steps`, and `expectedOutcome` |

Each case also records how it was created in `origin`:

- `CAPTURED`: Recorded automatically from live or staging traffic by the Java agent.
- `AI_FORKED`: Cloned from a sensitive-policy-redacted recording (`parentCaseId`) and adapted for a modified requirement.
- `AI_SYNTHETIC`: Authored from scratch for a new HTTP route, RPC method, or message consumer with no prior traffic.
- `MANUAL`: Authored as a structured manual test specification.

Lifecycle `status` values are `DRAFT`, `ACTIVE`, `FLAKY`, and `DEPRECATED`.

## Author and fork `AREX` cases {#author-arex-cases}

An `AREX` case packages five explicit fields inside `arexSpec`:

1. **`input`.** Entry invocation (`category`, `operationName`, `method`, `path`, `headers`, `body`, and optional `attributes`).
2. **`expectedOutput`.** Optional reference response for unchanged fields. Set `expectedOutput` to `null` or omit it when CEL assertions define the entire contract.
3. **`injectionRules`.** Case-level dependency mocking rules that override application defaults for this case:
   - `mockByDefault`: Boolean default for outbound dependency calls (`true` mocks every supported dependency unless listed in `skipMock`).
   - `operations.forceMock` and `operations.skipMock`: Pattern lists such as `"HttpClient:/ndc/servicelist"` or `"Database:loyalty_member*"`. Keep external payment, email, and message-broker operations mocked unless you intend to hit a live sandbox.
   - `matchTolerance`: Per-operation request matching tolerances (`operationPattern`, `ignoreBodyPaths`, `ignoreHeaders`, `matchStrategy`).
   - `fallback.strategy`: Behavior when no dependency stub matches (`"FAIL"` fails fast and emits a stub template).
4. **`assertionRules`.** Case-level structural diff settings (`diffSpec`, such as `{"ignoreAllDependencies": true}`) paired with boolean Google CEL `assertions` evaluated against `response.status`, `response.headers`, `response.body`, and outbound `calls`.
5. **`dependencies`.** Case-scoped stubs (`category`, `operationName`, optional `matchStrategy`, `request`, and `response`).

To fork an existing recording into a redacted JSON file, edit its contract, and upsert it into the catalog:

```bash
sp case fork \
  --app travel-ota \
  --from rec-9001 \
  --id tc-baggage-vip-01 \
  --suite flights/baggage/vip-tier \
  --title "Platinum member gets first checked bag free" \
  --out case.json \
  --json
```

Edit `case.json` to add requirement links, dependency stubs, and Google CEL assertions:

```json
{
  "schemaVersion": "arex.test-case/v1",
  "id": "tc-baggage-vip-01",
  "appId": "travel-ota",
  "suitePath": "flights/baggage/vip-tier",
  "title": "Platinum member gets first checked bag free",
  "kind": "AREX",
  "origin": "AI_FORKED",
  "parentCaseId": "rec-9001",
  "status": "ACTIVE",
  "requirementLinks": [
    { "provider": "jira", "externalId": "OTA-892" }
  ],
  "arexSpec": {
    "input": {
      "category": "Servlet",
      "method": "POST",
      "path": "/api/flights/baggage/purchase",
      "headers": { "Content-Type": "application/json" },
      "body": { "orderId": "ORD-9001", "bagCount": 1 }
    },
    "injectionRules": {
      "mockByDefault": true,
      "operations": {
        "forceMock": ["HttpClient:/ndc/servicelist", "Database:loyalty_member*"]
      },
      "fallback": { "strategy": "FAIL" }
    },
    "assertionRules": {
      "diffSpec": { "ignoreAllDependencies": true },
      "assertions": [
        {
          "id": "status-200",
          "expression": "response.status == 200",
          "message": "Expected HTTP 200 OK"
        },
        {
          "id": "vip-zero-fee",
          "expression": "response.body.totalCharge == 0",
          "message": "Platinum tier waives the first checked bag fee"
        }
      ]
    },
    "dependencies": [
      {
        "category": "Database",
        "operationName": "loyalty_member@SELECT",
        "request": { "body": "SELECT tier FROM loyalty_member WHERE order_id = ?" },
        "response": { "body": "[{\"tier\":\"PLATINUM\"}]", "javaType": "java.util.ArrayList" }
      }
    ]
  }
}
```

Validate the schema and CEL expressions and save the case:

```bash
sp case apply --file case.json --json
```

## Run cases and triage 4-way verdicts {#run-and-triage}

Execute individual cases or an entire `suitePath` prefix against a running target service (`targetEnv`):

```bash
sp case run \
  --app travel-ota \
  --env http://127.0.0.1:8081 \
  --suite flights/baggage \
  --git-sha "$(git rev-parse HEAD)" \
  --json
```

`sp case run` writes a JSON envelope to stdout and exits with code `1` if any case fails (`passed == false`). Each entry in `results[]` carries a `failureCategory` so engineers and AI coding agents can separate environment or stub issues from real defects:

| `failureCategory` | Meaning and next action |
|-------------------|-------------------------|
| `NONE` | All structural diff checks and CEL assertions passed |
| `MOCK_MISS_OR_DRIFT` | The code called a dependency with no matching stub. Inspect `unmockedCalls[].stubTemplate`, populate realistic `response` data, append the stub to `arexSpec.dependencies`, and re-apply without weakening `assertionRules` |
| `TEST_AUTHORING_ERROR` | Invalid request payload, route mismatch, or CEL runtime type error. Verify field names and types against the endpoint contract |
| `ENV_OR_AGENT_ERROR` | Target service unreachable or Java agent offline. Check `sp app status <appId> --json` and `sp doctor --json` |
| `REAL_APPLICATION_BUG` | The service ran with valid stubs and violated a CEL assertion or expected output. Query correlated logs around `logWindow` (`sp logs --trace-id <traceId> --since <since> --until <until> --json`) |

## Import CTRF JSON and JUnit XML results {#external-results}

When CI pipelines run unit, integration, or browser tests outside Arex, import their CTRF JSON (`.json`) or JUnit XML (`.xml`) reports into the same catalog:

```bash
sp test import-results \
  --app travel-ota \
  --file playwright-ctrf.json \
  --runner playwright \
  --suite checkout/ui \
  --git-sha "$(git rev-parse HEAD)" \
  --json
```

Softprobe creates or updates `EXTERNAL_AUTOMATED` cases (`externalSpec.runner`, `externalSpec.canonicalName`, `externalSpec.fileRef`), records pass, fail, and skip counts under a `runId`, and links ticket keys mentioned in test titles or properties.

To export any run (`AREX` or `EXTERNAL_AUTOMATED`) for downstream CI dashboards:

```bash
sp test export-results --run <runId> --format junit --out results/arex-junit.xml --json
sp test export-results --run <runId> --format ctrf --out results/arex-ctrf.json --json
```

## Track `MANUAL` test specifications {#manual-cases}

Store structured manual cases in the same suite hierarchy by setting `"kind": "MANUAL"` and providing `manualSpec`:

```json
{
  "schemaVersion": "arex.test-case/v1",
  "id": "tc-hardware-pos-01",
  "appId": "travel-ota",
  "suitePath": "airport/kiosk",
  "title": "Verify boarding pass thermal printer fallback",
  "kind": "MANUAL",
  "origin": "MANUAL",
  "status": "ACTIVE",
  "requirementLinks": [
    { "provider": "github", "externalId": "softprobe/demo-ota#142" }
  ],
  "manualSpec": {
    "preconditions": "Kiosk simulator connected with paper-low sensor active.",
    "steps": [
      "Scan a valid check-in QR code.",
      "Confirm fallback SMS boarding pass prompt appears within 3 seconds."
    ],
    "expectedOutcome": "Passenger receives digital pass link and kiosk logs printer warning."
  }
}
```

## Gate releases on requirement coverage {#requirement-coverage}

Link cases to GitHub Issues, Jira keys, Linear issues, or local requirement IDs through `requirementLinks`. Query aggregate requirement verification status across `AREX`, `EXTERNAL_AUTOMATED`, and `MANUAL` cases:

```bash
sp test coverage --app travel-ota --provider jira --scope Sprint-42 --gate --json
```

Each requirement reports `coverageStatus` (`VERIFIED`, `FAILING`, or `UNTESTED`), linked `cases`, and `openBugs`. Passing `--gate` causes `sp test coverage` to exit with code `1` whenever `summary.untested > 0` or `summary.failing > 0`.

## File and link defects {#bug-filing}

When a test run uncovers a `REAL_APPLICATION_BUG`, create an issue in GitHub, Jira, Linear, or GitLab and attach it to `bugLinks` on the case:

```bash
sp test bug create \
  --app travel-ota \
  --case tc-baggage-vip-01 \
  --result res-7712 \
  --provider github \
  --project acme/travel-ota \
  --notes "Platinum loyalty tier charged 35 USD on first bag" \
  --json
```

## Connect AI coding agents via `sp mcp` {#mcp-agents}

Run `sp mcp setup --client cursor --dir .` (or `--client claude | antigravity | codex`) to expose all 8 unified testing tools (`arex_discover_context`, `arex_list_cases_and_coverage`, `arex_export_baseline`, `arex_apply_test_case`, `arex_run_test_case`, `arex_import_external_results`, `arex_link_or_file_issue`, and `arex_query_logs`) over stdio. Install the companion `softprobe-arex` plugin from `softprobe/softprobe-plugin` to give your agent the 5-step feature-testing workflow.

## Related {#related}

- [sp case, sp test, and sp mcp command reference](/en/arex/commands/case)
- [How record and replay works](/en/arex/how-it-works)
- [Concepts and IDs](/en/arex/agents/concepts)
- [Policy YAML reference](/en/arex/policy-yaml-guide)
