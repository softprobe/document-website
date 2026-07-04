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
    agentVersionError.value = '版本列表暂时不可用。'
  }
})
</script>

# Java Agent

下载最新版 Java Agent：

```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar
```

如需固定版本，将 `latest` 替换为具体版本：

```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/v4.3.9/sp-agent.jar
```

## 可用版本

`latest` 是可变别名，始终指向当前 Java Agent。以下不可变版本来自 `install.softprobe.ai`。

<ul v-if="agentVersions.length">
  <li v-for="version in agentVersions" :key="version">
    <a :href="`https://install.softprobe.ai/artifacts/agent/${version}/sp-agent.jar`">{{ version }}</a>
  </li>
</ul>
<p v-else-if="agentVersionError">{{ agentVersionError }}</p>
<p v-else>正在加载版本...</p>

命令行获取版本列表：

```bash
curl -fsSL https://install.softprobe.ai/artifacts/agent/versions.json
```

使用下载好的 Agent 启动 JVM 服务：

```bash
java -javaagent:sp-agent.jar \
     -Dsp.app.id=<您的应用ID> \
     -Dsp.api.url=<您的Softprobe API地址> \
     -jar your-application.jar
```
