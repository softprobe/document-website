---
title: Multi-turn and multi-agent evaluators
---

# Multi-turn and multi-agent evaluators

> **Softprobe role:** Softprobe does not implement this family as a Softprobe evaluator. Use a framework that already owns these checks, pin it as a **RunnerVersion**, and capture the native result bundle. See [Ecosystem method families](/en/evaluation/evaluators/).

**Multi-turn evaluators** grade dialogue quality, handoffs, collaboration, and simulated-user scenarios using stateful rollout protocols.

## What they measure

- Dialogue coherence across turns
- Handoff correctness between sub-agents
- Simulated-user goal completion
- Role adherence and turn-taking policy

## Required evidence

- Multi-turn Rollout with nested traces
- Environment `step` / `observe` state between turns
- Role and turn metadata in the framework suite

## Configuration

Requires Environment with stateful lifecycle and Subject configured for multi-turn or multi-agent topology. Evaluators may target `rollout` or `case_run` score targets.

## Resembles

τ-bench-style simulated users, multi-agent orchestration benchmarks, conversational RAG evals.

## Extension rule

Ship or pin a **framework runner** that already owns this method family. Do **not** add Softprobe scorer plugins, Softprobe Measurement schemas, Softprobe reducers, or Softprobe human-evaluator runtimes.

See [Ecosystem method families](/en/evaluation/evaluators/) and [Framework runners](/en/evaluation/reference/framework-adapters).
