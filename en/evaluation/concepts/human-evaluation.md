---
title: Human evaluation
---

# Human evaluation

Human review for **Agent Evaluation workflows** stays **framework-native or external**. Softprobe does **not** ship a Softprobe human-evaluator runtime, Softprobe annotation queues, or Softprobe pause/resume grader states.

Softprobe’s job in that path is custody and governance: pin the framework/human-workflow artifacts, capture digests, project optional measurements, and apply release gates.

Separately, Softprobe LLM **session annotation** lets reviewers attach immutable **scores** to captured **observations** (spans) in thelake — see [Annotation](/en/evaluation/concepts/annotation) (glossary and binding). That path labels production traffic; it is not a Softprobe scorer DSL and not an Agent Evaluation grader runtime.

## Softprobe role

```mermaid
flowchart LR
  Human[Human / external review tool]
  Native[Framework-native or export artifacts]
  Ev[EvidenceArtifact digests]
  Gate[GateDecision / promote]
  Human --> Native --> Ev --> Gate
```

| Softprobe does | Softprobe does not |
|----------------|--------------------|
| Store approved human-result artifacts + provenance | Own assignment, leases, blinding UI |
| Optional score projection of labeled fields | Softprobe “human evaluator” plugin ABI |
| Digest-bound approve / publish / activate | Self-approval by proposing AI agents |

## Typical patterns

1. **In-framework human steps** — Promptfoo/DeepEval/annotation product records labels in its native result bundle; Softprobe runs that suite via a pinned runner.
2. **External review export** — A review tool exports a signed/labeled artifact; Softprobe commits it as EvidenceArtifact and may project selected fields.
3. **Governed promotion** — Humans approve FrameworkDefinition / WorkflowVersion / gate-policy digests (see [Production-to-eval loop](/en/evaluation/guides/production-to-eval-loop)).

## AI proposals vs human approval

AI agents may **propose** framework-definition or policy changes. **Approval, publication, and gate activation** require configured human or independent policy authorization — digest-bound, server-enforced RBAC.

## Related

- [Annotation](/en/evaluation/concepts/annotation) — session / span scores on captured LLM traffic
- [Ecosystem method family: human annotation](/en/evaluation/evaluators/human-annotation)
- [Scores and gates](/en/evaluation/concepts/scores-and-gates)
