---
title: Human annotation evaluators
---

# Human annotation evaluators

**Human annotation evaluators** integrate blinded queues, rubric scoring, pairwise preferences, and adjudication.

They use the same measurement envelope as automated scorers — async **human evaluator runtime**, not a separate score subsystem.

## What they measure

- Rubric dimensions assigned by annotators
- Pairwise preferences between candidates
- Adjudicated labels after disagreement
- Inter-rater agreement metadata

## Workflow

1. CaseRun completes with evidence artifacts
2. Human queue receives blinded assignment
3. Annotator submits measurements linked to evaluator version
4. Adjudicator resolves conflicts; aggregates compute agreement

## Governance

Separate proposal, review, approval, publication, and activation permissions with digest-bound approvals. See [Human evaluation](/en/evaluation/concepts/human-evaluation).

## Resembles

Langfuse annotation queues, Braintrust human review, Prod eval rubric workflows.

## Extension rule

Human runtime is an EvaluatorVersion with `runtime: remote` or dedicated queue adapter — measurements still flow through the ledger.
