---
title: Comparative judge evaluators
---

# Comparative judge evaluators

> **Softprobe role:** Softprobe does not implement this family as a Softprobe evaluator. Use a framework that already owns these checks, pin it as a **RunnerVersion**, and capture the native result bundle. See [Ecosystem method families](/en/evaluation/evaluators/).

**Comparative judges** (in-framework) run pairwise, listwise, or tournament comparisons across candidates. Softprobe may compare SubjectVersions via separate WorkflowRuns.

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

Ship or pin a **framework runner** that already owns this method family. Do **not** add Softprobe scorer plugins, Softprobe Measurement schemas, Softprobe reducers, or Softprobe human-evaluator runtimes.

See [Ecosystem method families](/en/evaluation/evaluators/) and [Framework runners](/en/evaluation/reference/framework-adapters).
