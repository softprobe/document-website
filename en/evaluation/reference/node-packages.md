---
title: Node packages (agent environments)
---

# Node packages (agent environments)

Softprobe ships Node packages for recording, replaying, scoring, and training against executable agent environments. Install from the Softprobe LLM workspace (`sp-llm`) or your registry mirror.

## Package map

| Package | Use it for |
|---------|------------|
| `@softprobe/tracing` | Softprobe credentials, OTLP endpoint derivation, session telemetry, scores |
| `@softprobe/agent` | Episode context, dependency tape, skip/inject wraps, FS overlay, closure reports |
| `@softprobe/protocol-fabric` | Capture/replay ambient Node `fetch` / undici HTTP (complements semantic wraps) |
| `@softprobe/promptfoo-adapter` | Invoke Promptfoo natively → `softprobe.framework-result/v1` |
| `@softprobe/gym` | Episode reset/step/fork API + training session façade |
| `@softprobe/simulator-synth` | Research: synthesize filesystem transition programs from observed before/after state |
| `@softprobe/opencode-plugin` | OpenCode **observation** telemetry (not the replay owner) |

## Ownership rule (important)

| Softprobe product knowledge | Host / adapter concern |
|-----------------------------|-------------------------|
| `SOFTPROBE_*` env names and parsing | Host config file paths |
| Validate `publicKey` / `baseUrl` | Discovery order (env then file) |
| Derive `otlpEndpoint` as `{baseUrl}/v1/traces` | Soft-disable when credentials missing |
| Meaning of `environment` / `userId` / `serviceName` | Host defaults (`serviceName: "opencode"`, …) |

Any code that mentions `SOFTPROBE_*` or derives `{baseUrl}/v1/traces` must call `@softprobe/tracing` helpers — never reimplement that logic in a plugin or harness.

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
