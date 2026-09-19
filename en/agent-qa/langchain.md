---
title: LangChain
---

# LangChain install

Install Softprobe Agent QA for [LangChain](https://www.langchain.com/) / [LangGraph](https://langchain-ai.github.io/langgraph/) with the Softprobe callback handler (Python or TypeScript). Prefer the **copy/paste prompt** from Explorer ([Quick start](/en/agent-qa/getting-started)); this page is the full reference.

Softprobe adopts **your** conversation and user ids (LangGraph `thread_id`, chat id, `user_id`, …). It does not invent Softprobe session UUIDs.

## 1. Install

**Python**

```bash
pip install 'softprobe[langchain]'
```

**TypeScript**

```bash
pnpm add @softprobe/langchain @softprobe/tracing @langchain/core
```

## 2. Credentials

Set environment variables once (or load the same keys from `.env`):

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
| `SOFTPROBE_ENVIRONMENT` | No | Label matching the Agent environment in Explorer (e.g. `Production`) |
| `SOFTPROBE_SESSION_ID` | No | Fallback only when the run has no thread/session/chat id |
| `SOFTPROBE_USER_ID` | No | Fallback only when the run has no user id |

The Connect Agent install prompt embeds your agent API key and these URLs. Do not commit credentials to source control.

## 3. Attach the handler (keep your ids)

Create a handler with **no Softprobe identity args**. Pass your existing thread/chat/user ids the way you already do for LangChain / LangGraph.

**Python**

```python
from softprobe.langchain import CallbackHandler

handler = CallbackHandler()  # credentials from SOFTPROBE_* env

result = agent.invoke(
    inputs,
    config={
        "callbacks": [handler],
        # Your existing ids — Softprobe reads these:
        "configurable": {"thread_id": chat_id, "user_id": user_id},
    },
)
handler.flush()
```

**TypeScript**

```ts
import { CallbackHandler } from "@softprobe/langchain";

const handler = new CallbackHandler(); // credentials from SOFTPROBE_* env

await agent.invoke(input, {
  callbacks: [handler],
  // Your existing ids — Softprobe reads these:
  configurable: { thread_id: chatId, user_id: userId },
});
await handler.flush();
```

Identity resolution (first match wins):

1. Run metadata / `configurable` — `thread_id`, `session_id`, `conversation_id`, `chat_id` (+ camelCase); `user_id` / `userId`
2. Optional handler constructor fallbacks
3. `SOFTPROBE_SESSION_ID` / `SOFTPROBE_USER_ID` env

Parent/child links use LangChain `runId` / `parentRunId`. Softprobe does not invent separate Softprobe `run_id` attributes from those ids.

## 4. Verify

1. Run one real agent turn that uses a **tool** so Softprobe receives generation + tool spans.
2. In Explorer, open **Agents → + Connect agent** and **Check connection**, or browse **Sessions** for the new Session (range filter defaults to the last 7 days).

Sessions are matched to the Explorer Agent via the agent API key (`SOFTPROBE_PUBLIC_KEY`). Softprobe groups Steps by **your** thread/session/chat id.

## What is traced

Softprobe maps LangChain / LangGraph callbacks to typed observations:

| Kind | Role |
|------|------|
| **Agent / chain** | Orchestration / graph roots |
| **Generation** | Model call with input/output and usage |
| **Tool** | Tool invocation with arguments and result |
| **Retriever** | Retrieval steps when present |

## Troubleshooting

| Symptom | Check |
|---------|--------|
| No Sessions appear | Env vars set in the **same process** as the agent; handler in `callbacks`; process stayed alive long enough to `flush()` |
| Auth / ingest errors | `SOFTPROBE_PUBLIC_KEY` and `SOFTPROBE_BASE_URL` match Connect Agent values; key was not rotated without updating env |
| Only generations, no tools | Run a turn that actually calls a tool |
| Split / orphaned Sessions | Reuse the **same** app thread/chat id across turns; Softprobe does not mint a new id for you |

Packages: [`softprobe`](https://pypi.org/project/softprobe/) (Python), [`@softprobe/langchain`](https://www.npmjs.com/package/@softprobe/langchain) (TypeScript).
