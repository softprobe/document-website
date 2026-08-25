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
- **sp-backend** reachable from the agent host (default `http://127.0.0.1:8090` locally)
- Registered **`appId`** — create with `sp app create` and pin the same id on every instance

## Startup command

Attach the agent with `-javaagent` and the JVM properties below:

```bash
java \
  -javaagent:sp-agent.jar \
  -Dsp.app.id=<appId> \
  -Dsp.api.url=http://127.0.0.1:8090 \
  -jar your-service.jar
```

The agent may also resolve an app id automatically from jar name or environment; explicit `-Dsp.app.id` avoids mismatches between record and replay. Legacy docs and some configs still use **`sp.service.name`** — treat it as an alias in older deployments; prefer **`sp.app.id`** for new setups.

| Property | Points to | Purpose |
|----------|-----------|---------|
| `-Dsp.app.id` | — | Registered application id (16-char hex from `sp app create`). **Pin this** in every environment that shares recordings. |
| `-Dsp.api.url` | **sp-backend** (e.g. `:8090`) | **Required** — sp-backend base URL (must include `http://` or `https://`). Env fallback: `SP_API_URL`. Record, replay, mock, compare, **and correlated log export** (`{sp.api.url}/v1/logs`). |

When `sp.api.url` is set and the server [unified log pipeline](./installation/server.md#unified-log-pipeline) is enabled, logs are proxied to Vector internally — you do **not** need a separate Vector URL on the agent.

### Optional: direct Vector override

For advanced setups (bypassing the backend proxy), set:

```bash
-Dsp.otel.exporter.otlp.log.endpoint=http://<vector-host>:4320/v1/logs
```

This JVM property wins over `{sp.api.url}/v1/logs`.

Without `sp.api.url` (and without the override above), record and replay still work, but application logs are not exported and `sp logs` will be empty for that trace.

## Coverage deduplication

The coverage deduplication capability is included in the standard `sp-agent.jar`. You do not need to download, build, or place a separate extension JAR in an extension directory.

Coverage is effectively off unless you provide a package scope. To collect coverage for selected application packages, pass comma-separated package prefixes and optionally make the default explicit:

```bash
java \
  -javaagent:sp-agent.jar \
  -Dsp.app.id=<appId> \
  -Dsp.api.url=http://127.0.0.1:8090 \
  -Dsp.coverage.packages=com.example.orders,com.example.payments \
  -Dsp.coverage.enabled=true \
  -jar your-service.jar
```

To turn coverage off while leaving the rest of the agent enabled, set the explicit kill switch:

```bash
-Dsp.coverage.enabled=false
```

These properties are read when the JVM starts. Restart the service after changing them. An empty or missing `sp.coverage.packages` value also leaves coverage inactive.

## Environment tags

Tag recorded traffic for filtering and replay scope:

```bash
-Dsp.mocker.tags=env=staging
```

Recorded mockers carry `env=<value>` so you can replay only traffic from a given environment. Match the same tag in a policy via `selector.envTags` — see [Policy YAML guide · Common fields](/en/testing/policy-yaml-guide#common-fields).

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

Recording tasks enter an in-memory queue (default capacity **1024**).
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

## Next

Agent attached and `sp app status` shows online? Onboarding is done → head into the core workflow with **[Record traffic](/en/testing/recording)**.

Related: [Download Java agent](/en/testing/download-java-agent) · [Supported frameworks](/en/testing/supported-frameworks) · [Getting started](/en/testing/getting-started)
