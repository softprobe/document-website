---
title: Langfuse and Braintrust adoption
---

# Langfuse and Braintrust adoption

Teams migrating from Langfuse or Braintrust keep familiar **framework** workflows where possible. Softprobe adds portable WorkflowVersions, unified local/managed execution, evidence custody, and governed prod-to-eval — not a replacement eval DSL.

## From Langfuse

| You have today | Softprobe path |
|----------------|----------------|
| Datasets / prompt suites | Keep as **FrameworkDefinition** (or export into Promptfoo/DeepEval) |
| Evaluator templates | Stay in-framework; Softprobe pins **RunnerVersion** |
| Experiments on datasets | **`sp eval run`** with same WorkflowVersion locally or managed |
| Scores on traces | Optional **score projection** from framework-reported results |
| Online eval rules | Softprobe **online policy** + framework runner |
| Annotation queues | Framework / external queues for grader workflows; Softprobe stores evidence. For labeling Softprobe LLM captures, see [Annotation](/en/evaluation/concepts/annotation) (score bound to **span** / observation, with **trace** and **session** ids). |

Improvements over Langfuse-only flows:

- Immutable **WorkflowVersion** instead of mutable job configuration rows
- Explicit `missing_evidence` / `unsupported` vs silent mapping gaps
- One kernel for local CI and managed workers

## From Braintrust

| You have today | Softprobe path |
|----------------|----------------|
| `Eval(data, task, scores)` | Public API: `framework suite + subject + environment + runner` |
| Experiments | **WorkflowRun** + ledger |
| Online scoring rules | Online policy + framework runner |
| Logs → dataset | [Production-to-eval loop](/en/evaluation/guides/production-to-eval-loop) with approval |

Improvements:

- **EnvironmentVersion** isolation first-class
- Portable export of workflows and event bundles
- Federated workers for private data residency

## Side-by-side operation

You may run Braintrust or Promptfoo as **pinned framework runners** while Softprobe owns workflow identity, evidence, and gates during transition.

See [Ecosystem mapping](/en/evaluation/concepts/ecosystem-mapping).
