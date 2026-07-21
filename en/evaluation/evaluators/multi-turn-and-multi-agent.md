---
title: Multi-turn and multi-agent evaluators
---

# Multi-turn and multi-agent evaluators

**Multi-turn evaluators** grade dialogue quality, handoffs, collaboration, and simulated-user scenarios using stateful rollout protocols.

## What they measure

- Dialogue coherence across turns
- Handoff correctness between sub-agents
- Simulated-user goal completion
- Role adherence and turn-taking policy

## Required evidence

- Multi-turn Rollout with nested traces
- Environment `step` / `observe` state between turns
- Role and turn metadata on CaseVersion

## Configuration

Requires Environment with stateful lifecycle and Subject configured for multi-turn or multi-agent topology. Evaluators may target `rollout` or `case_run` score targets.

## Resembles

τ-bench-style simulated users, multi-agent orchestration benchmarks, conversational RAG evals.

## Extension rule

Stateful rollout protocol + span selectors — not a separate score subsystem per turn.
