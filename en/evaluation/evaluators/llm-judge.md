---
title: LLM judge evaluators
---

# LLM judge evaluators

> **Softprobe role:** Softprobe does not implement this family as a Softprobe evaluator. Use a framework that already owns these checks, pin it as a **RunnerVersion**, and capture the native result bundle. See [Ecosystem method families](/en/evaluation/evaluators/).

**LLM judge evaluators** apply rubrics, G-Eval-style criteria, factuality, style, and safety checks using a pinned model, prompt, and sampling policy.

They return numeric, categorical, or boolean measurements plus optional reasoning text stored as artifacts.

## What they measure

- Rubric dimensions (actionability, clarity, tone)
- Factuality and hallucination risk
- Style and format compliance
- Safety and policy adherence

## Required evidence

- Subject output and optional context bundle
- Rubric prompt pinned in the framework suite / runner digest
- Model/provider descriptor with version lock

## Example measurements

| Measurement | Use |
|-------------|-----|
| `support.actionability` | Is the advice actionable? |
| `support.evidence_grounded` | Does the answer cite session evidence? |

## Reproducibility

Temperature zero alone does **not** imply deterministic reproducibility — classify as `pinned_external`. Default to multiple trials or declare an explicit single-trial policy.

## Resembles

Langfuse LLM-as-a-judge templates, Braintrust autoevals, Promptfoo model-graded assertions.

## Extension rule

Ship or pin a **framework runner** that already owns this method family. Do **not** add Softprobe scorer plugins, Softprobe Measurement schemas, Softprobe reducers, or Softprobe human-evaluator runtimes.

See [Ecosystem method families](/en/evaluation/evaluators/) and [Framework runners](/en/evaluation/reference/framework-adapters).
