---
title: Similarity and statistical evaluators
---

# Similarity and statistical evaluators

> **Softprobe role:** Softprobe does not implement this family as a Softprobe evaluator. Use a framework that already owns these checks, pin it as a **RunnerVersion**, and capture the native result bundle. See [Ecosystem method families](/en/evaluation/evaluators/).

**Similarity and statistical evaluators** grade outputs with edit distance, BLEU/ROUGE, embedding similarity, classifiers, and calibration metrics.

They require **batchable** execution and pinned model/artifact digests when embeddings or classifiers participate.

## What they measure

- Lexical overlap (BLEU, ROUGE, chrF)
- Semantic similarity (cosine distance on embeddings)
- Classifier confidence and calibration
- Statistical significance of paired deltas

## Required evidence

- Candidate text
- Reference text from CaseVersion or dataset
- Optional n-gram or embedding config in the framework suite

## Reproducibility

Classify as `pinned_external` when a model produces embeddings. Hermetic runs pin weights and disable network.

## Resembles

Traditional NLP benchmarks, embedding-based RAG evaluators in Langfuse experiments.

## Extension rule

Ship or pin a **framework runner** that already owns this method family. Do **not** add Softprobe scorer plugins, Softprobe Measurement schemas, Softprobe reducers, or Softprobe human-evaluator runtimes.

See [Ecosystem method families](/en/evaluation/evaluators/) and [Framework runners](/en/evaluation/reference/framework-adapters).
