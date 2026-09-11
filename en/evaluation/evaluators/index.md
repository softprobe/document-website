---
title: Ecosystem method families
---

# Ecosystem method families

Softprobe does **not** implement these methods as Softprobe evaluators. They are how **frameworks** (Promptfoo, DeepEval, judges, human review tools, …) grade agents. Softprobe’s job is to **run** those frameworks via pinned runners, capture evidence, and gate workflow outcomes.

Use this hub to choose which **framework capability** you need — then package it as a FrameworkDefinition + RunnerVersion.

## Method families

| Family | Examples | Typically owned by |
|--------|----------|--------------------|
| [Deterministic](/en/evaluation/evaluators/deterministic) | exact match, contains, regex, JSON Schema | Promptfoo asserts, unit tests |
| [Similarity and statistical](/en/evaluation/evaluators/similarity-and-statistical) | edit distance, BLEU/ROUGE, embeddings | Framework metrics / libs |
| [Reference-based quality](/en/evaluation/evaluators/reference-based-quality) | groundedness, citation, RAG faithfulness | DeepEval / RAG frameworks |
| [LLM judge](/en/evaluation/evaluators/llm-judge) | rubric, G-Eval, factuality, style | Framework LLM-as-judge |
| [Comparative judge](/en/evaluation/evaluators/comparative-judge) | pairwise, listwise, tournament | Framework comparative flows |
| [Trajectory and tools](/en/evaluation/evaluators/trajectory-and-tools) | tool-used, args, ordering, efficiency | Trajectory metrics + OTEL |
| [Environment outcome](/en/evaluation/evaluators/environment-outcome) | tests pass, DB/API/UI state | Env verify in-framework + Softprobe EnvironmentVersion |
| [Multi-turn and multi-agent](/en/evaluation/evaluators/multi-turn-and-multi-agent) | dialogue quality, handoffs | Multi-turn framework suites |
| [Human annotation](/en/evaluation/evaluators/human-annotation) | rubric, preference, adjudication | Human workflow tools / framework hooks |
| [Production and online](/en/evaluation/evaluators/production-online) | sampling, continuous rules, backfill | Softprobe online policy + framework runner |
| [Robustness and security](/en/evaluation/evaluators/robustness-and-security) | perturbation, red-team | Security suites in-framework |
| [Stochastic and repeated](/en/evaluation/evaluators/stochastic-and-repeated) | pass@k, variance | Framework trials (see [Trials](/en/evaluation/concepts/trials-and-aggregates)) |
| [Meta-evaluation](/en/evaluation/evaluators/meta-evaluation) | judge calibration, leakage | Separate framework suites over prior exports |

## Softprobe role for every family

```text
FrameworkDefinition + RunnerVersion + SubjectVersion + EnvironmentVersion
→ FrameworkAttempt → EvidenceArtifact → optional projection → GateDecision
```

## Extension rule

Add or pin a **framework runner** that already owns the method. Do **not** add Softprobe Measurement schemas or Softprobe scorers unless you are building an internal control-plane check (integrity, redaction, capability) — those are not eval authoring.

## Related

- [Mental model](/en/evaluation/mental-model)
- [Framework runners](/en/evaluation/reference/framework-adapters)
- [Capability descriptors](/en/evaluation/reference/capability-descriptors)
