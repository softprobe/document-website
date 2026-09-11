---
title: Reference-based quality evaluators
---

# Reference-based quality evaluators

> **Softprobe role:** Softprobe does not implement this family as a Softprobe evaluator. Use a framework that already owns these checks, pin it as a **RunnerVersion**, and capture the native result bundle. See [Ecosystem method families](/en/evaluation/evaluators/).

**Reference-based quality evaluators** grade against dataset references: correctness, groundedness, citation coverage, RAG relevance, and faithfulness.

They require expected refs and retrieved context in the **framework** suite / native evidence bundle.

## What they measure

| Metric | Question |
|--------|----------|
| Correctness | Does the answer match the reference? |
| Groundedness | Is every claim supported by context? |
| Citation coverage | Are sources cited where required? |
| RAG faithfulness | Does the answer stay within retrieved passages? |

## Required evidence

- Model output
- Expected references in the framework definition
- Retrieved context chunks (content-addressed)
- Optional citation spans

## Example

RAG evaluators such as `support.evidence_grounded` combine reference-based checks with trajectory and environment oracles.

## Resembles

Langfuse dataset experiments with `expected_output`, Braintrust scorers over `expected`.

## Extension rule

Ship or pin a **framework runner** that already owns this method family. Do **not** add Softprobe scorer plugins, Softprobe Measurement schemas, Softprobe reducers, or Softprobe human-evaluator runtimes.

See [Ecosystem method families](/en/evaluation/evaluators/) and [Framework runners](/en/evaluation/reference/framework-adapters).
