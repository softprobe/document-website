---
title: LangChain
---

# LangChain install

Install Softprobe Blackbox for [LangChain](https://www.langchain.com/) and [LangGraph](https://langchain-ai.github.io/langgraph/). Start with the setup prompt from Explorer in [Quick start](/en/agent-qa/getting-started) when connecting a new repository.

Softprobe adopts your application's conversation and user IDs such as LangGraph `thread_id`, chat ID, and `user_id`, without inventing replacement session UUIDs. Softprobe is additive and keeps your existing callbacks intact.

## Recommended setup

### 1. Install

**Python**

```bash
pip install 'softprobe[langchain]'
```

**TypeScript**

```bash
pnpm add @softprobe/langchain @softprobe/tracing @langchain/core
```

### 2. Credentials

```bash
export SOFTPROBE_PUBLIC_KEY="spk_REPLACE_WITH_AGENT_KEY"
export SOFTPROBE_BASE_URL="https://explorer.softprobe.ai/api/thelake"
export SOFTPROBE_OTLP_ENDPOINT="https://explorer.softprobe.ai/api/thelake/v1/traces"
export SOFTPROBE_SERVICE_NAME="langchain-agent"
export SOFTPROBE_ENVIRONMENT="Production"
```

| Variable | Required | Meaning |
|----------|----------|---------|
| `SOFTPROBE_PUBLIC_KEY` | Yes | Ingest-only Agent API key (`spk_...`) from Explorer **Agents** |
| `SOFTPROBE_BASE_URL` | Yes | `https://explorer.softprobe.ai/api/thelake` |
| `SOFTPROBE_OTLP_ENDPOINT` | No | Defaults to `{SOFTPROBE_BASE_URL}/v1/traces` |
| `SOFTPROBE_SERVICE_NAME` | No | OpenTelemetry `service.name` for this agent service so multi-tier traces stay distinct in **Graph** and **Span Detail** |
| `SOFTPROBE_ENVIRONMENT` | No | Label matching the Agent environment in Explorer |
| `SOFTPROBE_LANGCHAIN` | No | Set to `0` or `false` to disable auto-instrumentation |
| `SOFTPROBE_SESSION_ID` | No | Fallback only when the run has no thread, session, or chat ID |
| `SOFTPROBE_USER_ID` | No | Fallback only when the run has no user ID |

### 3. Enable once at process start

With credentials set, Softprobe instruments LangChain when the package loads. Import it before your agent runs:

**Python**

```python
import softprobe.langchain  # auto-instruments when SOFTPROBE_* credentials are set
```

**TypeScript**

```ts
import "@softprobe/langchain"; // auto-instruments when SOFTPROBE_* credentials are set
```

You can also call `instrument()` explicitly:

```python
from softprobe.langchain import instrument
instrument()
```

```ts
import { instrument } from "@softprobe/langchain";
instrument();
```

Keep passing your existing `configurable.thread_id` and `user_id` values. Softprobe reads them from LangChain metadata with no `callbacks` changes:

```python
agent.invoke(inputs, config={"configurable": {"thread_id": chat_id, "user_id": user_id}})
```

To disable auto-instrumentation, set `SOFTPROBE_LANGCHAIN=0` or call `uninstrument()`.

## Append a callback handler manually

If you manage callbacks per call and want Softprobe only on selected invocations, append `CallbackHandler` to your existing list:

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

## Existing OpenTelemetry LangChain instrumentations

Blackbox natively ingests OpenTelemetry GenAI (`gen_ai.*`), Arize OpenInference (`openinference-instrumentation-langchain` and `@arizeai/openinference-instrumentation-langchain`), and Traceloop OpenLLMetry (`opentelemetry-instrumentation-langchain`) spans. If your service already uses one of these OpenTelemetry instrumentations, export OTLP HTTP traces directly to `https://explorer.softprobe.ai/api/thelake/v1/traces` with `Authorization=Bearer spk_...` and a distinct `OTEL_SERVICE_NAME` instead of adding a second callback handler. Include `gen_ai.conversation.id` or `session.id` on spans so turns group into Sessions.

## Verify

1. Run one agent turn that calls a tool.
2. In Explorer, click **Check connection** under **Agents** or open **Sessions**.

Sessions match the Agent through `SOFTPROBE_PUBLIC_KEY` and group Steps by your thread, session, or chat ID.

## What is traced

| Kind | Role |
|------|------|
| **Agent and chain** | Orchestration and LangGraph workflow roots |
| **Generation** | Model calls with messages, model name, finish reasons, and token counts |
| **Tool** | Tool invocations with arguments and result |
| **Retriever** | Document retrieval steps when present |

Generation spans capture `input_tokens`, `output_tokens`, and `total_tokens` automatically across `ChatOpenAI` (including streaming runs), `ChatAnthropic`, and `ChatVertexAI`. Softprobe extracts token usage from both `AIMessage.usage_metadata` and `LLMResult.llm_output` without double-counting, and preserves reported `total_tokens` when reasoning tokens raise the total above `input_tokens + output_tokens`.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| No Sessions | Confirm credentials exist in the same process, import Softprobe or call `instrument()` before the agent runs, and verify `SOFTPROBE_LANGCHAIN` is not `0` |
| Auth errors | Confirm `SOFTPROBE_PUBLIC_KEY` and `SOFTPROBE_BASE_URL` match **+ Connect agent** |
| Only generations | Run a turn that invokes at least one tool |
| Split Sessions | Reuse the same thread or chat ID across turns |

Published packages are [`softprobe`](https://pypi.org/project/softprobe/) for Python and [`@softprobe/langchain`](https://www.npmjs.com/package/@softprobe/langchain) for TypeScript.
