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

# SoftProbe Java Agent

SoftProbe Java Agent（`sp-agent.jar`）通过 `-javaagent` 挂载到 JVM。它在字节码层织入各类框架（*部署方式*上类似 OpenTelemetry Java Agent），但目的是**测试数据采集与回放时 Mock**，而非通用分布式追踪。

::: warning 不是 Istio/Envoy Agent
网格采集见 [平台 Agent 架构](/zh/platform/advanced-guides/agent-architecture)。本节仅介绍 **JVM** Agent。
:::

## 前置条件

- 可通过 JVM 参数重启的 Java 服务
- Agent 主机可访问 **sp-backend**（本地默认 `http://127.0.0.1:8090`）
- 一个 **`appId`**：用 `sp app create`（或控制台的「应用管理」）创建，或者取一个固定的名字，由 Agent 首次启动时自动注册；所有实例用同一个 ID

## 下载 Agent {#download}

能访问互联网时，下载最新版：

```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/latest/sp-agent.jar
```

`latest` 始终指向最新版本。交付给客户或在生产使用时，请把 `latest` 换成具体版本号，固定版本：

```bash
curl -fsSL -o sp-agent.jar https://install.softprobe.ai/artifacts/agent/v4.3.9/sp-agent.jar
```

无法访问互联网的机器，使用安装包中附带的 Agent JAR，或向 SoftProbe 实施人员索取。

可用版本：

<ul v-if="agentVersions.length">
  <li v-for="version in agentVersions" :key="version">
    <a :href="`https://install.softprobe.ai/artifacts/agent/${version}/sp-agent.jar`">{{ version }}</a>
  </li>
</ul>
<p v-else-if="agentVersionError">{{ agentVersionError }}</p>
<p v-else>正在加载版本列表……</p>

脚本中获取同一列表：

```bash
curl -fsSL https://install.softprobe.ai/artifacts/agent/versions.json
```

## 启动命令

使用 `-javaagent` 及下列 JVM 参数挂载 Agent：

```bash
java \
  -javaagent:sp-agent.jar \
  -Dsp.app.id=<appId> \
  -Dsp.api.url=http://127.0.0.1:8090 \
  -jar your-service.jar
```

