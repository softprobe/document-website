::: warning CLI reference (English)
The `sp` CLI documentation is available in English. [Switch to English CLI docs](/en/cli/guide/for-agents).
:::

# Introduction

SoftProbe is a record-and-replay testing system for Java services. It attaches to an application as a `-javaagent`, observes real traffic in the background, records request and dependency data, then replays recorded cases later with automatic mocking and automatic comparison.

The SoftProbe CLI (`sp`) is the command-line interface to the SoftProbe backend (**sp-boot**). It is specified **AI-agent first**: stable JSON output, predictable exit codes, and artifact files for large diagnosis payloads.

## How SoftProbe Works

SoftProbe has four moving parts:

| Part | Role |
|------|------|
| **Instrumented application** | Your Java service, started with `-javaagent:/path/to/sp-agent.jar`. |
| **SoftProbe Java agent** | Weaves bytecode at runtime, similar operationally to an OpenTelemetry Java agent. It records HTTP, DB, cache, RPC, config, auth, dynamic class, and other dependency data without application code changes. |
| **SoftProbe backend** | Stores recorded cases, policies, replay plans, replay logs, diff results, extraction rules, app config, and agent heartbeats. |
| **`sp` CLI** | Registers apps, configures policies/rules, checks agent status, queries recorded data, starts replay plans, and diagnoses replay failures. |

The normal lifecycle is:

1. **Setup** the CLI and confirm the backend is reachable.
2. **Create an app** and get an `appId`.
3. **List the app** and confirm it is visible to the current user or agent token.
4. **Set recording policy** so the agent knows what traffic to capture.
5. **Install the Java agent** (`sp-agent.jar`) on the service host or image.
6. **Run the app with the agent in recording mode**, pinning `sp.app.id` to the registered `appId`, then send real or test traffic through the app.
7. **List recorded cases** and verify the expected requests were captured.
8. **Set replay policy**: mock policy and compare policy decide what is mocked and how differences are judged.
9. **Create a replay plan** from the recorded cases and run replay.
10. **Check replay results** with case, diff, log, trace, and mock-tree commands.

Replay is therefore not the first action in a fresh system. A replay plan requires recorded cases from an app that was actually run with the SoftProbe agent.

## Agent Startup Example

The agent is attached with a JVM `-javaagent` flag. Pin the app id explicitly in production; do not rely on inferred service names.

```bash
java \
  -javaagent:/opt/softprobe/sp-agent.jar \
  -Dsp.app.id=a1b2c3d4e5f67890 \
  -Dsp.storage.service.host=127.0.0.1:8090 \
  -Dsp.config.service.host=127.0.0.1:8090 \
  -jar order-service.jar
```

`sp.app.id` is the identity SoftProbe uses to isolate recordings, pull config, and match replay data. It is separate from `OTEL_SERVICE_NAME`, which only describes telemetry resource attributes.

## Single public surface

All documented `sp` commands call **sp-boot** over HTTP (`:8090` by default). The Java agent also talks to backend services to pull config, send heartbeats, and upload recording/replay observability data.

## Who uses `sp`?

1. **AI coding agents** — replay failure diagnosis, trace lookup by business ID, policy validation, automated re-runs
2. **CI/CD** — policy gates on pull requests, scheduled replay smoke tests
3. **Platform engineers** — same commands as agents, often without `--json`

The web UI remains available for visual inspection and manual review; the CLI covers **scriptable** and **agent** workflows focused on record-and-replay.

## Relationship to other tools

| Tool | Role |
|------|------|
| **Web UI** | Visual diff, trace inspection, and console review |
| **Java agent** | In-process instrumentation, recording, replay-time mocking, and replay observability |
| **`spcode` CLI** | Local autonomous AI engine and interactive terminal workspace. Shared SSO configuration. |
| **[Policy YAML guide](../../docs/policy-yaml-guide.md)** | Schema for `sp policy` inputs |

## Documentation map

- [For AI agents](./for-agents.md) — start here if you write skills or tools
- [spcode CLI](./spcode.md) — local autonomous AI engine and interactive terminal workspace
- [Commands](/en/cli/commands/) — platform, investigation, and administration
