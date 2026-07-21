---
title: Comparative judge evaluators
---

# Comparative judge evaluators

**Comparative judge evaluators** run pairwise, listwise, or tournament comparisons across multiple SubjectVersions or candidates within one CaseRun group.

## What they measure

- Pairwise preference (A vs B)
- Listwise ranking across N candidates
- Tournament win rates and Elo-style aggregates
- Baseline-relative improvement

## Topology

Use **group** topology with position randomization to reduce position bias. Emit comparative measurements and optional aggregate win rates via Reducers.

## Required evidence

- One evidence bundle per candidate in the group
- Shared case input and environment snapshot
- Optional blinded presentation metadata for human comparative judges

## Resembles

Promptfoo compare mode, Braintrust side-by-side experiments, human pairwise preference queues.

## Extension rule

Group execution + comparative scorer + reducer — not a new EvaluationResult schema.
