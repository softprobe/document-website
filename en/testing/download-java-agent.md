---
title: Download Java agent
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

# Download Java agent

Download the latest Java agent:

```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar
```

Pin a specific release by replacing `latest` with a version:

```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/v4.3.9/sp-agent.jar
```

## Available versions

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

## Next

Attach the agent and configure JVM flags: [Attach and configure](/en/testing/java-agent).
