---
title: 用编码 Agent 排查
---

# 用编码 Agent 排查

让 Cursor、Claude Code、Codex、OpenCode 或其他编码 Agent 诊断 Softprobe Blackbox 的 Session 与 trace。证据留在你的 Softprobe 工作区。

这与**捕获**（`@softprobe/web-record` 浏览器 SDK、OBI 或 AI 框架 SDK）不同。捕获负责记录 Session；Blackbox MCP 让编码 Agent **管理 Agent 并排查 Session**。

## 1. 添加 Blackbox MCP

**Claude Code**

```bash
claude mcp remove blackbox 2>/dev/null; claude mcp add --transport http blackbox https://explorer.softprobe.ai/mcp
```

**Codex**

```bash
codex mcp add blackbox --url https://explorer.softprobe.ai/mcp
```

**Cursor（`.cursor/mcp.json`）**

```json
{"mcpServers":{"blackbox":{"url":"https://explorer.softprobe.ai/mcp"}}}
```

**OpenCode**

```bash
opencode mcp add blackbox --global --url https://explorer.softprobe.ai/mcp
```

## 2. 登录并向 Agent 提问

在编码 Agent 中完成 Explorer OAuth 登录：在 Claude Code 中打开 `/mcp`，执行 `codex mcp login blackbox`，打开 Cursor MCP 设置，或执行 `opencode mcp auth blackbox`。

示例：

- 用 Blackbox：为什么 session `sess_…` 失败了？检查工具错误和最后一次 generation。
- Blackbox：列出过去 24 小时内 agent `my-agent` 有错误的 Session。
- Blackbox：打开 trace `…`，总结工具结果与模型最终回答是否一致。

首次调用会在浏览器打开 Softprobe Explorer，请登录并点击 **Allow**。之后 Agent 可使用 `get_session`、`get_session_spans`、`search_sessions` 等工具。请引用 `session_id` / `trace_id` / `span_id`，并链接 Explorer：

`https://explorer.softprobe.ai?session=<session_id>`

## 可选：技能剧本（skill playbook）

```bash
npx skills add softprobe/softprobe-skills -g -y \
  -a cursor -a claude-code -a codex -a opencode \
  -s softprobe-agent-qa
```

来源：[github.com/softprobe/softprobe-skills](https://github.com/softprobe/softprobe-skills)（Apache-2.0）。

## 隐私

- 托管 MCP 使用你的 Softprobe 用户登录（OAuth）。令牌留在你的 MCP 客户端。
- 工具仅**读取** Session、observation、trace 与固定日志查询。
- 不会写入遥测或 scores。

## 排障

| 现象 | 处理 |
|------|------|
| 浏览器鉴权循环 | 在 Softprobe 同意页完成 Allow；确认已登录 Explorer |
| 工作区选择器 / 409 | 在 Explorer 选择工作区，或让 Agent 调用 `list_workspaces` / `select_workspace` |
| 缺少 MCP 工具 | 在客户端重新添加 `https://explorer.softprobe.ai/mcp` |
| 与 OpenCode 捕获混淆 | 捕获使用连接 Agent 流程中的 `@softprobe/opencode-plugin`；本 MCP 只做排查 |

## 下一步

- [快速开始](/zh/agent-qa/getting-started) — 连接 Agent 并验证捕获
- [概念](/zh/agent-qa/concepts) — Session 与 observation 形态
- [Explorer](https://explorer.softprobe.ai)
