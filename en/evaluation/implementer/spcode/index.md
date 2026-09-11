---
title: Evaluating Softprobe Code agents
---

# Evaluating Softprobe Code agents

Softprobe Code (OpenCode-based troubleshooting agent) is the first-class **subject** for Agent Evaluation. Two products measure different things:

| Product | Subject | Proves |
|---------|---------|--------|
| **Routing eval** | Pinned model + production `diagnose.txt` | Skill selection + confidentiality |
| **Troubleshooting episode** | Full Softprobe Code process + fixture env | Correct diagnosis, tools, outcomes |

Same data model envelope — different SubjectVersion and EnvironmentVersion.

## Routing eval (Promptfoo-compatible)

Existing suite: `packages/softprobecode-eval` — 8 cases in `tests.yaml` loading `diagnose.txt`.

- Import via `sp eval validate --import promptfoo`
- Side-by-side with `bun run eval:mock` / `eval:vertex` during parity soak
- Does **not** launch OpenCode or load skills

[Routing eval guide →](/en/evaluation/guides/spcode/routing-eval)

## Troubleshooting episodes

Recorded/synthetic episodes (~30+ cases): replay failure, empty window, trace retrieval, compare policy, adversarial repo content.

- Subject attests binary, plugin, prompt/skill, model, repo digests at launch
- Environment: stubbed `sp`/`sp_api`, fail-closed network, artifact visibility classes
- Measurements: root cause, evidence grounding, tool policy, confidentiality, cost/latency

[Troubleshooting episodes guide →](/en/evaluation/guides/spcode/troubleshooting-episodes)

## Release gating

spcode PRs gate on pinned FrameworkDefinition digest + gate policy in WorkflowVersion. Routing gates first; episode gates tighten as corpus matures.

## Internal engine naming

Public docs say **Softprobe Code agent**. Use `spcode` only when naming the internal engine or repo paths.
