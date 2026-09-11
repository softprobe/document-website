---
title: Environment outcome evaluators
---

# Environment outcome evaluators

> **Softprobe role:** Softprobe does not implement this family as a Softprobe evaluator. Use a framework that already owns these checks, pin it as a **RunnerVersion**, and capture the native result bundle. See [Ecosystem method families](/en/evaluation/evaluators/).

**Environment outcome evaluators** call `harness verify (framework-owned)` after rollout: tests pass, DB/API/UI state, sandbox oracle, task completion.

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

## Example measurements

| Measurement | Oracle |
|-------------|--------|
| `task.tests_pass` | Integration tests green in sandbox |
| `task.root_cause_correct` | Matches fixture failure taxonomy |

Early suites often use a **no-op** environment (prompt-only). Environment-backed suites pin fixture repos and stubbed tools so oracles can run without ambient production access. See [Prompt-only vs environment eval](/en/evaluation/guides/eval-modes).

## Resembles

Prime Intellect Verifiers Stateful environments, SWE-bench-style test oracles, Braintrust `task` + postconditions.

## Extension rule

Ship or pin a **framework runner** that already owns this method family. Do **not** add Softprobe scorer plugins, Softprobe Measurement schemas, Softprobe reducers, or Softprobe human-evaluator runtimes.

See [Ecosystem method families](/en/evaluation/evaluators/) and [Framework runners](/en/evaluation/reference/framework-adapters).

## Related Softprobe environment guides

- [Environment bundles and dependency tapes](/en/evaluation/concepts/environment-bundles)
- [Record and replay an agent environment](/en/evaluation/guides/record-replay-agent-environment)
- [Gym episodes and training rollouts](/en/evaluation/guides/gym-and-training-rollouts)
