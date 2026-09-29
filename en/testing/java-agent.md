---
title: Java agent
---

<script setup>
import { onMounted, ref } from 'vue'

const agentVersions = ref([])
const agentVersionError = ref('')

onMounted(async () => {
  try {
    const response = await fetch('https://install.softprobe.ai/artifacts/agent/versions.json')
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const body = await response.json()
    agentVersions.value = Array.isArray(body.versions) ? body.versions : []
  } catch {
    agentVersionError.value = 'Version list is temporarily unavailable.'
  }
})
</script>

# Softprobe Java agent

The Softprobe Java agent (`sp-agent.jar`) attaches to your JVM with `-javaagent`. It instruments frameworks at bytecode level (similar in *deployment* to an OpenTelemetry Java agent) but its purpose is **test data capture and replay-time mocking**, not generic distributed tracing.

::: warning Not the Istio/Envoy agent
Mesh capture is documented under [Platform agent architecture](/en/platform/advanced-guides/agent-architecture). This page covers the **JVM** agent only.
:::

## Prerequisites

- Java service you can restart with JVM flags
- **sp-backend** reachable from the agent host (default `http://127.0.0.1:8090` locally)
- Registered **`appId`** — create with `sp app create` and pin the same id on every instance

## Download the agent {#download}

With internet access, download the latest agent:

```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar
```

`latest` always points at the newest release. For anything you deliver or run in production, pin a version by replacing `latest`:

```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/v4.3.9/sp-agent.jar
```

On a machine without internet access, use the agent JAR delivered with your installation package, or ask your SoftProbe implementation team.

Available versions:

<ul v-if="agentVersions.length">
  <li v-for="version in agentVersions" :key="version">
    <a :href="`https://install.softprobe.ai/artifacts/agent/${version}/sp-agent.jar`">{{ version }}</a>
  </li>
</ul>
<p v-else-if="agentVersionError">{{ agentVersionError }}</p>
<p v-else>Loading versions...</p>

The same list for scripts:

```bash
curl -fsSL https://install.softprobe.ai/artifacts/agent/versions.json
```

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
| `-Dsp.app.id` | — | Application ID: the one `sp app create` returns, or any stable non-empty name such as `order-service` (an unknown ID is registered automatically when the agent first loads its config). **Pin this** in every environment that shares recordings. |
| `-Dsp.api.url` | **sp-backend** (e.g. `:8090`) | **Required** — sp-backend base URL (must include `http://` or `https://`). Looked up in this order: `-Dsp.api.url`, the `SP_API_URL` environment variable, then `sp.api.url` baked into the agent jar. Used for record, replay, mock, compare **and correlated log export** (`{sp.api.url}/v1/logs`). |

When `sp.api.url` is set and the server [unified log pipeline](./installation/server.md#unified-log-pipeline) is enabled, logs are proxied to Vector internally — you do **not** need a separate Vector URL on the agent.

### Optional: direct Vector override

For advanced setups (bypassing the backend proxy), set:

```bash
-Dsp.otel.exporter.otlp.log.endpoint=http://<vector-host>:4320/v1/logs
```

This JVM property wins over `{sp.api.url}/v1/logs`.

If no backend URL can be found in any of those places, the agent reports that it failed to start and does nothing: no recording, no replay, no log export. The log endpoint override above does not replace the backend URL.

## Execution-path deduplication

The Java agent can deduplicate recorded cases by the execution path taken through selected application code. This is the goal of this feature. The instrumentation used to calculate that path is an implementation detail; it does not produce a separate coverage report.

The capability is included in the standard `sp-agent.jar`. You do not need to download, build, or place a separate extension JAR in an extension directory.

### Enable execution-path deduplication

The primary feature switch is `sp.dedup.enabled`. It defaults to `false`, so existing Agent behavior is unchanged unless you explicitly enable deduplication.

The original transformer also requires `sp.coverage.packages`. This property is a required instrumentation allowlist: it tells the Agent which application package prefixes may be transformed to collect execution paths. The `coverage` name is retained because it is part of the existing transformer configuration; it does not enable a coverage-reporting product or change what is recorded. Use comma-separated package prefixes:

```bash
java \
  -javaagent:sp-agent.jar \
  -Dsp.app.id=<appId> \
  -Dsp.api.url=http://127.0.0.1:8090 \
  -Dsp.dedup.enabled=true \
  -Dsp.coverage.packages=com.example.orders,com.example.payments \
  -jar your-service.jar
```

Both properties are required to activate execution-path deduplication. If `sp.dedup.enabled` is missing or `false`, the feature is off even when packages are configured. If `sp.dedup.enabled=true` but `sp.coverage.packages` is missing or empty, the transformer is not installed and normal Agent behavior continues.

To turn execution-path deduplication off while leaving the rest of the Agent enabled, omit the primary switch or set it explicitly to `false`:

```bash
-Dsp.dedup.enabled=false
```

These properties are read when the JVM starts. Restart the service after changing them.

### How duplicate cases are handled

Execution-path deduplication operates on retained recording cases, not on the HTTP response sent to the caller. For each request, the agent builds an execution-path key from the instrumented methods and branches in the configured packages. The backend keeps one active case for each distinct path within an application and operation. A later request with the same path is discarded from the active rolling cases; a request that follows a different path is retained as another case.

This means two identical requests normally produce:

- **Deduplication enabled (`sp.dedup.enabled=true` plus non-empty `sp.coverage.packages`):** one retained case and one Coverage path.
- **Deduplication disabled or unconfigured:** two retained cases and no Coverage path. This includes a missing/false `sp.dedup.enabled` or a missing/empty `sp.coverage.packages`.

The key is the execution path, not the request body alone. Therefore different inputs that follow the same path can also be deduplicated, while identical inputs that take different branches remain separate. `sp-force-record` is an explicit raw-capture override and bypasses coverage deduplication; do not use it when validating deduplication behavior.

## Environment tags

Tag recorded traffic for filtering and replay scope:

```bash
-Dsp.tags.env=staging
```

Each `-Dsp.tags.<key>=<value>` adds one tag; for several tags, repeat it (`-Dsp.tags.region=east`). Don't set `sp.mocker.tags` yourself — the agent builds it from the `sp.tags.*` properties and overwrites it.

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

Related: [Supported frameworks](/en/testing/supported-frameworks) · [Getting started](/en/testing/getting-started)
