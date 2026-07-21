---
title: Human evaluation
---

# Human evaluation

Human review is an **asynchronous evaluator runtime** — not a separate score subsystem.

## Workflow states

The ledger records durable states:

- `waiting_for_assignment`
- `waiting_for_review`
- expiring leases, deadlines, reassignment, withdrawal
- partial completion and adjudication links

Pause and resume are kernel transitions; the scheduler manages lease timing only.

## Blinded assignment

Human evaluator descriptors request:

- randomized presentation order (pairwise)
- rater pseudonymization
- replication count and qualification rules
- adjudication when raters disagree

Results record rubric version, timing, and agreement metrics for meta-evaluation.

## Measurements

Human labels emit **measurements** like any evaluator — with targets, evidence refs, and status. They feed aggregates and gates the same way as automated scorers.

## AI proposals vs human approval

AI agents may propose cases, rubrics, or evaluator changes. **Approval, publication, and gate activation** require configured human or independent policy authorization — digest-bound, server-enforced RBAC.

See [Human annotation evaluators](/en/evaluation/evaluators/human-annotation).
