---
title: Correlation and traces
---

# Correlation and traces

Every case run creates or adopts a **W3C trace** so eval results drill down to OTLP evidence and link to production observability.

## IDs on every span

| Field | Purpose |
|-------|---------|
| `run_id` | Evaluation run |
| `case_run_id` | Case × subject × trial |
| `case_version_id`, `subject_version_id`, `trial_id` | Pinned versions |
| `trace_id`, root `span_id` | W3C correlation |
| `traceparent` | Propagated to subject |

## Evaluator vs subject spans

Evaluator execution spans carry `evaluator_version_id` and `evaluation_result_id`. They grade subject spans — they are not mixed into subject trajectory assertions.

## Score targets from traces

Measurements may target `span`, `trace`, `session`, `rollout`, `case_run`, `run`, or `comparison_group`. Trace-level scores aggregate span-level evidence selectors.

## Loop prevention

Eval-execution uses a reserved internal environment tag. **EvaluationPolicyVersion** excludes these traces from online rules by default — preventing evaluators from triggering infinite re-eval loops.

## Softprobe Testing correlation

Java record/replay traces in [Testing](/en/testing/) use different semantics (`appId`, mockers). Eval may **import** production or replay traces as evidence snapshots when policies allow — eval does not replace Testing regression.
