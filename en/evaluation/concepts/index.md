---
title: Concepts overview
---

# Concepts overview

Read these pages in order if you are new to Agent Evaluation. Each builds on the previous.

## Recommended reading order

1. [Mental model](/en/evaluation/mental-model) — suite, run, evidence, measurement, gate
2. [Native model and adapters](/en/evaluation/concepts/native-model-and-adapters) — framework-agnostic contract
3. [Data model](/en/evaluation/concepts/data-model) — immutable resources vs runtime records
4. [Ecosystem mapping](/en/evaluation/concepts/ecosystem-mapping) — optional bridges from other tools
5. [Scores and gates](/en/evaluation/concepts/scores-and-gates) — facts vs release policies
6. [Evidence and trajectories](/en/evaluation/concepts/evidence-and-trajectories) — OTLP boundary
7. [How it works](/en/evaluation/how-it-works) — full lifecycle

## By persona

### Eval author (native YAML, SDK)

| Topic | Page |
|-------|------|
| Glossary | [Terminology](/en/evaluation/concepts/terminology) |
| Native model | [Native model and adapters](/en/evaluation/concepts/native-model-and-adapters) |
| Framework import | [Framework adapters](/en/evaluation/reference/framework-adapters) |
| Author a suite | [Author a suite](/en/evaluation/guides/author-a-suite) |
| Evaluator types | [Evaluator taxonomy](/en/evaluation/evaluators/) |

### Agent builder (custom agents, tool use)

| Topic | Page |
|-------|------|
| Prompt-only vs sandbox eval | [Eval modes](/en/evaluation/guides/eval-modes) |
| Outcome verifiers | [Environment outcome](/en/evaluation/evaluators/environment-outcome) |
| CI gates | [Compare and promote](/en/evaluation/guides/compare-and-promote) |
| Artifact visibility | [Artifact visibility](/en/evaluation/concepts/artifact-visibility) |

### Migrating from Langfuse or Braintrust

| Topic | Page |
|-------|------|
| Concept mapping | [Ecosystem mapping](/en/evaluation/concepts/ecosystem-mapping) |
| Adoption guide | [Langfuse and Braintrust adoption](/en/evaluation/guides/langfuse-and-braintrust-adoption) |
| Evaluation flywheel | [Evaluation loop](/en/evaluation/concepts/evaluation-loop) |

### Platform operator

| Topic | Page |
|-------|------|
| Kernel and hosts | [Kernel and hosts](/en/evaluation/architecture/kernel-and-hosts) |
| thelake storage | [Storage and thelake](/en/evaluation/architecture/storage-and-thelake) |
| Online policies | [Online evaluation](/en/evaluation/concepts/online-evaluation) |
| Trust boundaries | [Trust boundaries](/en/evaluation/architecture/trust-boundaries) |

## How Agent Evaluation relates to Testing and Observability

| Product | Relationship |
|---------|----------------|
| **[Softprobe Testing](/en/testing/)** | Java record/replay regression — different problem. Eval may consume recorded traffic or traces as **evidence**, not as the eval orchestrator. |
| **[Platform](/en/platform/)** | Istio/SESSIFY mesh observability. Eval shares OTLP/thelake as transport; eval adds suite identity, trials, gates, and manifest reproducibility. |
| **thelake scores** | Existing span/trace/session scores extend to **score target v2** (rollout, case_run, run). See [Score targets](/en/evaluation/reference/score-targets). |

Do not mix Testing's `appId` / replay semantics with eval's CaseVersion / RunManifest — they solve different regression problems.

## Design principles (user-facing)

| Principle | Meaning for you |
|-----------|-----------------|
| Evidence before score | Every measurement links to artifacts you can inspect |
| Outcomes beat transcripts | Prefer environment oracles when available |
| Scores are facts; gates are views | Change release policy without rewriting history |
| OTLP is the observation boundary | Standard traces; one canonical trajectory library |
| Open ecosystem | Keep Promptfoo/DeepEval authoring; Softprobe owns orchestration and storage |
| No silent degradation | `missing_evidence` ≠ score 0 |

## Next

[Terminology](/en/evaluation/concepts/terminology) · [Data model](/en/evaluation/concepts/data-model)
