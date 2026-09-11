---
title: Correlation and traces
---

# Correlation and traces

Every **FrameworkAttempt** creates or adopts a **W3C trace** so Softprobe results drill down to OTLP evidence and link to production observability.

## IDs on Softprobe / runner spans

| Field | Purpose |
|-------|---------|
| `workflow_run_id` | Softprobe WorkflowRun |
| `framework_attempt_id` | Outer runner attempt |
| `workflow_version_id`, `runner_version_id` | Pinned versions |
| `trace_id`, root `span_id` | W3C correlation |
| `traceparent` | Propagated to the subject under test |

Framework-internal case IDs may appear in the native result bundle; Softprobe does not require Softprobe `case_run_id` for every framework test.

## Runner vs subject spans

Framework-runner execution spans carry `runner_version_id` and native result-bundle digest. They observe the subject — Softprobe does not invent Softprobe evaluator spans that re-score assertions.

## Score targets from traces

Projected measurements may target `span`, `trace`, `session`, `workflow_run`, or `framework_attempt`. See [Score targets](/en/evaluation/reference/score-targets).

## Loop prevention

Eval-execution uses a reserved internal environment tag. Online policies exclude these traces by default — preventing recursive evaluation loops.

## Softprobe Testing correlation

Java record/replay traces in [Testing](/en/testing/) use different semantics (`appId`, mockers). Eval may **import** production or replay traces as evidence snapshots when policies allow — eval does not replace Testing regression.
