---
title: Java agent
---

# Softprobe Java agent

The Softprobe Java agent (`sp-agent.jar`) attaches to your JVM with `-javaagent`. It instruments frameworks at bytecode level (similar in *deployment* to an OpenTelemetry Java agent) but its purpose is **test data capture and replay-time mocking**, not generic distributed tracing.

::: warning Not the Istio/Envoy agent
Mesh capture is documented under [Platform agent architecture](/en/platform/advanced-guides/agent-architecture). This page covers the **JVM** agent only.
:::

## Prerequisites

- Java service you can restart with JVM flags
- **sp-boot** reachable from the agent host (default `http://127.0.0.1:8090` locally)
- Registered **`appId`** — create with `sp app create` and pin the same id on every instance

## Download and startup command

```bash
sp agent download --json
sp agent command --app <appId> --json
```

The `agent command` output is the canonical `-javaagent` line for your environment. Typical local shape:

```bash
java \
  -javaagent:${XDG_DATA_HOME:-~/.local/share}/softprobe/agent/sp-agent.jar \
  -Dsp.app.id=<appId> \
  -Dsp.api.url=http://127.0.0.1:8090 \
  -jar your-service.jar
```

On SaaS, `sp agent command` also emits `-Dsp.api.token=…` (tenant API key).

The agent may also resolve an app id automatically from jar name or environment; explicit `-Dsp.app.id` avoids mismatches between record and replay. Legacy docs and some configs still use **`sp.service.name`** — treat it as an alias in older deployments; prefer **`sp.app.id`** for new setups.

Authentication on **Softprobe Cloud** uses a **tenant API key** (not your user JWT). Create one with:

```bash
sp tenant key ensure --json
```

`sp agent command` auto-provisions the key on SaaS when missing and adds `-Dsp.api.token=<tenant_api_key>` to JVM flags. The Java agent sends this as the `sp-api-token` header; the gateway routes to your tenant.

For CI and production hosts, set `SP_TENANT_API_KEY` from your secret store instead of saving to sp.jsonc:

```bash
export SP_TENANT_API_KEY="…"
sp agent command --app <appId> --json
```

Self-hosted backends (`http://127.0.0.1:8090`) do not require `-Dsp.api.token` unless your deployment enforces it.

| Property | Purpose |
|----------|---------|
| `-Dsp.api.token` | Tenant API key (SaaS) — agent authentication |
| `-Dsp.app.id` | Registered application id (16-char hex from `sp app create`). **Pin this** in every environment that shares recordings. |
| `-Dsp.api.url` | **Required** — sp-boot base URL (must include `http://` or `https://`). Env fallback: `SP_API_URL`. |

## Environment tags

Tag recorded traffic for filtering and replay scope:

```bash
-Dsp.tags.env=staging
```

Recorded mockers carry `env:<value>` so you can replay only traffic from a given environment.

## Alternative deployment patterns

### `sp.agent.conf` file

```properties title="META-INF/sp/sp.agent.conf (baked into agent JAR)"
sp.api.url=http://127.0.0.1:8090
```

All-in-one and Helm installs bake this at packaging time so operators only need `-javaagent:sp-agent.jar` and `-Dsp.app.id`. Override with `SP_API_URL` or `-Dsp.api.url` when redirecting to another backend.

### Tomcat / `JAVA_OPTS`

Set agent flags in `catalina.sh` or `JAVA_TOOL_OPTIONS` so every worker JVM loads the agent on startup.

### Coexistence with OpenTelemetry

If another `-javaagent` conflicts (for example OpenTelemetry), add ignore prefixes:

```bash
-Dsp.ignore.type.prefixes=io.opentelemetry
-Dsp.ignore.classloader.prefixes=io.opentelemetry
```

Comma-separate multiple prefixes.

### Debug logging

```bash
-Dsp.enable.debug=true
```

## Agent status

`sp app status <appId>` reports **`online`**, **`offline`**, or **`never`** from instance heartbeats (default offline threshold ~60 seconds). Status reflects running agents, not merely app registration.

During recording, legacy UIs showed **WORKING** / **SLEEPING** / **UNSTART** per instance; the same idea applies: the agent must be injected and recording enabled to produce cases.

## What a complete case looks like

A healthy recorded case typically includes:

- **Servlet** (or other entry type) — main API request/response
- **Database**, **Redis**, **HttpClient**, … — dependency mockers in call order
- **DynamicClass** — optional, for configured cache/time/encryption methods

List cases after traffic: `sp record case list --app <appId> --json`.

## Production safety

To limit impact on live traffic, the agent implements **backpressure** when overloaded or when storage is unhealthy.

### Queue overflow

1. Recording tasks enter an in-memory queue (default capacity **1024**).
2. If the queue is full, recording stops immediately.
3. After ~30s, a health task lowers sampling (~20%) and retries.
4. If still full after ~5 minutes, frequency drops again until a minimum (~once per hour).
5. When the queue recovers (~10 minutes later), normal recording resumes.

### Storage health

1. If sp-storage calls fail or time out, recording stops immediately.
2. After ~10s, recording resumes while health is sampled.
3. If metrics stay unhealthy for ~3 minutes, frequency is reduced in steps like queue overflow until storage recovers.

Combined with [recording policy](/en/testing/policies) sampling and desensitization, this keeps production risk bounded.

## Replay-side agent

The **same** agent JAR must be attached on the instance that receives replay traffic. Set recording to minimal or zero on dedicated replay hosts so you only mock, not capture new production-like volume unintentionally.

## Related

- [Getting started](/en/testing/getting-started)
- [CLI: agent command](/en/cli/commands/agent)
- [Supported frameworks](/en/testing/supported-frameworks)
- [Configuration (JVM)](/en/cli/guide/configuration)
