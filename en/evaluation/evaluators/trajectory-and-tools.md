---
title: Trajectory and tool evaluators
---

# Trajectory and tool evaluators

> **Softprobe role:** Softprobe does not implement this family as a Softprobe evaluator. Use a framework that already owns these checks, pin it as a **RunnerVersion**, and capture the native result bundle. See [Ecosystem method families](/en/evaluation/evaluators/).

**Trajectory evaluators** assert on canonical OTLP steps: tools used, argument shapes, ordering, step count, efficiency, and goal-success proxies.

## What they measure

| Check | Example |
|-------|---------|
| Tool used | Agent invoked approved API tool, not raw HTTP |
| Args shape | Tool args match expected schema |
| Ordering | Diagnosis before remediation suggestion |
| Step count / efficiency | Fewer redundant tool loops |
| Policy compliance | No forbidden tools in sandbox eval |

## Required evidence

- Canonical ordered trajectory derived from OTLP spans
- Span selectors: `generation`, `tool`, `retriever`, guardrail, sub-agent
- Optional baseline trajectory for diff-style checks

## Example measurements

| Measurement | Evaluator |
|-------------|-----------|
| `agent.tool_policy_compliance` | Allowed tools only |
| `agent.trajectory_efficiency` | Step count vs oracle bound |

Selectors address spans without re-parsing raw OTLP per scorer. See [Evidence and trajectories](/en/evaluation/concepts/evidence-and-trajectories).

## Resembles

DeepEval trajectory metrics (via adapter), custom tool-use checks in agent benchmarks.

## Extension rule

Ship or pin a **framework runner** that already owns this method family. Do **not** add Softprobe scorer plugins, Softprobe Measurement schemas, Softprobe reducers, or Softprobe human-evaluator runtimes.

See [Ecosystem method families](/en/evaluation/evaluators/) and [Framework runners](/en/evaluation/reference/framework-adapters).
