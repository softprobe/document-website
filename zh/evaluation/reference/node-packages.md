---
title: Node 包（Agent 环境）
---

# Node 包（Agent 环境）

Softprobe 提供用于录制、回放、打分与训练可执行 Agent 环境的 Node 包。请从 Softprobe LLM 工作区（`sp-llm`）或你的 registry 镜像安装。

## 包一览

| 包 | 用途 |
|----|------|
| `@softprobe/tracing` | Softprobe 凭证、OTLP endpoint 推导、session 遥测、scores |
| `@softprobe/agent` | Episode 上下文、依赖 tape、skip/inject 包装、FS overlay、closure 报告 |
| `@softprobe/protocol-fabric` | 捕获/回放环境中的 Node `fetch` / undici HTTP（补充语义级 wrap） |
| `@softprobe/promptfoo-adapter` | 原生调用 Promptfoo → `softprobe.framework-result/v1` |
| `@softprobe/gym` | Episode reset/step/fork API + 训练 session 门面 |
| `@softprobe/simulator-synth` | 研究：从观测到的 before/after 状态合成文件系统迁移程序 |
| `@softprobe/opencode-plugin` | OpenCode **观测**遥测（不是回放所有者） |

## 所有权规则（重要）

| Softprobe 产品知识 | Host / adapter 关注点 |
|--------------------|----------------------|
| `SOFTPROBE_*` 环境变量名与解析 | Host 配置文件路径 |
| 校验 `publicKey` / `baseUrl` | 发现顺序（先 env 后文件） |
| 将 `otlpEndpoint` 推导为 `{baseUrl}/v1/traces` | 缺少凭证时软禁用 |
| `environment` / `userId` / `serviceName` 的含义 | Host 默认值（`serviceName: "opencode"` 等） |

任何提及 `SOFTPROBE_*` 或推导 `{baseUrl}/v1/traces` 的代码，都必须调用 `@softprobe/tracing` 辅助函数——切勿在插件或 harness 中重新实现该逻辑。

## 依赖类别

```text
TOOL_CALL
MCP_CALL
FILESYSTEM
CHILD_PROCESS
HTTP_CLIENT
CLOCK
RANDOM
USER_TURN
```

tape、closure 报告、environment bundle 与 framework result 的可机器校验 schema，随 Softprobe LLM 的 `contracts/` 一并提供。

## 最小安装示意

这些包位于 Softprobe LLM 工作区（`sp-llm`），**尚未**发布到公共 npm registry。在该工作区中：

```bash
cd sp-llm
pnpm install
# then import @softprobe/agent, @softprobe/gym, @softprobe/promptfoo-adapter, …
# optional: @softprobe/protocol-fabric for ambient HTTP
# credentials / OTLP: @softprobe/tracing
```

包发布后，请优先使用已 pin 的 registry 版本，并将 Softprobe 凭证辅助逻辑仅保留在 `@softprobe/tracing` 中。

## 相关指南

- [录制并回放 Agent 环境](/zh/evaluation/guides/record-replay-agent-environment)
- [用 Promptfoo 为 episode 打分](/zh/evaluation/guides/score-episode-with-promptfoo)
- [Gym episode 与训练 rollout](/zh/evaluation/guides/gym-and-training-rollouts)
- [Environment bundles 与 dependency tapes](/zh/evaluation/concepts/environment-bundles)
