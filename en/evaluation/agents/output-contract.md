---
title: Output contract
---

# Output contract

`sp eval` commands follow the same **`--json` envelope** as Testing. Agents parse stdout; humans may omit `--json`.

## Success envelope

```json
{
  "ok": true,
  "command": "eval run",
  "data": {
    "run_id": "01J...",
    "manifest_digest": "sha256:abc...",
    "gate": "pass",
    "summary": {
      "cases_total": 8,
      "cases_passed": 8,
      "measurements_emitted": 16
    }
  }
}
```

## Failure envelope (stderr, exit 1)

```json
{
  "ok": false,
  "command": "eval validate",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Unsupported assert type: javascript",
    "diagnostics": [
      {
        "path": "tests[3].assert[0]",
        "code": "unsupported_assert",
        "detail": "No kernel evaluator mapping for type javascript"
      }
    ]
  }
}
```

## Validate response

`sp eval validate --json` returns manifest fragment + diagnostics without execution:

```json
{
  "ok": true,
  "command": "eval validate",
  "data": {
    "manifest": { },
    "diagnostics": [],
    "lossy_mappings": []
  }
}
```

`ok: false` when any **required** mapping fails; warnings may appear in `lossy_mappings` with `ok: true`.

## Artifacts

Large outputs (full event streams, trace bundles) write under `--out-dir`:

```json
{
  "ok": true,
  "command": "eval run",
  "data": {
    "run_id": "01J...",
    "artifact": ".sp-work/runs/01J.../events.jsonl",
    "summary": { "gate": "pass" }
  }
}
```

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Kernel/API error or gate failed |
| 2 | Usage / invalid input |
| 3 | Auth missing |

## Rules for agents

1. One `sp eval` invocation per tool call — no interactive prompts.
2. Use **validate** before **run** when importing Promptfoo or changing suite YAML.
3. Do not infer pass/fail from measurement counts — read `gate` or run `sp eval compare`.
4. Attempt **result status** is not CLI exit code — see [Result status](/en/evaluation/reference/result-status).

Testing envelope details: [Testing output contract](/en/testing/agents/output-contract).
