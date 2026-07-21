---
title: How it works
---

# How agent evaluation works

An evaluation run is a **content-addressed pipeline**: compile a manifest, execute a DAG, append events, project scores, apply gates.

## Lifecycle sequence

```mermaid
sequenceDiagram
  participant Author as Author
  participant API as Public API
  participant Compiler as Manifest compiler
  participant Kernel as sp-eval-kernel
  participant Host as Local or managed host
  participant Lake as thelake ledger
  participant Proj as Projections

  Author->>API: create suite / import Promptfoo
  API->>Compiler: resolve digests
  Compiler->>Kernel: RunManifest
  Kernel->>Host: plan DAG + execute
  Host->>Kernel: subject rollout + evidence
  Kernel->>Kernel: evaluators + reducers
  Kernel->>Lake: append events
  Lake->>Proj: async score/run views
  Proj->>API: query / compare / promote
```

## Phase 1 — Author and resolve

Authors work with mutable names; execution uses immutable versions:

```text
data + subject + evaluators + environment
        ↓
   SuiteVersion (cases, evaluators, trials, gates)
        ↓
   RunManifest (+ initiator, secrets-by-ref, reproducibility class)
```

`sp eval validate` performs this compile step without executing the subject — ideal for CI lint.

## Phase 2 — Plan and execute DAG

The kernel builds a DAG (not a fixed “prompt then assert” loop):

```text
resolve versions → generate/choose cases → allocate/reset environment
 → run subject trials → wait for trace snapshot → normalize trajectory
 → materialize evidence → run item evaluators
 → run pair/group evaluators → human adjudication (optional)
 → aggregate + uncertainty → gates → publish/export
```

See [Execution DAG](/en/evaluation/architecture/execution-dag).

## Phase 3 — Subject produces rollout

The **subject** (agent, model call, or full spcode process) runs against the **environment**:

- Emits ordered turns, tool calls, observations
- Creates or adopts a **W3C trace** (`traceparent` propagated)
- Records `run_id`, `case_run_id`, `trial_id` on spans

OTLP is the observation boundary — trajectories normalize to a canonical step view shared by all evaluators.

## Phase 4 — Evaluators grade evidence

Each **evaluator** reads selected evidence and returns:

- **Status** — how the attempt ended (`succeeded`, `missing_evidence`, …)
- **Measurements** — zero or more typed facts with evidence refs

Evaluators never mutate source traces or prior measurements.

## Phase 5 — Reducers and gates

**Reducers** combine measurements across trials, cases, or subjects (mean, pass@k, confidence intervals).

**Gates** apply a versioned **GatePolicyVersion** to aggregates and measurements. Gate failure does not delete underlying facts.

## Phase 6 — Persist and project

Managed execution appends to the **thelake eval ledger** (system of record). Large bytes live in object storage; ledger stores digests and metadata (commit-before-reference).

**Projections** (scores table, run views) consume events asynchronously and are rebuildable — they are not the source of truth.

Local runs write the same event stream to JSONL; publish to thelake via validated bundle import.

## Local vs managed — same semantics

| Mode | Host | Storage |
|------|------|---------|
| Local / CI | CLI host adapter | JSONL + CAS artifacts |
| Managed | Queued workers + sandboxes | thelake ledger + object storage |
| Federated | Customer worker | Policy-filtered export only |

One conformance corpus ensures identical legal transitions and measurement IDs across hosts.

## Routing eval vs full agent eval

| Slice | Subject | Environment | What it proves |
|-------|---------|-------------|----------------|
| **Routing eval** | Pinned model + `diagnose.txt` | noop | Skill selection + confidentiality strings |
| **Troubleshooting episode** | Full Softprobe Code process | Fixture repo + stubbed APIs | Correct diagnosis, tools, outcomes |

Same envelope; different subject and environment versions. See [spcode guides](/en/evaluation/guides/spcode/).

## Online evaluation

**EvaluationPolicyVersion** selects traces from production by filter + stable sampling, snapshots evidence, and runs the same evaluator semantics as offline runs. Eval-execution traces are excluded by default to prevent recursive loops.

See [Online evaluation](/en/evaluation/concepts/online-evaluation).

## Next steps

- [Architecture overview](/en/evaluation/architecture/)
- [Scores and gates](/en/evaluation/concepts/scores-and-gates)
- [Production-to-eval loop](/en/evaluation/guides/production-to-eval-loop)
