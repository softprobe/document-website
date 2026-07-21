---
title: Score targets
---

# Score targets

**Measurements** project to the query-friendly `scores` table. **Score target v2** adds canonical addressing beyond span/trace/session while preserving v1 compatibility.

## Target types (v2)

| `target_type` | Use |
|---------------|-----|
| `span` | OTLP span (generation, tool, …) |
| `trace` | Whole W3C trace |
| `session` | SESSIFY / product session |
| `rollout` | Subject rollout unit |
| `case_run` | One case × subject × trial |
| `run` | Whole eval run |
| `comparison_group` | Multi-candidate compare bucket |

## v1 compatibility

Legacy columns `span_id`, `trace_id`, and `session_id` remain populated and indexed for those target types. v1 APIs/SDKs retain current validation.

## Write rules (v2)

- Accept **exactly one** canonical target per measurement write.
- Server derives legacy column when applicable.
- Reject inconsistent dual representations.

## Read rules

- v2 reads filter by canonical target; return canonical + applicable legacy fields.
- v1 reads expose only legacy-addressable measurements.

## What projects to scores

| Projects | Does not project |
|----------|------------------|
| Item measurements | Intermediate reducer state |
| Published statistical aggregates | Gate decisions (ledger-only) |
| Optionally configured gate boolean | Raw attempt diagnostics |

Gate decisions live in the ledger; gates may emit a **separate boolean measurement** when needed in score queries.

## Migration

Backfill chooses most specific canonical target: `span` → `trace` → `session`. Score IDs preserved.

See [Scores and gates](/en/evaluation/concepts/scores-and-gates).
