---
title: Java Agent
---

# Softprobe Java Agent

Softprobe Java Agent（`sp-agent.jar`）通过 `-javaagent` 挂载到 JVM。它在字节码层织入各类框架（*部署方式*上类似 OpenTelemetry Java Agent），但目的是**测试数据采集与回放时 Mock**，而非通用分布式追踪。

::: warning 不是 Istio/Envoy Agent
网格采集见[平台 Agent 架构](/zh/platform/advanced-guides/agent-architecture)。本节仅介绍 **JVM** Agent。
:::

## 前置条件

- 可通过 JVM 参数重启的 Java 服务
- Agent 主机可访问 **sp-backend**（本地默认 `http://127.0.0.1:8090`）
- 已注册 **`appId`** — 使用 `sp app create` 创建，并在所有实例上固定同一 id

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
| `-Dsp.app.id` | — | 注册应用 id（`sp app create` 返回的 16 位十六进制）。**请在共享录制的各环境固定此值。** |
| `-Dsp.api.url` | **sp-backend**（如 `:8090`） | **必填** — sp-backend 根 URL（须含 `http://` 或 `https://`）。环境变量回退：`SP_API_URL`。录制、回放、Mock、对比，**以及关联日志导出**（`{sp.api.url}/v1/logs`）。 |

