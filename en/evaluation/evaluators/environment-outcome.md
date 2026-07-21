---
title: Environment outcome evaluators
---

# Environment outcome evaluators

**Environment outcome evaluators** call `Environment.verify` after rollout: tests pass, DB/API/UI state, sandbox oracle, task completion.

## Design principle

**Outcomes beat transcripts** — prefer oracles when available. A plausible answer that fails the fixture is a failure.

## What they measure

- Unit/integration tests pass in fixture repo
- API or DB state matches oracle snapshot
- UI or sandbox verifier success
- Task completion flags from harness

## Required evidence

- Environment state artifacts after `verify`
- Optional test logs and diff artifacts
- Rollout correlation IDs for drill-down

## spcode examples

| Measurement | Oracle |
|-------------|--------|
| `agent.task_success` | Episode completes with correct remediation |
| `diagnosis.root_cause_correct` | Matches fixture failure taxonomy |

Phase 1 routing uses a **no-op environment**; Phase 2 episodes use read-only fixture repos with stubbed `sp` / `sp_api`.

## Resembles

Prime Intellect Verifiers Stateful environments, SWE-bench-style test oracles, Braintrust `task` + postconditions.

## Extension rule

Implement verify contract on EnvironmentVersion — scorers consume oracle artifacts, not ad-hoc shell checks in CI scripts.
