---
title: Result status
---

# Result status

Every **FrameworkAttempt** terminates with a typed **result status**. Status is not a score — errors never become implicit zero.

## Status values

| Status | Meaning |
|--------|---------|
| `succeeded` | Runner finished; zero or more projected measurements may follow |
| `invalid_input` | Definition, result bundle, or capability input rejected |
| `missing_evidence` | Required artifact absent — explicit, not silent skip |
| `unsupported` | Capability not recognized at plan time or runtime |
| `timed_out` | Attempt exceeded budget |
| `cancelled` | WorkflowRun cancelled |
| `resource_exhausted` | Quota, memory, or cost cap hit |
| `runner_error` | Framework runner runtime failure |
| `subject_error` | Subject failed before the runner could complete |

## Rules

1. **`succeeded` with no measurements** is valid (projection optional; native bundle may still be rich).
2. **Never map errors to score 0** — gate policies must treat missing/failed attempts explicitly.
3. **Outer retries** create immutable FrameworkAttempt records linked to the same WorkflowRun slot; deterministic result keys prevent duplicate projected measurements.
4. Framework-internal retries/trials stay inside the **native result bundle** — Softprobe does not invent CaseRun IDs for them.

## Gate interaction

Gate policies reference outer status and **explicitly selected** runner-reported or projected fields. A common pattern:

```text
framework_attempt.status = succeeded
AND native.summary.failedCount = 0
```

## Diagnostics

`invalid_input`, `missing_evidence`, and `unsupported` include structured diagnostics in the event ledger (and `--json` validate output for pack-time failures).

## Related

- [Events](/en/evaluation/reference/events)
- [CLI](/en/evaluation/reference/cli)
- [Scores and gates](/en/evaluation/concepts/scores-and-gates)
