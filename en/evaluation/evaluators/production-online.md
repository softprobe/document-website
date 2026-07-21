---
title: Production and online evaluators
---

# Production and online evaluators

**Online evaluators** run under **EvaluationPolicyVersion** against production trace snapshots: filters, stable sampling, late-span watermarks, rate/cost limits.

Same EvaluatorVersion definitions as offline runs; evidence is captured at snapshot time for re-scoring.

## What they measure

- Continuous quality on live traffic
- Regression detection on production spans
- Backfill re-scoring when evaluator versions change
- Filtered subsets (e.g. diagnosis traces only)

## Policy controls

| Control | Purpose |
|---------|---------|
| Stable sampling | `hash(target_id + policy_version)` |
| Watermarks | Wait for late spans before scoring |
| Rate/cost limits | Cap model judge spend |
| Exclusion tags | Skip eval-execution traces (loop guard) |

See [Online evaluation](/en/evaluation/concepts/online-evaluation) and [Production-to-eval loop](/en/evaluation/guides/production-to-eval-loop).

## Resembles

Langfuse live LLM-as-a-judge, Braintrust online scoring rules, continuous eval pipelines.

## Extension rule

EvaluationPolicyVersion compiles to scheduled runs over immutable snapshots — not mutable DB rows as source of truth.
