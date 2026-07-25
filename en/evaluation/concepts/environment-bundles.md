---
title: Environment bundles and dependency tapes
---

# Environment bundles and dependency tapes

An **environment** is the executable task world around your agent — not a Docker image by itself. Softprobe packages that world as content-addressed artifacts so you can **reset**, **replay dependencies**, and **score outcomes** without rewriting your agent for every test case.

## Mental model

```text
production episode
  entry task + tool/MCP/HTTP/fs interactions + workspace state
                 │
                 ▼
        EnvironmentBundle (immutable)
                 │
     ┌───────────┼───────────┐
     ▼           ▼           ▼
  replay eval  fork tasks  training rollouts
```

| Artifact | What it holds |
|----------|----------------|
| **Environment bundle** | Task stimulus, subject adapter ref, dependency tape index, state seeds, episode policies, evaluator handles |
| **Dependency tape** | Ordered recorded interactions (request digests + typed responses) by **category** |
| **Closure report** | Honest status of every dependency: `recorded`, `simulated`, `seeded`, `live`, or `unsupported` |

These are **environment dependency classes**, not OpenTelemetry span kinds:

`TOOL_CALL` · `MCP_CALL` · `FILESYSTEM` · `CHILD_PROCESS` · `HTTP_CLIENT` · `CLOCK` · `RANDOM` · `USER_TURN`

## Example: support CRM agent

A coding or support agent that:

1. receives “Look up account A-42 and write a refund note”
2. calls CRM tool `get_account`
3. writes `refund-note.md` in the workspace

A recorded episode becomes a tape entry like:

```json
{
  "schema": "softprobe.dependency-tape/v1",
  "entries": [
    {
      "category": "TOOL_CALL",
      "operation": "crm.get_account",
      "request": {
        "canonical_digest": "sha256:…",
        "payload_ref": "artifact:sha256:…"
      },
      "response": {
        "payload_ref": "artifact:sha256:…",
        "runtime_type": "application/json"
      },
      "causal_parent": "span-id",
      "sequence": 0
    }
  ]
}
```

On **replay**, Softprobe matches the call **before** the real CRM runs, skips the side effect, and injects the recorded JSON (including `null` or thrown errors when that is what was captured).

## Honest closure

Every observed dependency must appear in the closure report. Softprobe never silently falls back to a live SaaS when a tape miss occurs.

```json
{
  "schema": "softprobe.closure-report/v1",
  "run_level": "recorded_external",
  "dependencies": [
    {
      "category": "TOOL_CALL",
      "operation": "crm.get_account",
      "provider": "recorded",
      "call_site": "agent#tools.get_account",
      "canonical_request_digest": "sha256:…",
      "available_capabilities": ["tape_replay"]
    }
  ]
}
```

`run_level` is the least reproducible level of any dependency: `hermetic`, `recorded_external`, `pinned_external`, or `live`.

## What Softprobe does not invent

- Softprobe does **not** replace Promptfoo/DeepEval assertion DSLs.
- Softprobe does **not** treat raw historic OTLP as an evaluation by itself — frameworks must be **invoked**.
- Softprobe does **not** claim a container or VM snapshot alone makes an agent episode deterministic.

## Related

- [Record and replay an agent environment](/en/evaluation/guides/record-replay-agent-environment)
- [Prompt-only vs environment eval](/en/evaluation/guides/eval-modes)
- [Environment outcome evaluators](/en/evaluation/evaluators/environment-outcome)
- [Node packages](/en/evaluation/reference/node-packages)
