---
title: Terminology
---

# Terminology

Alphabetical glossary for Agent Evaluation. See [Data model](/en/evaluation/concepts/data-model) for structure and relationships.

| Term | Definition |
|------|------------|
| **Aggregate** | Reducer output across trials, cases, subjects, groups, or raters (mean, pass@k, CI, paired delta). |
| **Artifact visibility** | Class controlling who may read bytes: `subject_input`, `evaluator_only`, `control_plane`. |
| **Attempt** | One evaluator execution try; retries are immutable and linked; duplicate logical measurements prevented by deterministic IDs. |
| **CaseRun** | Runtime unit: one CaseVersion × one SubjectVersion × one trial. |
| **CaseVersion** | Immutable test input: task, optional expected refs, metadata, lineage — no stale actual output. |
| **Capability descriptor** | Evaluator metadata: topology, runtime, evidence selectors, determinism, budgets, residency. |
| **DatasetVersion** | Immutable ordered or query-resolved set of CaseVersions. |
| **EnvironmentVersion** | Harness contract: reset, step, observe, verify; may be noop. |
| **EvaluationPolicyVersion** | Online/backfill policy: filters, sampling, watermarks, budgets. |
| **EvaluationResult** | Per-evaluator attempt outcome: status + optional measurements. |
| **EvaluatorVersion** | Immutable scorer package: selectors, schema, runtime, capabilities. |
| **Event** | Append-only ledger record (`run.planned`, `measurement.emitted`, …). |
| **EvidenceArtifact** | Content-addressed material graders read: output, trajectory, env state, context. |
| **GateDecision** | Result of applying GatePolicyVersion to measurements/aggregates. |
| **GatePolicyVersion** | Versioned pass/fail rules over measurements (not the same as raw scores). |
| **Generator** | Plugin that derives cases from seeds with lineage. |
| **Manifest** | See **RunManifest**. |
| **Measurement** | Typed score fact: name, value, target, evaluator version, evidence refs, cost/latency. |
| **Reducer** | Plugin that aggregates measurements (pass@k, mean, paired tests). |
| **Reproducibility class** | `hermetic`, `pinned_external`, `recorded_external`, or `live`. |
| **Rollout** | Ordered agent turns/actions/observations with W3C trace context. |
| **Run** | One execution of one RunManifest. |
| **RunManifest** | Fully resolved snapshot of suite + initiator + secrets + reproducibility. |
| **Score projection** | Async mapping of measurements to queryable thelake scores rows. |
| **Score target** | Entity a measurement attaches to (span, trace, session, rollout, case_run, run, comparison_group). |
| **Status** | Evaluator attempt terminal outcome — not a quality score. See [Result status](/en/evaluation/reference/result-status). |
| **SubjectVersion** | Agent/policy under test: digests, model, prompts, tools, locks. |
| **SuiteVersion** | Bundle: cases, subjects, environment, evaluators, trials, reducers, gates. |
| **Trial** | Repeated execution of same case×subject with derived seed (for stochastic eval). |
