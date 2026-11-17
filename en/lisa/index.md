# Lisa

Lisa is an AI QA engineer for reviewing and improving agent behavior. It accepts agent sessions over OTLP, evaluates approved policies against captured trajectories, and records triage decisions and activity threads in its own PostgreSQL store.

Lisa runs standalone and does not require TheLake or Explorer.

## What Lisa does

- **Direct session intake:** Receives complete OTLP JSON session bundles at `POST /internal/v1/session-traces` on a private network, persists them to disk, and enqueues evaluation work transactionally via PGMQ.
- **Policy-driven evaluation:** Stores workspace-wide and agent-specific rules in `lisa.policies`. Only owner-approved policies drive evaluation verdicts.
- **Triage and judgment:** Evaluates candidate session-policy pairs, escalates flagged evidence for LLM judgment, and stores results with traceable evidence.
- **Activities and Slack:** Tracks evaluation runs, monitors, and findings as activities, with optional Slack event and alert integration.

## Next steps

- [Getting started with Lisa](/en/lisa/getting-started)
- [Policies and activities](/en/lisa/policies-and-activities)
- [Runtime configuration](/en/lisa/configuration)
