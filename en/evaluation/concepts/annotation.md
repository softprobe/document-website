---
title: Annotation
---

# Annotation

[**Annotation**](/en/evaluation/concepts/terminology#annotation) is how Softprobe turns captured LLM traffic into labeled ground truth: a human attaches a structured [**score**](/en/evaluation/concepts/terminology#score) to a specific unit of work so you can later filter quality, validate automated checks, and curate eval datasets.

**Annotation** is the human *act*. A **score** is the *stored judgment*. Annotation creates scores (`source: annotation`); it is not a separate table. Full definitions: [Terminology](/en/evaluation/concepts/terminology).

This page is about **session annotation** on Softprobe LLM data in thelake (for example via Session Explorer). It is **not** a Softprobe-native scorer DSL and not an Agent Evaluation human-grader runtime. For framework-owned review workflows (Promptfoo, DeepEval, external tools), see [Human evaluation](/en/evaluation/concepts/human-evaluation) and [human annotation workflow](/en/evaluation/concepts/terminology#human-annotation-workflow).

## What annotation is for

Same product intent as Langfuse / Braintrust / LangSmith human review:

1. **Label quality** on real traffic (correct / incorrect, rubric categories, notes) — stored as [scores](/en/evaluation/concepts/terminology#score).
2. **Record corrections** ([expected output](/en/evaluation/concepts/terminology#expected-output)) for offline eval.
3. **Bridge capture → eval** — labeled [spans](/en/evaluation/concepts/terminology#span) can later be promoted into datasets / framework suites ([Production-to-eval loop](/en/evaluation/guides/production-to-eval-loop)).

Softprobe does **not** use annotation to invent Softprobe-native automated evaluators. Automated quality checks stay in frameworks; annotation is human ground truth on captured [**observations**](/en/evaluation/concepts/terminology#observation).

## How a score is bound (span, trace, session)

Industry tools attach feedback at different granularities. Softprobe LLM annotation follows the usual “judge this step” model:

```text
Session  (conversation)
  └── Trace  (one turn / request tree)
        └── Span / Observation  ← annotation attaches here (primary)
```

| Attachment | Softprobe LLM annotation today |
|------------|--------------------------------|
| [**Span**](/en/evaluation/concepts/terminology#span) / [**observation**](/en/evaluation/concepts/terminology#observation) | **Primary.** Explorer Annotate writes `span_id` for the selected observation. |
| [**Trace**](/en/evaluation/concepts/terminology#trace) | **Denormalized.** The same [score](/en/evaluation/concepts/terminology#score) row stores that observation’s `trace_id` for query and display. Annotation is not a separate “trace-only” mode in Session Explorer. |
| [**Session**](/en/evaluation/concepts/terminology#session) | **Denormalized when known.** The same score row stores `session_id` when the observation carried one. |

So: **annotation is bound to the [span](/en/evaluation/concepts/terminology#span) ([observation](/en/evaluation/concepts/terminology#observation)) you selected.** Trace and session ids travel with the score so you can list “all annotations in this session” or “in this trace” without inventing a second binding type.

This matches Langfuse / LangSmith when they score an observation or run and also record the parent trace id. Langfuse can additionally attach a score to a trace alone or a session alone; Softprobe LLM Session Explorer always selects a span first.

Optional Agent Evaluation [**score targets**](/en/evaluation/concepts/terminology#score-target) (`span` \| `trace` \| `session` \| `workflow_run` \| `framework_attempt`) are described in [Score targets](/en/evaluation/reference/score-targets). Session annotation uses the span-centric columns above; it does not require a Softprobe [WorkflowRun](/en/evaluation/concepts/terminology#workflow-run).

## What gets written

When you annotate in Session Explorer (or via API), Softprobe creates a [**score**](/en/evaluation/concepts/terminology#score) with:

- `source: annotation`
- `span_id` — selected [**observation**](/en/evaluation/concepts/terminology#observation)
- `trace_id` — that observation’s [**trace**](/en/evaluation/concepts/terminology#trace)
- `session_id` — that observation’s [**session**](/en/evaluation/concepts/terminology#session) (when present)
- `name` / typed value — from the chosen [**score config**](/en/evaluation/concepts/terminology#score-config)
- optional `config_id`, `author_id`, `comment`, `metadata`

Example shapes:

| [Score config](/en/evaluation/concepts/terminology#score-config) | Typical use |
|--------------|-------------|
| `correctness` (boolean) | Pass/fail on this observation |
| `quality` (categorical) | Coarse label (`good` / `ok` / `bad`) |
| `expected_output` (text) | Corrected assistant text ([**expected output**](/en/evaluation/concepts/terminology#expected-output)) |

## Flow

```text
Capture (OTLP) → Session / Trace / Span in thelake
                      ↓
              Select observation in Explorer
                      ↓
              Annotation → Score (source=annotation)
                      ↓
         Later: promote labeled spans into eval datasets (Phase B / framework suites)
```

## Related

- [Terminology](/en/evaluation/concepts/terminology) — single glossary ([score](/en/evaluation/concepts/terminology#score), [annotation](/en/evaluation/concepts/terminology#annotation), …)
- [Human evaluation](/en/evaluation/concepts/human-evaluation) — framework-native review vs Softprobe custody
- [Scores and gates](/en/evaluation/concepts/scores-and-gates) — projected measurements vs authoritative native results
- [Correlation and traces](/en/evaluation/concepts/correlation-and-traces) — W3C ids on eval runs
- [Langfuse and Braintrust adoption](/en/evaluation/guides/langfuse-and-braintrust-adoption)
- [Production-to-eval loop](/en/evaluation/guides/production-to-eval-loop)
