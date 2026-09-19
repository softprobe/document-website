---
title: LangChain
---

# LangChain install

Install Softprobe Agent QA for [LangChain](https://www.langchain.com/) / [LangGraph](https://langchain-ai.github.io/langgraph/) with the Softprobe callback handler (Python or TypeScript). Prefer the **copy/paste prompt** from Explorer ([Quick start](/en/agent-qa/getting-started)); this page is the full reference. That prompt tells Cursor, Codex, or Claude Code to wire Softprobe into your existing agent without refactoring architecture, prompts, or tools.

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

Set environment variables (or load the same keys from `.env` in your app process):

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
| `SOFTPROBE_SESSION_ID` | No | Product session id (also pass on the handler) |
| `SOFTPROBE_USER_ID` | No | Optional end-user id on spans |

The Connect Agent install prompt embeds your agent API key and these URLs. Do not commit credentials to source control.

## 3. Attach the handler and invoke

Pass a **product conversation id** on the handler. Softprobe groups Steps into one Explorer Session via that id (`sp.session.id`). Mint a new id when the user starts a new chat; **reuse the same id** for every turn in that chat (do not hardcode a literal like `"sess-1"` in production).

**Python**

```python
import uuid
from softprobe import SoftprobeClient
from softprobe.langchain import CallbackHandler

sp = SoftprobeClient.from_env()
# Persist this for the lifetime of the conversation (e.g. your app's thread/chat id).
session_id = str(uuid.uuid4())
handler = CallbackHandler(softprobe_client=sp, session_id=session_id)

result = agent.invoke(inputs, config={"callbacks": [handler]})
sp.flush()
```

**TypeScript**

```ts
import { SoftprobeClient, resolveSoftprobeConfigFromEnv } from "@softprobe/tracing";
import { CallbackHandler } from "@softprobe/langchain";

const cfg = resolveSoftprobeConfigFromEnv();
if (!cfg) throw new Error("Set SOFTPROBE_PUBLIC_KEY and SOFTPROBE_BASE_URL");
const sp = new SoftprobeClient(cfg);
// Persist this for the lifetime of the conversation (e.g. your app's thread/chat id).
const sessionId = crypto.randomUUID();
const handler = new CallbackHandler({ softprobeClient: sp, sessionId });

await agent.invoke(input, { callbacks: [handler] });
await sp.flush();
```

Parent/child links use LangChain `runId` / `parentRunId`. Softprobe does not invent separate Softprobe `run_id` attributes from those ids.

## 4. Verify

1. Run one real agent turn that uses a **tool** so Softprobe receives generation + tool spans.
2. In Explorer, open **Agents → + Connect agent** and **Check connection**, or browse **Sessions** for the new Session (range filter defaults to the last 7 days).

Sessions are matched to the Explorer Agent via the agent API key (`SOFTPROBE_PUBLIC_KEY`); you do not set an agent name in env.

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
| No Sessions appear | Env vars set in the **same process** as the agent; handler passed on `invoke` / `graph.invoke`; process stayed alive long enough to `flush()` |
| Auth / ingest errors | `SOFTPROBE_PUBLIC_KEY` and `SOFTPROBE_BASE_URL` match Connect Agent values; key was not rotated without updating env |
| Only generations, no tools | Run a turn that actually calls a tool |
| Split / orphaned Sessions | Reuse one `session_id` / `sessionId` for the whole conversation; do not mint a new UUID on every turn |

Packages: [`softprobe`](https://pypi.org/project/softprobe/) (Python), [`@softprobe/langchain`](https://www.npmjs.com/package/@softprobe/langchain) (TypeScript).
