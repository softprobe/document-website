---
title: Kernel and hosts
---

# Kernel and hosts

One **sp-eval-kernel** owns **workflow** semantics (resolve, outer FrameworkAttempt, evidence commit, gates). Frameworks own assertion/scorer semantics inside the runner. **Hosts** supply execution primitives — they never synthesize Softprobe orchestration decisions.

## Responsibility split

```mermaid
flowchart TB
  subgraph kernel [sp-eval-kernel owns]
    V[Validate WorkflowVersion]
    P[Plan outer attempt]
    ID[FrameworkAttempt IDs]
    R[Retry classification]
    E[Event schemas]
    G[Terminal run + GateDecision]
  end
  subgraph host [Host owns]
    L[Process / container launch]
    B[Artifact byte I/O]
    C[Clock / random / secrets]
    X[Cancellation delivery]
  end
  Host -->|kernel commands| kernel
  kernel -->|plan + actions| Host
```

## sp-eval-kernel

One statically linked **Rust** binary implements validation, outer DAG planning, idempotent FrameworkAttempt execution, state transitions, and event emission.

| Transport | Use |
|-----------|-----|
| stdin/stdout framed Protobuf | One-shot local/CI |
| Unix socket or gRPC | Long-lived managed/federated daemon |

Same crate, same semantics — verified by shared conformance corpus.

## Hosts

```mermaid
flowchart LR
  K[Kernel]
  Local[Local CI CLI]
  Mgd[Managed worker]
  Fed[Federated worker]
  K --> Local & Mgd & Fed
  Local --> JSONL[JSONL bundle]
  Mgd --> Lake[thelake ingest]
  Fed --> Lake
```

| Host | Owns | Does not own |
|------|------|--------------|
| **Local/CI CLI** | Process launch, local CAS artifact dir, collecting framework JUnit/Markdown | Workflow IDs, gate logic |
| **Managed worker** | Queues, sandboxes, quotas, tenancy, object storage upload | Whether retries are legal (asks kernel) |
| **Federated worker** | Private data residency, hardware placement | Authoritative state without signed ingestion |

Hosts feed every lease outcome back through kernel commands; they do not append raw events from public clients.

## SDK layers

| Layer | Audience |
|-------|----------|
| Public Python/TS SDK | Ergonomic workflow clients, REST clients |
| Internal host client | Framed Protobuf state-machine commands (trusted only) |

Public SDKs never export kernel event append or transition APIs.

## Distribution

`sp-eval-kernel` ships with Softprobe CLI releases: pinned protocol compatibility, checksum/signature, platform matrix (linux/darwin, amd64/arm64). Upgrade/downgrade refusal when WorkflowVersion requires unsupported capabilities.

## Related

- [Trust boundaries](/en/evaluation/architecture/trust-boundaries)
- [Execution DAG](/en/evaluation/architecture/execution-dag)
