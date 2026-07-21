---
title: Langfuse and Braintrust adoption
---

# Langfuse and Braintrust adoption

Teams migrating from Langfuse or Braintrust keep familiar workflows; Softprobe adds portable manifests, unified local/managed execution, and governed prod-to-eval.

## From Langfuse

| You have today | Softprobe path |
|----------------|----------------|
| Datasets in Langfuse UI | Import or API → **DatasetVersion** |
| Evaluator templates | **EvaluatorVersion** descriptors ( richer topology ) |
| Experiments on datasets | **`sp eval run`** with same manifest locally or managed |
| Scores on traces | **Measurements** → score projection |
| Online eval rules | **EvaluationPolicyVersion** |
| Annotation queues | **Human evaluator** runtime |

Improvements over Langfuse-only flows:

- Immutable **RunManifest** instead of mutable job configuration rows
- Explicit `missing_evidence` vs silent template mapping gaps
- One kernel for local CI and managed workers

## From Braintrust

| You have today | Softprobe path |
|----------------|----------------|
| `Eval(data, task, scores)` | Public API: `data + subject + evaluators + environment` |
| Experiments | **Run** + ledger |
| Online scoring rules | **EvaluationPolicyVersion** |
| Logs → dataset | [Production-to-eval loop](/en/evaluation/guides/production-to-eval-loop) with approval |

Improvements:

- **EnvironmentVersion** outcomes first-class (not transcript-only)
- Portable export of manifests and event bundles
- Federated workers for private data residency

## Side-by-side operation

You may run Braintrust/Promptfoo evaluators as **sandboxed nodes** while Softprobe owns suite identity and gates during transition.

See [Ecosystem mapping](/en/evaluation/concepts/ecosystem-mapping).
