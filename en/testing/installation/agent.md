---
title: Java Agent
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

# Java Agent

Download the latest Java agent:

```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar
```

Pin a specific release by replacing `latest` with a version:

```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/v4.3.9/sp-agent.jar
```

## Available Versions

The mutable `latest` alias always points at the current Java agent. Immutable releases are listed below from `install.softprobe.ai`.

<ul v-if="agentVersions.length">
  <li v-for="version in agentVersions" :key="version">
    <a :href="`https://install.softprobe.ai/artifacts/agent/${version}/sp-agent.jar`">{{ version }}</a>
  </li>
</ul>
<p v-else-if="agentVersionError">{{ agentVersionError }}</p>
<p v-else>Loading versions...</p>

Scriptable version list:

```bash
curl -fsSL https://install.softprobe.ai/artifacts/agent/versions.json
```

Start your JVM service with the downloaded agent. Include the Vector log endpoint so correlated application logs reach the unified log pipeline (`sp logs` / trace-id lookup):

```bash
java -javaagent:sp-agent.jar \
     -Dsp.app.id=<your-app-id> \
     -Dsp.api.url=<your-softprobe-api-url> \
     -Dsp.otel.exporter.otlp.log.endpoint=<vector-otlp-log-url> \
     -jar your-application.jar
```

| Property | Points to | Purpose |
|----------|-----------|---------|
| `sp.app.id` | — | Application id in Softprobe |
| `sp.api.url` | **sp-backend** (e.g. `:8090`) | Record, replay, mock, compare |
| `sp.otel.exporter.otlp.log.endpoint` | **Vector** log ingest (e.g. `:4320/v1/logs`) | Correlated logs for diagnosis |

On Kubernetes with the [Softprobe server Helm chart](./server.md), use the in-cluster Vector URL:

```text
-Dsp.otel.exporter.otlp.log.endpoint=http://<release>-log-vector.<namespace>.svc.cluster.local:4320/v1/logs
```

Example for release `softprobe` in namespace `softprobe`:

```text
-Dsp.otel.exporter.otlp.log.endpoint=http://softprobe-log-vector.softprobe.svc.cluster.local:4320/v1/logs
```

Without `sp.otel.exporter.otlp.log.endpoint`, record and replay still work, but application logs are not exported and `sp logs` will be empty for that trace. See [Install Softprobe Server — Agent OTLP export](./server.md#agent-otlp-export).
