---
title: Result status
---

# Result status

Every evaluator **attempt** terminates with a typed **result status**. Status is not a score — errors never become implicit zero.

## Status values

| Status | Meaning |
|--------|---------|
| `succeeded` | Attempt completed; zero or more measurements may follow |
| `invalid_input` | Evaluator rejected bundle (schema, selector, policy) |
| `missing_evidence` | Required artifact absent — explicit, not silent skip |
| `unsupported` | Capability not recognized at plan time or runtime |
| `timed_out` | Attempt exceeded budget |
| `cancelled` | Run or case cancelled |
| `resource_exhausted` | Quota, memory, or cost cap hit |
| `evaluator_error` | Evaluator runtime failure |
| `subject_error` | Subject rollout failed before grading |

## Rules

1. **`succeeded` with no measurements** is valid (e.g. filter evaluator found nothing to score).
2. **Never map errors to score 0** — gate policies must treat missing/failed attempts explicitly.
3. **Retries** create immutable Attempt records linked to the same logical slot; deterministic result keys prevent duplicate measurements.
4. **Intentional re-evaluation** creates a new `evaluation_result_id`.

## Gate interaction

GatePolicyVersion references measurements and aggregates — not raw attempt status alone. A common pattern:

```text
routing.skill_match = pass
AND evaluation.attempt_status != subject_error
```

## Diagnostics

`invalid_input`, `missing_evidence`, and `unsupported` include structured diagnostics in the event ledger (and `--json` validate output for import-time failures).

## Related

- [Events](/en/evaluation/reference/events) — `evaluation.attempted` carries status
- [CLI](/en/evaluation/reference/cli) — run exit code vs attempt status