| 参数 | 指向 | 含义 |
|------|------|------|
| `-Dsp.app.id` | — | 应用 ID：可以用 `sp app create` 返回的 ID，也可以用 `order-service` 这类固定、非空的名字（后端没见过的 ID 通常会在 Agent 第一次拉取配置时自动注册，见 [概念与编号 — 应用](/zh/testing/agents/concepts#application-appid)）。**请在共享录制的各环境固定此值。** |
| `-Dsp.api.url` | **sp-backend**（如 `:8090`） | **必填** — sp-backend 根地址（须含 `http://` 或 `https://`）。按以下顺序查找：`-Dsp.api.url`、环境变量 `SP_API_URL`、Agent jar 内置的 `sp.api.url`。录制、回放、Mock、对比，**以及关联日志导出**（`{sp.api.url}/v1/logs`）都用它。 |

当 `sp.api.url` 已设置且服务端 [统一日志管道](./installation/server.md#unified-log-pipeline) 已启用时，日志由 sp-backend 内部代理到 Vector — Agent **无需**单独配置 Vector URL。

### 可选：直连 Vector

高级场景（绕过 backend 代理）可设置：

```bash
-Dsp.otel.exporter.otlp.log.endpoint=http://<vector-host>:4320/v1/logs
```

该 JVM 属性优先于 `{sp.api.url}/v1/logs`。

以上几处都找不到后端地址时，Agent 会报告启动失败，什么都不做：不录制、不回放、也不导出日志。上面的日志地址覆盖不能代替后端地址。4.3.36 之后发布的 Agent 在没有设置 `-Dsp.api.url` 和 `SP_API_URL` 时，还会把旧的启动参数 `-Dsp.api.service.host` 转换成 `sp.api.url`；4.3.36 及更早的版本不会，请用 `sp.api.url`。

## 基于执行路径的去重录制

Java Agent 可以按应用代码实际走过的执行路径给录制用例去重；计算执行路径所用的插桩只是实现细节，不会生成独立的覆盖率报告。

该能力已包含在标准的 `sp-agent.jar` 中。无需下载、构建或在扩展目录中放置单独的扩展 JAR。

### 开启基于执行路径的去重

主要功能开关是 `sp.dedup.enabled`，默认值为 `false`。因此，只有显式开启去重后，Agent 的行为才会改变。

去重功能复用的 transformer 还要求配置 `sp.coverage.packages`。这个参数是必需的插桩范围白名单：它告诉 Agent 对哪些应用包前缀插桩，以收集执行路径。参数名中的 `coverage` 来自已有 transformer 配置；它不表示开启独立的覆盖率产品，也不会改变录制内容。多个包前缀使用英文逗号分隔：

```bash
java \
  -javaagent:sp-agent.jar \
  -Dsp.app.id=<appId> \
  -Dsp.api.url=http://127.0.0.1:8090 \
  -Dsp.dedup.enabled=true \
  -Dsp.coverage.packages=com.example.orders,com.example.payments \
  -jar your-service.jar
```

两个参数同时配置才会开启去重。`sp.dedup.enabled` 未设置或设为 `false` 时，即使配置了包范围也不去重；只设 `sp.dedup.enabled=true` 而不设 `sp.coverage.packages`（或设为空）时，不会安装 transformer，Agent 其他行为不变。

如果要在保持 Agent 其他能力运行的同时关闭基于执行路径的去重，请省略主要开关或显式设置为 `false`：

```bash
-Dsp.dedup.enabled=false
```

这些参数在 JVM 启动时读取。修改后请重启服务。

### 重复用例如何去重

基于执行路径的去重作用于最终保留的录制用例，而不是阻止 HTTP 响应返回。每个请求都会按已配置包范围内执行过的方法和分支生成一个执行路径键。后端在同一应用、同一接口下为每条不同路径保留一条用例：之后走相同路径的请求会被丢弃，走不同路径的则保留为另一条用例。

因此，两个完全相同的请求通常会得到：

- **去重启用（`sp.dedup.enabled=true` 且 `sp.coverage.packages` 非空）：** 保留一个用例和一条 Coverage 路径。
- **去重关闭或未配置：** 保留两个用例，且没有 Coverage 路径。包括 `sp.dedup.enabled` 未设置或设为 `false`、`sp.coverage.packages` 未设置或为空的情况。

去重键是执行路径，而不只是请求体。因此，不同输入如果走过相同路径，也可能被去重；相同输入如果命中不同分支，则会保留为不同用例。`sp-force-record` 是强制按原始请求录制的开关，会绕过去重；验证去重行为时不要用它。

Agent 也可能从 jar 名或环境自动解析 appId；显式设置 `-Dsp.app.id` 可避免录制与回放的 appId 不一致。旧文档中的 **`sp.service.name`** 在部分部署中仍作别名；新环境请优先使用 **`sp.app.id`**。

## 环境标签

为录制流量打标签，便于筛选与限定回放范围：

```bash
-Dsp.tags.env=staging
```

每个 `-Dsp.tags.<键>=<值>` 加一个标签，多个标签就写多个（如再加 `-Dsp.tags.region=east`）。不要自己设置 `sp.mocker.tags`：Agent 会根据 `sp.tags.*` 生成它，并覆盖你设的值。

录制数据会带上 `env=<值>`，从而只回放特定环境的用例。策略里用 `selector.envTags` 匹配同一标签——见 [策略 YAML 指南 · 通用字段](/zh/testing/policy-yaml-guide#common-fields)。

## 其他部署方式

### `sp.agent.conf` 配置文件

```properties title="META-INF/sp/sp.agent.conf（打包进 agent JAR）"
sp.api.url=http://127.0.0.1:8090
```

一体化与 Helm 部署会在打包时写入该配置；运维通常只需 `-javaagent` 与 `-Dsp.app.id`。指向其他后端时用 `SP_API_URL` 或 `-Dsp.api.url` 覆盖。

### Tomcat / `JAVA_OPTS`

在 `catalina.sh` 或 `JAVA_TOOL_OPTIONS` 中设置 Agent 参数，使每个工作 JVM 启动时自动加载。

### 与 OpenTelemetry 共存

若与其他 `-javaagent`（如 OpenTelemetry）冲突，可添加忽略前缀：

```bash
-Dsp.ignore.type.prefixes=io.opentelemetry
-Dsp.ignore.classloader.prefixes=io.opentelemetry
```

多个前缀用英文逗号分隔。

### 调试日志

```bash
-Dsp.enable.debug=true
```

## Agent 状态

`sp app status <appId>` 根据实例心跳返回 **`online`**、**`degraded`**、**`offline`** 或 **`never`**（默认阈值 60 秒，含义见 [概念与编号 — 应用](/zh/testing/agents/concepts#application-appid)）。状态反映 Agent 是否在运行，而非仅是否注册了应用。

录制时，旧版界面曾用 **WORKING** / **SLEEPING** / **UNSTART** 表示实例状态；含义相同：必须注入 Agent 且开启录制才会产生用例。

## 完整用例应包含什么

健康的录制用例通常包括：

- **Servlet**（或其他入口类型）— 主 API 请求/响应
- **Database**、**Redis**、**HttpClient** 等 — 按调用顺序的依赖 mocker
- **DynamicClass**（可选）— 已配置的缓存/时间/加解密方法

有流量后列出用例：`sp record case list --app <appId> --json`。

## 生产环境保护

为降低对线上流量的影响，Agent 在过载或存储异常时会**背压**。

### 录制队列满时 {#queue-overflow}

1. 录制数据先进入一个有上限的内存环形缓冲区：默认 2048 个槽位，最多放 2047 批数据（一批是交给上报线程的一组录制调用）。可以用 `-Dsp.buffer.size` 调大；设得比 2048 小时仍按 2048 分配。
2. 缓冲区满时，新的一批直接丢弃，对应的用例标记为无效，Agent 进入快速拒绝状态：新录制一律丢弃，只保留约每秒一次的探测。
3. 30 秒后降低采样速率，5 分钟后再检查一次，之后每 10 分钟检查一次。每次检查仍有积压就再降一次：每个接口降到当前速率的 80%，最低每分钟 0.03 次（约 33 分钟一次）。
4. 积压消除后，恢复正常录制。

Agent 不会等待队列腾出空间：队列满只会少录，不会拖慢请求。

### 后端出问题时 {#storage-health}

1. 上报录制数据连续失败 10 次，或 10 秒内至少 30 次上报中失败超过 80%，Agent 进入快速拒绝状态。
2. 5 秒后降低采样速率，3 分钟后检查一次，之后每 10 分钟检查一次，每次仍未恢复就再降一次，直到后端恢复。
3. Agent 从后端拉不到配置时，停止录制，直到配置重新拉取成功。

所在机器 CPU 或内存占用过高时，Agent 同样会进入快速拒绝状态并降低速率，直到占用回落。

配合 [录制策略](/zh/testing/policies) 中的采样设置，可以把对生产的影响控制在可接受范围。

## 回放侧 Agent

接收回放流量的实例也必须挂载**同一** Agent JAR。专用回放机上请将录制设为关闭或极低，避免在回放过程中误录大量新流量。

## 下一步

Agent 挂上、`sp app status` 显示 online 之后，接入就完成了 → 进入核心流程 **[录制流量](/zh/testing/recording)**。

相关文档：[支持的框架](/zh/testing/supported-frameworks) · [快速开始](/zh/testing/getting-started)
