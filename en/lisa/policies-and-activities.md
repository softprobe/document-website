# Policies and activities

Lisa separates **policy definition** from **session evidence** so observed agent behavior never becomes an approved rule without owner confirmation.

## Policy lifecycle

- Policies live in the `lisa.policies` table (`id`, `scope`, `target_agent_name`, `name`, `criteria`, `approved`).
- **Workspace vs. agent scope:** Workspace rules apply across all agents in the deployment; an approved agent-scoped rule overrides an approved workspace rule of the same name.
- **Approval requirement:** New or updated policies start as unapproved (`approved: no`). Only owner-approved policies (`LISA_OWNER_USER_IDS`) can drive evaluation verdicts.

## Evaluation flow

1. A telemetry producer pushes an OTLP JSON bundle to `POST /internal/v1/session-traces`.
2. Lisa validates `sp.session.id` (falling back to `gen_ai.conversation.id`, then trace ID) and `sp.agent.name` (falling back to `service.name`), writes `otlp.json` + `manifest.json`, and enqueues a PGMQ job.
3. The evaluation worker loads approved policies for the resolved agent, triages candidate session-policy pairs, runs LLM judgment on escalated items, and records the outcome.

## Activities and Slack

- Each evaluation creates an activity entry for inspection in the Lisa UI.
- Optional `LISA_SLACK_*` settings connect Lisa to Slack workspaces to post verified policy failures and handle monitor threads.
