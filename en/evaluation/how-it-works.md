---
title: How agent evaluation works
---

# How agent evaluation works

An evaluation run is a **framework-runner workflow**: resolve a pinned workflow, execute one opaque runner in a controlled environment, commit native evidence, optionally project scores, then apply gates.

## End-to-end lifecycle

```mermaid
sequenceDiagram
  participant Author as Author
  participant API as Public API
  participant Kernel as sp-eval-kernel
  participant Host as Local or managed host
  participant Runner as Framework runner
  participant Subject as Subject under test
  participant Lake as thelake ledger

  Author->>API: pack FrameworkDefinition + pin runner/subject/env
  API->>Kernel: resolve WorkflowVersion
  Kernel->>Host: validate capabilities + plan
  Host->>Runner: invoke pinned runner
  Runner->>Subject: framework-owned cases / providers
  Subject-->>Runner: framework-native results
  Runner-->>Host: native result bundle + logs
  Host->>Kernel: commit EvidenceArtifact + terminal status
  Kernel->>Lake: append workflow.* events
  Kernel->>Kernel: GateDecision
  Lake-->>API: query / compare / promote
```

## Pipeline overview

```mermaid
flowchart TB
  subgraph phase1 [1 Pack and resolve]
    A1[framework suite + subject + environment + runner]
    A2[WorkflowVersion]
    A1 --> A2
  end
  subgraph phase2 [2 Execute outer attempt]
    D1[Validate pins and capabilities]
    D2[Launch FrameworkAttempt]
    D3[Collect native result + traces]
    D4[Commit EvidenceArtifact]
    D1 --> D2 --> D3 --> D4
  end
  subgraph phase3 [3 Persist and gate]
    P1[WorkflowRun ledger / JSONL]
    P2[Optional score projection]
    P3[GateDecision]
    P1 --> P2 --> P3
  end
  phase1 --> phase2 --> phase3
```

## Phase 1 — Pack and resolve

Authors keep **framework-native** files. Softprobe resolves immutable versions:

```text
framework suite + subject + environment + runner
        ↓
   FrameworkDefinition + RunnerVersion + SubjectVersion + EnvironmentVersion
        ↓
   WorkflowVersion (+ gate policy)
```

`sp eval validate` checks closed artifact sets, runner pins, and capability compatibility **without** translating assertions or calling the subject.

## Phase 2 — FrameworkAttempt

The kernel treats the runner as **one opaque execution node**. Softprobe does not expand cases, run assertions, or aggregate framework-internal trials.

```mermaid
flowchart LR
  R[Resolve WorkflowVersion]
  C[Capability admission]
  F[FrameworkAttempt]
  E[Evidence commit]
  T[Typed terminal status]
  R --> C --> F --> E --> T
```

Inside the runner, Promptfoo/DeepEval (or another framework) owns matrix expansion, providers, assertions, and its own report formats. Softprobe records digests and outer status only.

See [Execution DAG](/en/evaluation/architecture/execution-dag) for host planning around that opaque node.

## Phase 3 — Subject and observation

The **subject** is whatever the framework exercises (model route, agent process, …) under the **EnvironmentVersion** Softprobe enforces:

```mermaid
flowchart LR
  Def[FrameworkDefinition]
  Sub[SubjectVersion]
  Env[EnvironmentVersion]
  Trace[W3C OTLP trace]
  Def --> Sub
  Env --> Sub
  Sub --> Trace
```

Each FrameworkAttempt creates or adopts a W3C trace and records `workflow_run_id`, `framework_attempt_id`, `workflow_version_id`, and `runner_version_id`. Eval-execution traces use a reserved internal environment and are excluded from online rules by default.

## Phase 4 — Evidence and optional projection

```mermaid
flowchart TB
  Bundle[Native result bundle]
  Logs[stdout / stderr / logs]
  Trace[OTLP traces / usage]
  Ev[EvidenceArtifact]
  Proj[Optional score projection]
  Bundle --> Ev
  Logs --> Ev
  Trace --> Ev
  Ev --> Proj
```

- **Native bundle** is authoritative for framework semantics.
- **Projection** may emit lossy measurements for query — never a Softprobe re-score of assertions.
- Malformed or oversized bundles map to typed failures (`invalid_input`, `missing_evidence`, …), never score `0`.

## Phase 5 — Gates

**Gates** apply the policy pinned in WorkflowVersion to outer status, provenance, and optionally selected runner-reported fields. Gate failure does not delete evidence.

```mermaid
flowchart LR
  Status[FrameworkAttempt status]
  Native[Selected native fields]
  GP[Gate policy]
  GD[GateDecision]
  Status --> GP
  Native --> GP
  GP --> GD
```

## Phase 6 — Persist

Managed execution appends to the **thelake** eval ledger. Large bytes live in object storage; the ledger stores digests (commit-before-reference). Local runs write the same event stream to JSONL and may publish via validated bundle import.

## Local vs managed — same semantics

```mermaid
flowchart TB
  Kernel[sp-eval-kernel same binary]
  Local[Local / CI host]
  Managed[Managed workers]
  Fed[Federated workers]
  Kernel --> Local & Managed & Fed
  Local --> JSONL[JSONL + CAS dir]
  Managed --> Lake[thelake ledger]
  Fed --> Lake
```

| Mode | Host | Storage |
|------|------|---------|
| Local / CI | CLI host | JSONL + CAS artifacts |
| Managed | Queued workers + sandboxes | thelake ledger + object storage |
| Federated | Customer worker | Policy-filtered export only |

## Prompt-only vs environment-backed

| Slice | What Softprobe pins | What the framework does |
|-------|---------------------|-------------------------|
| **Prompt-only** | Model/prompt subject + noop/light env | Assertions on text outputs |
| **Environment-backed** | Full agent subject + fixture env | Tool/trajectory/outcome checks in-framework |

Same Softprobe envelope; different SubjectVersion and EnvironmentVersion. See [Prompt-only vs environment eval](/en/evaluation/guides/eval-modes).

## Online evaluation

An online **policy** selects production traces (filter + stable sampling), snapshots evidence, and launches the **same framework runner** workflow — Softprobe does not switch to a parallel Softprobe-owned grader. Eval-execution traces are excluded by default.

```mermaid
flowchart LR
  Prod[Production OTEL traces]
  Pol[Online policy]
  Snap[Evidence snapshot]
  Runner[Pinned framework runner]
  Native[Native result + GateDecision]
  Prod --> Pol --> Snap --> Runner --> Native
```

See [Online vs offline](/en/evaluation/concepts/online-vs-offline) and [Promptfoo on production OTEL](/en/evaluation/guides/promptfoo-online-otel).

## Next steps

- [Mental model](/en/evaluation/mental-model)
- [Architecture overview](/en/evaluation/architecture/)
- [Scores and gates](/en/evaluation/concepts/scores-and-gates)
- [Production-to-eval loop](/en/evaluation/guides/production-to-eval-loop)
