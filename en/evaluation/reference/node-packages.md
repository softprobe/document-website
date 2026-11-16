---
title: Node packages (agent environments)
---

# Node packages (agent environments)

Softprobe ships Node packages for recording, replaying, scoring, and training against executable agent environments. Install from the Softprobe LLM workspace (`sp-llm`) or your registry mirror.

## Package map

| Package | Use it for |
|---------|------------|
| `@softprobe/tracing` | Ingestion Key, standard OTLP configuration, session telemetry, explicit score calls |
| `@softprobe/agent` | Episode context, dependency tape, skip/inject wraps, FS overlay, closure reports |
| `@softprobe/protocol-fabric` | Capture/replay ambient Node `fetch` / undici HTTP (complements semantic wraps) |
| `@softprobe/promptfoo-adapter` | Invoke Promptfoo natively → `softprobe.framework-result/v1` |
| `@softprobe/gym` | Episode reset/step/fork API + training session façade |
| `@softprobe/simulator-synth` | Research: synthesize filesystem transition programs from observed before/after state |
| `@softprobe/opencode-plugin` | OpenCode **observation** telemetry (not the replay owner) |

## Ownership rule (important)

| Softprobe product knowledge | Host / adapter concern |
|-----------------------------|-------------------------|
| Ingestion Key and standard OTLP env parsing | Host config file paths |
| Resolve `otlp.tracesEndpoint` and generic OTLP endpoint precedence | Discovery order (env then file) |
| Default trace export to production when no OTLP endpoint is configured | Soft-disable when credentials missing |
| Meaning of `environment` / `userId` / `serviceName` | Host defaults (`serviceName: "opencode"`, …) |

Any code that resolves Ingestion Key or OTLP configuration must call `@softprobe/tracing` helpers — never derive the trace endpoint from the score API `baseUrl` or reimplement environment parsing in a plugin or harness.

## Dependency categories

```text
TOOL_CALL
MCP_CALL
FILESYSTEM
CHILD_PROCESS
HTTP_CLIENT
CLOCK
RANDOM
USER_TURN
```

Machine-checkable schemas for tapes, closure reports, environment bundles, and framework results ship with Softprobe LLM under `contracts/`.
## Minimal install sketch

Packages live in the Softprobe LLM workspace (`sp-llm`) and are **not** on the public npm registry yet. From that workspace:

```bash
cd sp-llm
pnpm install
# then import @softprobe/agent, @softprobe/gym, @softprobe/promptfoo-adapter, …
# optional: @softprobe/protocol-fabric for ambient HTTP
# credentials / OTLP: @softprobe/tracing
```

When packages are published, prefer pinned registry versions and keep Softprobe credential helpers in `@softprobe/tracing` only.
## Related guides

- [Record and replay an agent environment](/en/evaluation/guides/record-replay-agent-environment)
- [Score an episode with Promptfoo](/en/evaluation/guides/score-episode-with-promptfoo)
- [Gym episodes and training rollouts](/en/evaluation/guides/gym-and-training-rollouts)
- [Environment bundles and dependency tapes](/en/evaluation/concepts/environment-bundles)
