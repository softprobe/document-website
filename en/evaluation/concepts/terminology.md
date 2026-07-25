---
title: Terminology
---

# Terminology

Alphabetical glossary for Softprobe Agent Evaluation and LLM session annotation. See [Data model](/en/evaluation/concepts/data-model) for structure and [Annotation](/en/evaluation/concepts/annotation) for how scores bind to spans.

Softprobe owns the **workflow** and **session-annotation** nouns below. Framework DSLs own cases, assertions, and in-framework graders unless noted as projections.

| Term | Definition |
|------|------------|
| <a id="annotation"></a>**Annotation** | The act of a human creating a **[score](#score)** with `source: annotation` on a chosen target (primarily a **[span](#span)** / **[observation](#observation)**). Corrections create a **new** score id; they do not mutate the old row. See [Annotation](/en/evaluation/concepts/annotation). |
| <a id="artifact-visibility"></a>**Artifact visibility** | Class controlling who may read bytes (`subject_input`, `runner_only`, `control_plane`, …). |
| <a id="assertion"></a>**Assertion / metric / judge** | Framework-native check or scorer inside a suite DSL (Promptfoo, DeepEval, …). Softprobe stores results as artifacts/provenance; it does not redefine the DSL. |
| <a id="capability-descriptor"></a>**Capability descriptor** | Runner/environment metadata: required network, mounts, secrets, budgets, residency, result-bundle schema. |
| <a id="case"></a>**Case / test / example** | Framework-native unit inside a suite (e.g. Promptfoo `tests`). Softprobe stores them inside **FrameworkDefinition** artifacts; it does not own the case schema. |
| <a id="closure-report"></a>**Closure report** | Per-dependency honesty ledger for an episode: each interaction is `recorded`, `simulated`, `seeded`, `live`, or `unsupported`. Schema `softprobe.closure-report/v1`. See [Environment bundles](/en/evaluation/concepts/environment-bundles). |
| <a id="dependency-tape"></a>**Dependency tape** | Ordered, content-addressed record of dependency interactions (tool/MCP/HTTP/fs/…) used for pre-side-effect replay. Schema `softprobe.dependency-tape/v1`. |
| <a id="environment-bundle"></a>**Environment bundle** | Immutable executable-world package: stimulus, subject adapter, tape index, state seeds, episode policy, evaluator handles. Referenced by **[EnvironmentVersion](#environment-version)**. |
| <a id="environment-version"></a>**EnvironmentVersion** | Immutable executable-world contract: environment bundle refs, promoted adapters, mounts, credential refs, network policy, resource/time limits, and declared reset/checkpoint/fork capabilities. |
| <a id="evidence-artifact"></a>**EvidenceArtifact** | Content-addressed material: native definition, native result bundle, logs, traces, usage, env evidence. |
| <a id="expected-output"></a>**Expected output** | A **text** **[score](#score)** (typically name `expected_output`) that stores corrected assistant text for later dataset / gold use. Still a **score**, not a second artifact type. |
| <a id="framework-attempt"></a>**FrameworkAttempt** | One Softprobe-invoked runner execution; retries of the outer attempt are immutable and linked. Framework-internal attempts stay in the native result bundle. |
| <a id="framework-definition"></a>**FrameworkDefinition** | Closed, content-addressed native suite and all dependencies it references. |
| <a id="gate-decision"></a>**GateDecision** | Result of applying the gate policy pinned in WorkflowVersion to outer status, provenance, and optionally selected runner-reported fields. |
| <a id="gym-episode"></a>**Gym episode / EnvironmentEpisode** | One isolated execution of a resolved **[EnvironmentVersion](#environment-version)** with reset/step (and optional checkpoint/fork). Used for evaluation and training. See [Gym episodes and training rollouts](/en/evaluation/guides/gym-and-training-rollouts). |
| <a id="human-annotation-workflow"></a>**Human annotation workflow** | Framework- or tool-owned review queue / rubric / adjudication flow. Softprobe may store its exports as evidence; Softprobe does not ship a Softprobe human-evaluator runtime. Distinct from Softprobe LLM **[annotation](#annotation)** on captured traffic. |
| <a id="measurement"></a>**Measurement** | Optional projected score fact from framework-reported results: name, value, target, evidence refs. Never invented by Softprobe evaluators. |
| <a id="observation"></a>**Observation** | Softprobe’s query view of a **[span](#span)** (type, name, timing, model, tokens, attributes, events, attached scores). In APIs and UI, “select an observation” means “select that span.” |
| <a id="online-policy"></a>**Online policy** | Filter + sampling + watermark rules that select production traces for online framework runs (workflow input, not an evaluator). |
| <a id="reproducibility-class"></a>**Reproducibility class** | `hermetic`, `pinned_external`, `recorded_external`, or `live`. |
| <a id="runner-version"></a>**RunnerVersion** | Pinned framework runner: package/lockfile/image digests, command, result-bundle schema, declared capabilities. |
| <a id="score"></a>**Score** | An immutable judgment fact in thelake: a named value (`boolean`, `numeric`, `categorical`, or `text`) with optional comment and metadata. Human **[annotation](#annotation)** creates scores; automated checks may also write scores. Not a separate “annotation object” type. |
| <a id="score-config"></a>**Score config** | An append-only schema for a score **name** and **data type** (and categories / bounds). Keeps labels consistent across reviewers. |
| <a id="score-projection"></a>**Score projection** | Optional, loss-aware mapping of framework-reported measurements into thelake `scores`. Native bundle remains authoritative. |
| <a id="score-target"></a>**Score target** | Canonical attachment for a projected measurement: `span \| trace \| session \| workflow_run \| framework_attempt`. |
| <a id="session"></a>**Session** | A product conversation or coding-agent chat: one logical user–agent dialogue that may contain many turns. Softprobe stores it under a stable `session_id` (for example an OpenCode / spcode session id). |
| <a id="span"></a>**Span** | One OTLP **span**: a single timed operation inside a **[trace](#trace)** (agent turn, generation, tool call, …). Softprobe LLM projects spans as **[observations](#observation)**. Primary attachment for Softprobe LLM **[annotation](#annotation)**. |
| <a id="subject-version"></a>**SubjectVersion** | Agent, model route, image, or deployment under test. |
| <a id="terminal-status"></a>**Terminal status** | FrameworkAttempt outcome — not a quality score. See [Result status](/en/evaluation/reference/result-status). |
| <a id="trace"></a>**Trace** | One W3C distributed **trace**: a tree of related work sharing one `trace_id`. A **[session](#session)** often contains multiple traces (one per turn or request). |
| <a id="trial"></a>**Trial / reduce / pass@k** | Framework-native or optionally projected aggregation over repeated attempts. Softprobe does not redefine trial semantics. |
| <a id="workflow-run"></a>**WorkflowRun** | One execution of one WorkflowVersion (outer lifecycle). |
| <a id="workflow-version"></a>**WorkflowVersion** | Resolved FrameworkDefinition + RunnerVersion + SubjectVersion + EnvironmentVersion + gate policy. |

## Deprecated Softprobe terms

Prefer the nouns in the table above. Older docs may still say **SuiteVersion**, **RunManifest**, **CaseRun**, **EvaluatorVersion**, or **RunRequestVersion** — treat those as pre-runner-first vocabulary for the same workflow ideas.
