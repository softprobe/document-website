---
title: Score targets
---

# Score targets

Optional **measurements** project to the query-friendly `scores` table. Softprobe does not require projection for a valid WorkflowRun — the native result bundle remains authoritative.

**Score target v2** adds canonical addressing for workflow entities while preserving v1 span/trace/session compatibility.

## Target types (v2)

| `target_type` | Use |
|---------------|-----|
| `span` | OTLP span (generation, tool, …) |
| `trace` | Whole W3C trace |
| `session` | SESSIFY / product session |
| `workflow_run` | Softprobe WorkflowRun |
| `framework_attempt` | Softprobe FrameworkAttempt |

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
| Framework-reported measurements Softprobe elects to project | Full native aggregate/detail (stays in result bundle) |
| Optionally configured gate boolean | GateDecision records (ledger-only by default) |
| | Raw attempt diagnostics |

Gate decisions live in the ledger; gates may emit a **separate boolean measurement** when needed in score queries.

## Migration

Backfill chooses most specific canonical target: `span` → `trace` → `session`. Score IDs preserved. Rows that previously used Softprobe-only targets (`case_run`, `rollout`, …) map to `workflow_run` / `framework_attempt` or remain framework-native in the result bundle.

See [Scores and gates](/en/evaluation/concepts/scores-and-gates).
