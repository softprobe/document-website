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
- Agent 主机可访问 **sp-boot**（本地默认 `http://127.0.0.1:8090`）
- 已注册 **`appId`** — 使用 `sp app create` 创建，并在所有实例上固定同一 id

## 下载与启动命令

```bash
sp agent download --json
sp agent command --app <appId> --json
```

`agent command` 的输出是当前环境的标准 `-javaagent` 启动行。本地典型形式：

```bash
java \
  -javaagent:${XDG_DATA_HOME:-~/.local/share}/softprobe/agent/sp-agent.jar \
  -Dsp.app.id=<appId> \
  -Dsp.api.url=http://127.0.0.1:8090 \
  -jar your-service.jar
```

| 参数 | 含义 |
|------|------|
| `-Dsp.app.id` | 注册应用 id（`sp app create` 返回的 16 位十六进制）。**请在共享录制的各环境固定此值。** |
| `-Dsp.api.url` | **必填** — sp-boot 根 URL（须含 `http://` 或 `https://`）。环境变量回退：`SP_API_URL`。 |

Agent 也可能从 jar 名或环境自动解析 app id；显式设置 `-Dsp.app.id` 可避免录制与回放 id 不一致。旧文档中的 **`sp.service.name`** 在部分部署中仍作别名；新环境请优先使用 **`sp.app.id`**。

认证使用租户令牌（`SP_TOKEN` / `sp auth login` 配置）；勿将长期令牌写入 shell 历史。Agent 在适用时会与 CLI 共用同一配置层。

## 环境标签

为录制流量打标签，便于筛选与限定回放范围：

```bash
-Dsp.tags.env=staging
```

录制数据会带上 `env:<值>`，从而只回放特定环境的用例。

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

## 相关文档

- [快速开始](/zh/testing/getting-started)
- [CLI：agent 命令](/zh/cli/commands/agent)
- [支持的框架](/zh/testing/supported-frameworks)
- [配置（JVM）](/zh/cli/guide/configuration)
