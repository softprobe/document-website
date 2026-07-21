---
title: LLM judge evaluators
---

# LLM judge evaluators

**LLM judge evaluators** apply rubrics, G-Eval-style criteria, factuality, style, and safety checks using a pinned model, prompt, and sampling policy.

They return numeric, categorical, or boolean measurements plus optional reasoning text stored as artifacts.

## What they measure

- Rubric dimensions (actionability, clarity, tone)
- Factuality and hallucination risk
- Style and format compliance
- Safety and policy adherence

## Required evidence

- Subject output and optional context bundle
- Rubric prompt pinned in EvaluatorVersion digest
- Model/provider descriptor with version lock

## spcode examples

| Measurement | Use |
|-------------|-----|
| `diagnosis.actionability` | Is the troubleshooting advice actionable? |
| `diagnosis.evidence_grounded` | Does the diagnosis cite session evidence? |

## Reproducibility

Temperature zero alone does **not** imply deterministic reproducibility — classify as `pinned_external`. Default to multiple trials or declare an explicit single-trial policy.

## Resembles

Langfuse LLM-as-a-judge templates, Braintrust autoevals, Promptfoo model-graded assertions.

## Extension rule

Pin prompt + model in EvaluatorVersion; emit standard Measurements — never a single opaque reward scalar replacing evidence.
