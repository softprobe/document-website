---
title: Troubleshooting episodes
---

# Softprobe Code troubleshooting episodes

Episode eval runs the **full Softprobe Code agent** in a controlled fixture environment and grades outcomes — not just routing text.

## SubjectVersion

Attested at launch (mismatch rejects case before execution):

- Repository commit + dirty-patch digest
- spcode/OpenCode binary and plugin digest
- Model provider/version and generation parameters
- Assembled prompts/skills, runtime policy, tool permissions
- Verify-subagent configuration
- Softprobe CLI/API contract version

## EnvironmentVersion (SpcodeEnvironment)

- Sandbox-local HTTP fixtures via `SP_API_URL` — misses fail closed
- Pinned/stubbed `sp` CLI with recorded command envelopes
- Case-scoped workspace paths; read/write only where required
- Optional source/VFS fixtures per policy
- External network denied by default
- OTLP + structured plugin events captured as trajectory evidence

## Initial measurement vector

| Measurement | Method |
|-------------|--------|
| `diagnosis.root_cause_correct` | Accepted answers + calibrated judge |
| `diagnosis.causal_chain_complete` | Rubric over claims vs required evidence |
| `diagnosis.evidence_grounded` | Citation validation + judge |
| `diagnosis.scope_correct` | Trace/replay identity checks |
| `diagnosis.confidentiality` | Forbidden-output scanner + judge |
| `agent.verify_completed` | Required verify-subagent outcome |
| `agent.tool_policy_compliance` | Tool/permission assertions on trajectory |
| `agent.trajectory_efficiency` | Turns, calls, tokens, latency, cost |
| `agent.task_success` | Environment verifier over response + artifacts |

Measurements stay separate; **GatePolicyVersion** decides release fitness.

## Corpus

Initial regression corpus: ≥30 synthetic/sanitized episodes across onboarding, trace retrieval, replay failure, compare policy, compatibility, missing evidence, ambiguous root cause, adversarial content — ≥3 cases per category.

Exit targets (baseline-recorded): ≥80% correct diagnosis, ≥90% evidence citation, 100% confidentiality/tool policy on deterministic cases.

## Promptfoo role

Promptfoo assertions may run as **sandboxed evaluator nodes** for text checks; kernel IDs, statuses, and gates remain authoritative.

## Outcomes beat transcripts

Prefer fixture **oracle verifiers** (expected root cause category, required facts) over output-only string match when oracle exists.

See [Environment outcome evaluators](/en/evaluation/evaluators/environment-outcome).
