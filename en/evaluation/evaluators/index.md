---
title: Evaluator taxonomy
---

# Evaluator taxonomy

The kernel represents evaluation methods through **capability descriptors** — not a closed list of metric names. New methods normally ship as plugins without changing core result schemas.

## Method families

| Family | Examples | Kernel capability |
|--------|----------|-------------------|
| [Deterministic](/en/evaluation/evaluators/deterministic) | exact match, contains, regex, JSON Schema, AST, unit tests | Pure scorer over typed artifacts |
| [Similarity and statistical](/en/evaluation/evaluators/similarity-and-statistical) | edit distance, BLEU/ROUGE, embeddings, classifiers | Batchable scorer; model digest |
| [Reference-based quality](/en/evaluation/evaluators/reference-based-quality) | correctness, groundedness, citation, RAG faithfulness | Dataset references + retrieved context |
| [LLM judge](/en/evaluation/evaluators/llm-judge) | rubric, G-Eval, factuality, style, safety | Model-backed scorer; pinned prompt/policy |
| [Comparative judge](/en/evaluation/evaluators/comparative-judge) | pairwise, listwise, tournament, baseline | Group scorer; position randomization |
| [Trajectory and tools](/en/evaluation/evaluators/trajectory-and-tools) | tool-used, args, ordering, step count, efficiency | Canonical trajectory + span selection |
| [Environment outcome](/en/evaluation/evaluators/environment-outcome) | tests pass, DB/API/UI state, task completion | Stateful env verify contract |
| [Multi-turn and multi-agent](/en/evaluation/evaluators/multi-turn-and-multi-agent) | dialogue quality, handoffs, simulated users | Stateful rollout protocol |
| [Human annotation](/en/evaluation/evaluators/human-annotation) | rubric, pairwise preference, adjudication | Async human evaluator runtime |
| [Production and online](/en/evaluation/evaluators/production-online) | sampling, filters, continuous rules, backfill | Scheduler over trace snapshots |
| [Robustness and security](/en/evaluation/evaluators/robustness-and-security) | perturbation, metamorphic, fuzzing, red-team | Case generators + safety sandbox |
| [Stochastic and repeated](/en/evaluation/evaluators/stochastic-and-repeated) | pass@k, pass^k, best-of-n, variance | Trial groups + reducers |
| [Meta-evaluation](/en/evaluation/evaluators/meta-evaluation) | judge calibration, agreement, leakage checks | Evaluators consume prior result sets |

Combinations (judge ensembles, causal comparisons, multimodal judges) use group execution, generators, typed evidence, environments, and reducers — **not** new core result types.

## Topology

| Topology | When |
|----------|------|
| `item` | One case run, one candidate |
| `pair` | Two candidates compared |
| `group` | Listwise / tournament |
| `stream` | Streaming partial outputs |
| `aggregate` | Cross-run reducers |

## Example measurements

| Eval type | Typical evaluators |
|-----------|-------------------|
| Prompt-only router | Deterministic contains + confidentiality |
| Sandbox agent | Environment outcome + trajectory + LLM judge |

## Extension rule

Add a scorer, reducer, generator, environment, or evidence adapter — not a new Measurement schema — unless the computational topology is genuinely new.

See [Capability descriptors](/en/evaluation/reference/capability-descriptors).
