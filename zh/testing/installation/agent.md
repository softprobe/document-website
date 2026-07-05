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

使用下载好的 Agent 启动 JVM 服务。请配置 Vector 日志端点，使关联的应用日志进入统一日志管道（`sp logs` / trace-id 查询）：

```bash
java -javaagent:sp-agent.jar \
     -Dsp.app.id=<您的应用ID> \
     -Dsp.api.url=<您的Softprobe API地址> \
     -Dsp.otel.exporter.otlp.log.endpoint=<Vector OTLP 日志 URL> \
     -jar your-application.jar
```

| 属性 | 指向 | 用途 |
|------|------|------|
| `sp.app.id` | — | Softprobe 中的应用 ID |
| `sp.api.url` | **sp-backend**（如 `:8090`） | 录制、回放、Mock、对比 |
| `sp.otel.exporter.otlp.log.endpoint` | **Vector** 日志采集（如 `:4320/v1/logs`） | 关联日志，便于诊断 |

在 Kubernetes 上使用 [Softprobe 服务端 Helm Chart](./server.md) 时，使用集群内 Vector URL：

```text
-Dsp.otel.exporter.otlp.log.endpoint=http://<release>-log-vector.<namespace>.svc.cluster.local:4320/v1/logs
```

release 为 `softprobe`、命名空间为 `softprobe` 的示例：

```text
-Dsp.otel.exporter.otlp.log.endpoint=http://softprobe-log-vector.softprobe.svc.cluster.local:4320/v1/logs
```

未设置 `sp.otel.exporter.otlp.log.endpoint` 时，录制与回放仍可用，但应用日志不会导出，该 trace 的 `sp logs` 将为空。详见 [安装 Softprobe 服务端 — Agent OTLP 导出](./server.md#agent-otlp-export)。
