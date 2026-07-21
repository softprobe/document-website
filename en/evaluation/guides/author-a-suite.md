---
title: Author a suite
---

# Author a suite

Define evaluation with four ingredients:

```text
data + subject + evaluators + environment
```

## Data (DatasetVersion / cases)

Each **case** includes:

- Input (user query, task spec, media refs)
- Optional expected references (gold answer, rubric ref)
- Metadata (category, difficulty)
- Lineage (`derived_from` trace or prod snapshot)
- Split label (`development`, `regression`, …)

Cases do **not** store stale model outputs.

## Subject

The **system under test**:

| Eval type | Subject example |
|-----------|-----------------|
| Routing | `diagnose.txt` digest + pinned LLM provider |
| Full agent | Softprobe Code binary + plugin + model config |

Pin every behavior-affecting digest: prompts, tools, dependency locks, image tags.

## Evaluators

List scorer versions by reference or inline descriptor:

- Deterministic (`contains`, `regex`, JSON Schema)
- LLM judges (pinned model + rubric digest)
- Trajectory assertions (tool order, span selectors)
- Environment verifiers (tests pass, oracle state)

## Environment

| Type | When |
|------|------|
| `noop` | Prompt-only routing eval |
| `fixture` | spcode episode with stubbed APIs |
| `sandbox` | Stateful tasks (Terminal-Bench-style) |

## SDK example (conceptual)

```python
from softprobe.eval import Suite, dataset, subject, evaluators, environment

suite = Suite(
    data=dataset.pin("sha256:…"),
    subject=subject.pin("oci://spcode@sha256:…"),
    environment=environment.pin("fixture:travel-ota-replay-failure"),
    evaluators=[routing_skill_match, confidentiality, outcome_verifier],
    trials=TrialPolicy(count=3, seed=42),
    gate="routing-v1",
)
suite.validate()  # compile manifest, no model cost
run = suite.run(output=".softprobe/runs/latest")
```

## REST equivalent

`POST /v1/eval/suites` with the same four fields → returns `suite_version_id` for `POST /v1/eval/runs`.

See [API reference](/en/evaluation/reference/api).
