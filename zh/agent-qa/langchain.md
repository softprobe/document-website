---
title: LangChain
---

# LangChain 安装

为 [LangChain](https://www.langchain.com/) / [LangGraph](https://langchain-ai.github.io/langgraph/) 安装 Softprobe Agent QA。优先使用 Explorer 中的**复制粘贴提示**（见 [快速开始](/zh/agent-qa/getting-started)）。

Softprobe 采用**你自己的**会话与用户 id（LangGraph `thread_id`、chat id、`user_id` 等），不会发明 Softprobe session UUID。Softprobe 是**增量**接入——从不替换你已有的 callbacks。

## 最佳路径（零 invoke 改动）

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
export SOFTPROBE_PUBLIC_KEY="spk_…"
export SOFTPROBE_BASE_URL="https://explorer.softprobe.ai/api/thelake"
export SOFTPROBE_OTLP_ENDPOINT="https://explorer.softprobe.ai/api/thelake/v1/traces"
export SOFTPROBE_ENVIRONMENT="Production"
```

| 变量 | 必填 | 含义 |
|------|------|------|
| `SOFTPROBE_PUBLIC_KEY` | 是 | Explorer **Agents → + Connect agent** 中的 Agent API key（`spk_…`） |
| `SOFTPROBE_BASE_URL` | 是 | `https://explorer.softprobe.ai/api/thelake` |
| `SOFTPROBE_OTLP_ENDPOINT` | 否 | 默认为 `{SOFTPROBE_BASE_URL}/v1/traces` |
| `SOFTPROBE_ENVIRONMENT` | 否 | 与 Explorer 中 Agent 环境一致的标签 |
| `SOFTPROBE_LANGCHAIN` | 否 | 设为 `0` / `false` 可关闭自动埋点 |
| `SOFTPROBE_SESSION_ID` | 否 | 仅当本次运行没有 thread / session / chat id 时的回退 |
| `SOFTPROBE_USER_ID` | 否 | 仅当本次运行没有 user id 时的回退 |

### 3. 在进程启动时启用一次

设置好凭证后，包加载时 Softprobe 会自动埋点。请在 Agent 运行**之前**导入：

**Python**

```python
import softprobe.langchain  # 设置了 SOFTPROBE_* 凭证时自动埋点
```

**TypeScript**

```ts
import "@softprobe/langchain"; // 设置了 SOFTPROBE_* 凭证时自动埋点
```

也可显式调用（效果相同，代码审查更清晰）：

```python
from softprobe.langchain import instrument
instrument()
```

```ts
import { instrument } from "@softprobe/langchain";
instrument();
```

继续使用你现有的 `configurable.thread_id` / `user_id`（或 chat id）。Softprobe 从 LangChain metadata 读取——**无需改 `callbacks`**。

```python
agent.invoke(inputs, config={"configurable": {"thread_id": chat_id, "user_id": user_id}})
```

关闭自动埋点：`export SOFTPROBE_LANGCHAIN=0`，或调用 `uninstrument()`。

## 逃生舱：追加 handler

若你已自行管理 callbacks，且只想在部分 invoke 上启用 Softprobe：

```python
from softprobe.langchain import CallbackHandler

handler = CallbackHandler()
agent.invoke(
    inputs,
    config={
        "callbacks": [*existing_callbacks, handler],  # 追加 — 不要替换
        "configurable": {"thread_id": chat_id, "user_id": user_id},
    },
)
handler.flush()
```

## 验证

1. 跑一轮会调用**工具**的真实 Agent 对话。
2. 在 Explorer：**Agents → + Connect agent → Check connection**，或浏览 **Sessions**。

Session 通过 `SOFTPROBE_PUBLIC_KEY` 匹配到 Agent。Softprobe 按**你的** thread / session / chat id 分组 Steps。

## 会追踪什么

| 类型 | 作用 |
|------|------|
| **Agent / chain** | 编排 / 图根 |
| **Generation** | 模型调用（含输入 / 输出与用量） |
| **Tool** | 工具调用（含参数与结果） |
| **Retriever** | 检索步骤（若存在） |

## 排障

| 现象 | 检查 |
|------|------|
| 没有 Session | 凭证在同一进程；Softprobe 在 Agent 运行**前**已 import / 调用 `instrument()`；`SOFTPROBE_LANGCHAIN` 不是 `0` |
| 鉴权错误 | key 与 base URL 与连接 Agent 一致 |
| 只有 generation | 跑一轮会调用工具的对话 |
| Session 被拆开 | 跨轮次复用同一应用 thread / chat id |

包：[`softprobe`](https://pypi.org/project/softprobe/)（Python）、[`@softprobe/langchain`](https://www.npmjs.com/package/@softprobe/langchain)（TypeScript）。
