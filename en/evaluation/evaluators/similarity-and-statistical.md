---
title: Similarity and statistical evaluators
---

# Similarity and statistical evaluators

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
- Optional n-gram or embedding config in EvaluatorVersion parameters

## Reproducibility

Classify as `pinned_external` when a model produces embeddings. Hermetic runs pin weights and disable network.

## Resembles

Traditional NLP benchmarks, embedding-based RAG evaluators in Langfuse experiments.

## Extension rule

Ship as batchable scorer plugins with declared MIME/schema acceptance in the capability descriptor.
