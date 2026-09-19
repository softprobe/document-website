---
title: LangChain
---

# LangChain install

Install Softprobe Agent QA for [LangChain](https://www.langchain.com/) / [LangGraph](https://langchain-ai.github.io/langgraph/). Prefer the **copy/paste prompt** from Explorer ([Quick start](/en/agent-qa/getting-started)).

Softprobe adopts **your** conversation and user ids (LangGraph `thread_id`, chat id, `user_id`, …). It does not invent Softprobe session UUIDs. Softprobe is **additive** — it never replaces your existing callbacks.

## Best path (zero invoke changes)

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
export SOFTPROBE_PUBLIC_KEY="spk_…"
export SOFTPROBE_BASE_URL="https://explorer.softprobe.ai/api/thelake"
export SOFTPROBE_OTLP_ENDPOINT="https://explorer.softprobe.ai/api/thelake/v1/traces"
export SOFTPROBE_ENVIRONMENT="Production"
```

| Variable | Required | Meaning |
|----------|----------|---------|
| `SOFTPROBE_PUBLIC_KEY` | Yes | Agent API key (`spk_…`) from Explorer **Agents → + Connect agent** |
| `SOFTPROBE_BASE_URL` | Yes | `https://explorer.softprobe.ai/api/thelake` |
| `SOFTPROBE_OTLP_ENDPOINT` | No | Defaults to `{SOFTPROBE_BASE_URL}/v1/traces` |
| `SOFTPROBE_ENVIRONMENT` | No | Label matching the Agent environment in Explorer |
| `SOFTPROBE_LANGCHAIN` | No | Set to `0` / `false` to disable auto-instrumentation |
| `SOFTPROBE_SESSION_ID` | No | Fallback only when the run has no thread/session/chat id |
| `SOFTPROBE_USER_ID` | No | Fallback only when the run has no user id |

### 3. Enable once at process start

With credentials set, Softprobe auto-instruments when the package loads. Import it **before** your agent runs:

**Python**

```python
import softprobe.langchain  # auto-instruments when SOFTPROBE_* credentials are set
```

**TypeScript**

```ts
import "@softprobe/langchain"; // auto-instruments when SOFTPROBE_* credentials are set
```

Or call explicitly (same effect, clearer in code review):

```python
from softprobe.langchain import instrument
instrument()
```

```ts
import { instrument } from "@softprobe/langchain";
instrument();
```

Keep using your existing `configurable.thread_id` / `user_id` (or chat id). Softprobe reads them from LangChain metadata — **no `callbacks` edits**.

```python
agent.invoke(inputs, config={"configurable": {"thread_id": chat_id, "user_id": user_id}})
```

Disable auto: `export SOFTPROBE_LANGCHAIN=0`, or `uninstrument()`.

## Escape hatch: append a handler

If you already manage callbacks and want Softprobe only on some invokes:

```python
from softprobe.langchain import CallbackHandler

handler = CallbackHandler()
agent.invoke(
    inputs,
    config={
        "callbacks": [*existing_callbacks, handler],  # append — do not replace
        "configurable": {"thread_id": chat_id, "user_id": user_id},
    },
)
handler.flush()
```

## Verify

1. Run one real agent turn that uses a **tool**.
2. In Explorer, **Agents → + Connect agent → Check connection**, or browse **Sessions**.

Sessions match the Agent via `SOFTPROBE_PUBLIC_KEY`. Softprobe groups Steps by **your** thread/session/chat id.

## What is traced

| Kind | Role |
|------|------|
| **Agent / chain** | Orchestration / graph roots |
| **Generation** | Model call with input/output and usage |
| **Tool** | Tool invocation with arguments and result |
| **Retriever** | Retrieval steps when present |

## Troubleshooting

| Symptom | Check |
|---------|--------|
| No Sessions | Credentials in the same process; Softprobe imported / `instrument()` called **before** the agent runs; `SOFTPROBE_LANGCHAIN` not `0` |
| Auth errors | Key and base URL match Connect Agent |
| Only generations | Run a turn that calls a tool |
| Split Sessions | Reuse the same app thread/chat id across turns |

Packages: [`softprobe`](https://pypi.org/project/softprobe/) (Python), [`@softprobe/langchain`](https://www.npmjs.com/package/@softprobe/langchain) (TypeScript).
