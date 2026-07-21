---
title: Trajectory and tool evaluators
---

# Trajectory and tool evaluators

**Trajectory evaluators** assert on canonical OTLP steps: tools used, argument shapes, ordering, step count, efficiency, and goal-success proxies.

## What they measure

| Check | Example |
|-------|---------|
| Tool used | Agent invoked `sp_api` not raw HTTP |
| Args shape | Tool args match expected schema |
| Ordering | Diagnosis before remediation suggestion |
| Step count / efficiency | Fewer redundant tool loops |
| Policy compliance | No forbidden tools in routing eval |

## Required evidence

- Canonical ordered trajectory derived from OTLP spans
- Span selectors: `generation`, `tool`, `retriever`, guardrail, sub-agent
- Optional baseline trajectory for diff-style checks

## spcode examples

| Measurement | Evaluator |
|-------------|-----------|
| `agent.tool_policy_compliance` | Allowed tools only |
| `agent.trajectory_efficiency` | Step count vs oracle bound |

Selectors address spans without re-parsing raw OTLP per scorer. See [Evidence and trajectories](/en/evaluation/concepts/evidence-and-trajectories).

## Resembles

DeepEval trajectory metrics (via adapter), custom tool-use checks in agent benchmarks.

## Extension rule

EvidenceAdapter materializes canonical steps; scorers consume the bundle — do not embed OTLP parsing in each evaluator.
