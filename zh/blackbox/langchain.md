---
title: LangChain
---

# LangChain 安装

为 [LangChain](https://www.langchain.com/) 与 [LangGraph](https://langchain-ai.github.io/langgraph/) 安装 Softprobe Blackbox。接入新仓库时，建议优先使用 [快速开始](/zh/blackbox/getting-started) 中从 Explorer 复制的设置提示。

Softprobe 直接复用应用自身的会话与用户 ID（如 LangGraph `thread_id`、chat ID 与 `user_id`），不会另行生成替代 session UUID。Softprobe 采用增量接入方式，保留你现有的全部 callbacks。

## 推荐配置

### 1. 安装

**Python**

```bash
pip install 'softprobe[langchain]'
```

**TypeScript**

```bash
pnpm add @softprobe/langchain @softprobe/tracing @langchain/core
```

### 2. 凭证

```bash
export INGESTION_KEY="spk_REPLACE_WITH_INGESTION_KEY"
export OTEL_EXPORTER_OTLP_TRACES_ENDPOINT="https://explorer-staging.softprobe.ai/api/thelake/v1/traces"
export OTEL_EXPORTER_OTLP_TRACES_HEADERS="Authorization=Bearer ${INGESTION_KEY}"
export OTEL_EXPORTER_OTLP_TRACES_PROTOCOL="http/protobuf"
export OTEL_SERVICE_NAME="langchain-agent"
export OTEL_RESOURCE_ATTRIBUTES="deployment.environment.name=staging"
```

| 变量 | 必填 | 含义 |
|------|------|------|
| `INGESTION_KEY` | 是 | Explorer **Agents** 页面签发的 Ingestion Key（`spk_...`），作为标准 OTLP `Authorization` bearer 值 |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | 否 | 完整 traces URL，按原样使用；省略时 SDK 使用 production endpoint。通用 `OTEL_EXPORTER_OTLP_ENDPOINT` 会追加 `/v1/traces` |
| `OTEL_EXPORTER_OTLP_TRACES_HEADERS` | 是 | 标准 OTLP headers；`Authorization` 使用 Ingestion Key |
| `OTEL_EXPORTER_OTLP_TRACES_PROTOCOL` | 否 | 使用 `http/protobuf`；trace-specific protocol 优先于通用 OTLP protocol |
| `OTEL_SERVICE_NAME` | 否 | 当前 Agent 服务的 OpenTelemetry `service.name`，用于在 **Graph** 与 **Span Detail** 中区分多层服务 |
| `OTEL_RESOURCE_ATTRIBUTES` | 否 | OpenTelemetry resource attributes，例如 `deployment.environment.name=staging` |
| `SOFTPROBE_BASE_URL` | 否 | 仅为显式 score API 请求选择 API base；不控制 trace 导出 |
| `SOFTPROBE_LANGCHAIN` | 否 | 设为 `0` 或 `false` 可关闭自动埋点 |
| `SOFTPROBE_SESSION_ID` | 否 | 仅当本次运行没有 thread、session 或 chat ID 时的回退值 |
| `SOFTPROBE_USER_ID` | 否 | 仅当本次运行没有 user ID 时的回退值 |

### 3. 在进程启动时启用一次

设置好凭证后，包加载时 Softprobe 会自动完成 LangChain 埋点。请在 Agent 运行前导入：

**Python**

```python
import softprobe.langchain  # 设置了 SOFTPROBE_* 凭证时自动埋点
```

**TypeScript**

```ts
import "@softprobe/langchain"; // 设置了 SOFTPROBE_* 凭证时自动埋点
```

也可以显式调用 `instrument()`：

```python
from softprobe.langchain import instrument
instrument()
```

```ts
import { instrument } from "@softprobe/langchain";
instrument();
```

继续传入现有的 `configurable.thread_id` 与 `user_id`。Softprobe 会从 LangChain metadata 读取这些字段，无需改动 `callbacks`：

```python
agent.invoke(inputs, config={"configurable": {"thread_id": chat_id, "user_id": user_id}})
```

如需关闭自动埋点，设置 `SOFTPROBE_LANGCHAIN=0` 或调用 `uninstrument()`。

## 手动追加 CallbackHandler

若你按调用粒度管理 callbacks，且只想在部分调用上启用 Softprobe，可将 `CallbackHandler` 追加到现有列表末尾：

```python
from softprobe.langchain import CallbackHandler

handler = CallbackHandler()
agent.invoke(
    inputs,
    config={
        "callbacks": [*existing_callbacks, handler],
        "configurable": {"thread_id": chat_id, "user_id": user_id},
    },
)
handler.flush()
```

## 兼容现有 OpenTelemetry LangChain 埋点

Blackbox 原生接收 OpenTelemetry GenAI（`gen_ai.*`）、Arize OpenInference（`openinference-instrumentation-langchain` 与 `@arizeai/openinference-instrumentation-langchain`）以及 Traceloop OpenLLMetry（`opentelemetry-instrumentation-langchain`）生成的 span。如果服务已启用上述任一 OpenTelemetry 埋点，无需额外注册第二个 callback handler，只需将标准 OTLP HTTP 追踪导出至 `https://explorer.softprobe.ai/api/thelake/v1/traces`，携带 `Authorization=Bearer spk_...` 并设置独立的 `OTEL_SERVICE_NAME`。请在 span 上传递 `gen_ai.conversation.id` 或 `session.id`，以便将多轮对话归入同一 Session。

## 验证

1. 运行一轮会调用工具的 Agent 对话。
2. 在 Explorer 的 **Agents** 页面点击 **Check connection**，或打开 **Sessions** 查看记录。

Session 通过 Ingestion Key 关联到对应 Agent，并按应用的 thread、session 或 chat ID 归组 Steps。

## 追踪内容

| 类型 | 作用 |
|------|------|
| **Agent 与 chain** | 编排与 LangGraph 工作流根节点 |
| **Generation** | 包含消息、模型名称、结束原因与 token 计数的模型调用 |
| **Tool** | 包含参数与结果的工具调用 |
| **Retriever** | 文档检索步骤（若存在） |

Generation span 会自动采集 `ChatOpenAI`（含流式输出）、`ChatAnthropic` 与 `ChatVertexAI` 的 `input_tokens`、`output_tokens` 与 `total_tokens`。Softprobe 同时支持从 `AIMessage.usage_metadata` 与 `LLMResult.llm_output` 提取 token 用量且不会重复计数；当推理模型因包含推理 token 而使 `total_tokens` 大于 `input_tokens + output_tokens` 时，会原样保留上报的 `total_tokens`。

## 排障

| 现象 | 检查项 |
|------|--------|
| 没有 Session | 确认凭证位于同一进程，在 Agent 运行前已导入 Softprobe 或调用 `instrument()`，且 `SOFTPROBE_LANGCHAIN` 不为 `0` |
| 鉴权错误 | 确认标准 OTLP `Authorization` header 中的 Ingestion Key 与 **+ Connect agent** 中一致 |
| 只有 generation | 运行一轮至少调用一次工具的对话 |
| Session 被拆分 | 跨轮次复用同一个应用 thread 或 chat ID |

已发布软件包包括 Python 版的 [`softprobe`](https://pypi.org/project/softprobe/) 与 TypeScript 版的 [`@softprobe/langchain`](https://www.npmjs.com/package/@softprobe/langchain)。
