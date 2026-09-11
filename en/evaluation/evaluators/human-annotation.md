---
title: Human annotation evaluators
---

# Human annotation evaluators

> **Softprobe role:** Softprobe does not implement this family as a Softprobe evaluator. Use a framework that already owns these checks, pin it as a **RunnerVersion**, and capture the native result bundle. See [Ecosystem method families](/en/evaluation/evaluators/).
>
> For labeling Softprobe LLM captures with scores on a **span** / **observation** (not a Softprobe evaluator), see [Annotation](/en/evaluation/concepts/annotation).

**Human annotation evaluators** integrate blinded queues, rubric scoring, pairwise preferences, and adjudication.

They use the same measurement envelope as automated scorers — external / in-framework human review, not a separate score subsystem.

## What they measure

- Rubric dimensions assigned by annotators
- Pairwise preferences between candidates
- Adjudicated labels after disagreement
- Inter-rater agreement metadata

## Workflow

1. FrameworkAttempt completes with EvidenceArtifacts
2. Human queue receives blinded assignment
3. Annotator submits measurements linked to evaluator version
4. Adjudicator resolves conflicts; aggregates compute agreement

## Governance

Separate proposal, review, approval, publication, and activation permissions with digest-bound approvals. See [Human evaluation](/en/evaluation/concepts/human-evaluation).

## Resembles

Langfuse annotation queues, Braintrust human review, Prod eval rubric workflows.

## Extension rule

Ship or pin a **framework runner** that already owns this method family. Do **not** add Softprobe scorer plugins, Softprobe Measurement schemas, Softprobe reducers, or Softprobe human-evaluator runtimes.

See [Ecosystem method families](/en/evaluation/evaluators/) and [Framework runners](/en/evaluation/reference/framework-adapters).
