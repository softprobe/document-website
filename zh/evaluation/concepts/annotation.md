---
title: 标注
---

# 标注

[**Annotation（标注）**](/zh/evaluation/concepts/terminology#annotation) 是 Softprobe 将捕获的 LLM 流量转为带标签真值的方式：人工把结构化的 [**score（分数）**](/zh/evaluation/concepts/terminology#score) 挂到特定工作单元上，之后可用于过滤质量、校验自动化检查，以及整理评估数据集。

**Annotation** 是人工的 *动作*。**Score** 是 *落库的判断*。标注创建分数（`source: annotation`）；它不是一张单独的表。完整定义见 [术语](/zh/evaluation/concepts/terminology)。

本页讲的是 Softprobe LLM 数据在 thelake 上的 **Session 标注**（例如通过 Session Explorer）。它 **不是** Softprobe 原生 scorer DSL，也不是 Agent Evaluation 的人工评分器运行时。框架侧评审工作流（Promptfoo、DeepEval、外部工具）见 [人工评估](/zh/evaluation/concepts/human-evaluation) 与 [人工标注工作流](/zh/evaluation/concepts/terminology#human-annotation-workflow)。

## 标注用来做什么

与 Langfuse / Braintrust / LangSmith 人工评审的产品意图一致：

1. **标注质量**：在真实流量上打标（正确 / 错误、评分标准类别、备注）— 存为 [分数](/zh/evaluation/concepts/terminology#score)。
2. **记录修正**：[期望输出](/zh/evaluation/concepts/terminology#expected-output)，供离线评估使用。
3. **桥接捕获 → 评估** — 已标注的 [span](/zh/evaluation/concepts/terminology#span) 之后可晋升为数据集 / 框架套件（[生产到评估闭环](/zh/evaluation/guides/production-to-eval-loop)）。

Softprobe **不会**用标注去发明 Softprobe 原生自动化评估器。自动化质量检查留在框架里；标注是对已捕获 [**observation**](/zh/evaluation/concepts/terminology#observation) 的人工真值。

## 分数如何绑定（span、trace、session）

业界工具在不同粒度上挂反馈。Softprobe LLM 标注遵循常见的「评判这一步」模型：

```text
Session  (conversation)
  └── Trace  (one turn / request tree)
        └── Span / Observation  ← annotation attaches here (primary)
```

| 挂载点 | Softprobe LLM 标注现状 |
|--------|------------------------|
| [**Span**](/zh/evaluation/concepts/terminology#span) / [**observation**](/zh/evaluation/concepts/terminology#observation) | **主要。** Explorer 的 Annotate 会为所选 observation 写入 `span_id`。 |
| [**Trace**](/zh/evaluation/concepts/terminology#trace) | **反规范化。** 同一条 [score](/zh/evaluation/concepts/terminology#score) 行会存该 observation 的 `trace_id`，便于查询与展示。Session Explorer 没有单独的「仅 trace」标注模式。 |
| [**Session**](/zh/evaluation/concepts/terminology#session) | **已知时反规范化。** 若 observation 带有 `session_id`，同一条 score 行会一并存储。 |

因此：**标注绑定到你所选的 [span](/zh/evaluation/concepts/terminology#span)（[observation](/zh/evaluation/concepts/terminology#observation)）。** Trace 与 session id 随分数携带，这样就能列出「本 session 全部标注」或「本 trace 全部标注」，而无需发明第二种绑定类型。

这与 Langfuse / LangSmith 在给 observation 或 run 打分的同时记录父 trace id 的做法一致。Langfuse 还可以单独把分数挂到整条 trace 或整个 session；Softprobe LLM Session Explorer 则总是先选一个 span。

可选的 Agent Evaluation [**score target（分数目标）**](/zh/evaluation/concepts/terminology#score-target)（`span` \| `trace` \| `session` \| `workflow_run` \| `framework_attempt`）见 [分数目标](/zh/evaluation/reference/score-targets)。Session 标注使用上述以 span 为中心的列；不要求 Softprobe [WorkflowRun](/zh/evaluation/concepts/terminology#workflow-run)。

## 会写入什么

在 Session Explorer（或通过 API）标注时，Softprobe 会创建一条 [**score**](/zh/evaluation/concepts/terminology#score)，包含：

- `source: annotation`
- `span_id` — 所选 [**observation**](/zh/evaluation/concepts/terminology#observation)
- `trace_id` — 该 observation 的 [**trace**](/zh/evaluation/concepts/terminology#trace)
- `session_id` — 该 observation 的 [**session**](/zh/evaluation/concepts/terminology#session)（若存在）
- `name` / 类型化取值 — 来自所选 [**score config**](/zh/evaluation/concepts/terminology#score-config)
- 可选 `config_id`、`author_id`、`comment`、`metadata`

示例形态：

| [Score config](/zh/evaluation/concepts/terminology#score-config) | 典型用途 |
|--------------|-------------|
| `correctness`（boolean） | 对该 observation 的通过 / 失败 |
| `quality`（categorical） | 粗粒度标签（`good` / `ok` / `bad`） |
| `expected_output`（text） | 修正后的助手文本（[**期望输出**](/zh/evaluation/concepts/terminology#expected-output)） |

## 流程

```text
Capture (OTLP) → Session / Trace / Span in thelake
                      ↓
              Select observation in Explorer
                      ↓
              Annotation → Score (source=annotation)
                      ↓
         Later: promote labeled spans into eval datasets (Phase B / framework suites)
```

## 相关

- [术语](/zh/evaluation/concepts/terminology) — 统一词汇表（[score](/zh/evaluation/concepts/terminology#score)、[annotation](/zh/evaluation/concepts/terminology#annotation) 等）
- [人工评估](/zh/evaluation/concepts/human-evaluation) — 框架原生评审 vs Softprobe 保管
- [分数与门禁](/zh/evaluation/concepts/scores-and-gates) — 投影测量 vs 权威原生结果
- [关联与 Trace](/zh/evaluation/concepts/correlation-and-traces) — 评估运行上的 W3C id
- [采用 Langfuse 与 Braintrust](/zh/evaluation/guides/langfuse-and-braintrust-adoption)
- [生产到评估闭环](/zh/evaluation/guides/production-to-eval-loop)
