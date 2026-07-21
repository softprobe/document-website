---
title: Plugin model
---

# Plugin model

Evaluators and environments extend the kernel through **capability descriptors** — not closed enum kinds.

## Plugin pipeline

```mermaid
flowchart TB
  Gen[Generator]
  Sub[Subject]
  Env[Environment]
  Adp[EvidenceAdapter]
  Eval[Evaluator]
  Red[Reducer]
  Gate[Gate]
  Rep[Reporter]
  Gen --> Sub
  Sub --> Env
  Sub --> Adp
  Adp --> Eval
  Eval --> Red
  Red --> Gate
  Gate --> Rep
```

## Plugin interfaces

```text
Generator.generate(seed, cases)     → derived cases + lineage
Subject.run(case, env, context)    → rollout + artifact refs
Environment.reset/step/observe/verify → state artifacts
EvidenceAdapter.materialize(selectors, snapshot) → evidence bundle
Evaluator.evaluate(bundle | group | stream) → measurements + status
Reducer.reduce(results, grouping, seed) → aggregates
Gate.decide(aggregates, baseline)  → decision + reasons
Reporter.consume(events)           → side effects (reports, webhooks)
```

## Evaluator execution topologies

```mermaid
flowchart LR
  Item[item one case]
  Pair[pair A vs B]
  Group[group listwise]
  Stream[stream partial]
  Agg[aggregate reducer]
  Item --> Eval1[Evaluator]
  Pair --> Eval2[Comparative judge]
  Group --> Eval3[Tournament]
  Stream --> Eval4[Streaming judge]
  Eval1 & Eval2 & Eval3 & Eval4 --> Agg
```

## Evaluator descriptor fields

- protocol and implementation version
- runtime: `wasm`, `oci`, `process`, `remote`, `builtin`
- topology: `item`, `pair`, `group`, `stream`, `aggregate`
- required evidence selectors and accepted MIME/schema versions
- output measurement schema and target scopes
- determinism level, seed support, batchability, cache policy
- network, secret, filesystem, GPU, model, budget capabilities
- data residency and content-sensitivity constraints

Planning rejects incompatible descriptors before spending money.

## Framework adapters

Promptfoo/DeepEval integrate as:

```mermaid
flowchart LR
  PF[Promptfoo YAML]
  Imp[Importer compiler]
  Node[Sandboxed DAG node]
  Leg[Legacy run importer]
  PF --> Imp --> Manifest[RunManifest]
  PF --> Node
  PF --> Leg
```

1. **Importer** — YAML → manifest
2. **Sandboxed evaluator node** — one DAG invocation; no nested orchestration
3. **Opaque legacy importer** — whole run as non-cacheable external node

## Extension rule

New evaluation methods should ship as new scorer, reducer, generator, environment, or evidence adapter — **not** new core result types.

See [Capability descriptors](/en/evaluation/reference/capability-descriptors).
