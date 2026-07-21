---
title: Reference-based quality evaluators
---

# Reference-based quality evaluators

**Reference-based quality evaluators** grade against dataset references: correctness, groundedness, citation coverage, RAG relevance, and faithfulness.

They require CaseVersion expected refs plus retrieved context artifacts in the evidence bundle.

## What they measure

| Metric | Question |
|--------|----------|
| Correctness | Does the answer match the reference? |
| Groundedness | Is every claim supported by context? |
| Citation coverage | Are sources cited where required? |
| RAG faithfulness | Does the answer stay within retrieved passages? |

## Required evidence

- Model output
- Expected references on CaseVersion
- Retrieved context chunks (content-addressed)
- Optional citation spans

## spcode note

Episode evaluators such as `diagnosis.evidence_grounded` combine reference-based checks with trajectory and environment oracles.

## Resembles

Langfuse dataset experiments with `expected_output`, Braintrust scorers over `expected`.

## Extension rule

Use evidence selectors for `reference`, `context`, and `citation` — fail with `missing_evidence` when selectors cannot resolve.