当 `sp.api.url` 已设置且服务端 [统一日志管道](./installation/server.md#unified-log-pipeline) 已启用时，日志由 sp-backend 内部代理到 Vector — Agent **无需**单独配置 Vector URL。

### 可选：直连 Vector

高级场景（绕过 backend 代理）可设置：

```bash
-Dsp.otel.exporter.otlp.log.endpoint=http://<vector-host>:4320/v1/logs
```

该 JVM 属性优先于 `{sp.api.url}/v1/logs`。

未设置 `sp.api.url`（且未设置上述覆盖）时，录制与回放仍可用，但应用日志不会导出，该 trace 的 `sp logs` 将为空。

## 基于执行路径的去重录制

Java Agent 可以根据选定应用代码实际走过的执行路径，对录制用例进行去重。这是此功能的目标。用于计算执行路径的插桩是实现细节，不会生成独立的覆盖率报告。

该能力已包含在标准的 `sp-agent.jar` 中。无需下载、构建或在扩展目录中放置单独的扩展 JAR。

### 开启基于执行路径的去重

主要功能开关是 `sp.dedup.enabled`，默认值为 `false`。因此，只有显式开启去重后，Agent 的行为才会改变。

原始 transformer 还要求配置 `sp.coverage.packages`。这个参数是必需的插桩范围白名单：它告诉 Agent 哪些应用包前缀可以被转换，以便收集执行路径。参数名中的 `coverage` 来自已有 transformer 配置；它不表示开启独立的覆盖率产品，也不会改变录制内容。多个包前缀使用英文逗号分隔：

```bash
java \
  -javaagent:sp-agent.jar \
  -Dsp.app.id=<appId> \
  -Dsp.api.url=http://127.0.0.1:8090 \
  -Dsp.dedup.enabled=true \
  -Dsp.coverage.packages=com.example.orders,com.example.payments \
  -jar your-service.jar
```

只有同时配置这两个参数，才会启用基于执行路径的去重。未设置或设置为 `false` 的 `sp.dedup.enabled` 会关闭该功能，即使已经配置了包范围；设置 `sp.dedup.enabled=true` 但未设置或设置为空的 `sp.coverage.packages` 时，也不会安装 transformer，Agent 的其他行为保持不变。

如果要在保持 Agent 其他能力运行的同时关闭基于执行路径的去重，请省略主要开关或显式设置为 `false`：

```bash
-Dsp.dedup.enabled=false
```

这些参数在 JVM 启动时读取。修改后请重启服务。

### 重复用例如何去重

基于执行路径的去重作用于最终保留的录制用例，而不是阻止 HTTP 响应返回。对于每个请求，Agent 会根据已配置包范围内执行过的方法和分支生成执行路径键。后端会在同一个应用和操作内为每条不同路径保留一个有效用例；后续执行相同路径的请求会从活动滚动用例中丢弃，执行不同路径的请求则会保留为另一个用例。

因此，两个完全相同的请求通常会得到：

- **去重启用（`sp.dedup.enabled=true` 且 `sp.coverage.packages` 非空）：** 保留一个用例和一条 Coverage 路径。
- **去重关闭或未配置：** 保留两个用例，且没有 Coverage 路径。包括未设置/设置为 `false` 的 `sp.dedup.enabled`，以及未设置/为空的 `sp.coverage.packages`。

去重键是执行路径，而不只是请求体。因此，不同输入如果走过相同路径，也可能被去重；相同输入如果命中不同分支，则会保留为不同用例。`sp-force-record` 是显式的原始捕获覆盖开关，会绕过覆盖率去重；验证去重行为时不要使用它。

Agent 也可能从 jar 名或环境自动解析 app id；显式设置 `-Dsp.app.id` 可避免录制与回放 id 不一致。旧文档中的 **`sp.service.name`** 在部分部署中仍作别名；新环境请优先使用 **`sp.app.id`**。

## 环境标签

为录制流量打标签，便于筛选与限定回放范围：

```bash
-Dsp.mocker.tags=env=staging
```

录制数据会带上 `env=<值>`，从而只回放特定环境的用例。策略里用 `selector.envTags` 匹配同一标签——见 [策略 YAML 指南 · 通用字段](/zh/testing/policy-yaml-guide#common-fields)。

## 其他部署方式

### `sp.agent.conf` 配置文件

```properties title="META-INF/sp/sp.agent.conf（打包进 agent JAR）"
sp.api.url=http://127.0.0.1:8090
```

一体化与 Helm 部署会在打包时烘焙该配置；运维通常只需 `-javaagent` 与 `-Dsp.app.id`。指向其他后端时用 `SP_API_URL` 或 `-Dsp.api.url` 覆盖。

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

`sp app status <appId>` 根据实例心跳返回 **`online`**、**`offline`** 或 **`never`**（默认约 60 秒无心跳视为 offline）。状态反映 Agent 是否在运行，而非仅是否注册了应用。

录制时，旧版界面曾用 **WORKING** / **SLEEPING** / **UNSTART** 表示实例状态；含义相同：必须注入 Agent 且开启录制才会产生用例。

## 完整用例应包含什么

健康的录制用例通常包括：

- **Servlet**（或其他入口类型）— 主 API 请求/响应
- **Database**、**Redis**、**HttpClient** 等 — 按调用顺序的依赖 mocker
- **DynamicClass**（可选）— 已配置的缓存/时间/加解密方法

有流量后列出用例：`sp record case list --app <appId> --json`。

## 生产环境保护

为降低对线上流量的影响，Agent 在过载或存储异常时会**背压**。

### 队列溢出

1. 录制任务先进入内存队列（默认容量 **1024**）。
2. 队列满则立即停止录制。
3. 约 30 秒后健康任务将采样率降低约 20% 并重试。
4. 若约 5 分钟后仍满，继续降频直至最低（约每小时一次）。
5. 队列恢复后（约 10 分钟）恢复正常录制。

### 存储健康

1. 调用 sp-storage 失败或超时时立即停止录制。
2. 约 10 秒后恢复录制并采样服务健康度。
3. 若约 3 分钟内仍不健康，按与队列溢出类似的方式逐步降频，直至存储恢复。

配合[录制策略](/zh/testing/policies)中的采样与脱敏，可将生产风险控制在可接受范围。

## 回放侧 Agent

接收回放流量的实例也必须挂载**同一** Agent JAR。专用回放机上请将录制设为关闭或极低，避免在回放过程中误录大量新流量。

## 下一步

Agent 挂上、`sp app status` 显示 online 之后，接入就完成了 → 进入核心流程 **[录制流量](/zh/testing/recording)**。

相关：[下载 Java Agent](/zh/testing/download-java-agent) · [支持的框架](/zh/testing/supported-frameworks) · [快速开始](/zh/testing/getting-started)
