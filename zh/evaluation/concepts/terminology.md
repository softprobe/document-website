---
title: 术语
---

# 术语

Softprobe Agent Evaluation 与 LLM Session 标注的字母序词汇表。结构见 [数据模型](/zh/evaluation/concepts/data-model)；分数如何绑定到 span 见 [标注](/zh/evaluation/concepts/annotation)。

Softprobe 拥有下列 **工作流** 与 **Session 标注** 名词。框架 DSL 拥有用例、断言与框架内评分器，除非注明为投影。

| 术语 | 定义 |
|------|------|
| <a id="annotation"></a>**Annotation（标注）** | 人工在选定目标（主要是 **[span](#span)** / **[observation](#observation)**）上创建 `source: annotation` 的 **[score](#score)**。更正会创建 **新的** score id；不会就地改旧行。见 [标注](/zh/evaluation/concepts/annotation)。 |
| <a id="artifact-visibility"></a>**Artifact visibility（产物可见性）** | 控制谁可读字节的类别（`subject_input`、`runner_only`、`control_plane` 等）。 |
| <a id="assertion"></a>**Assertion / metric / judge（断言 / 指标 / 评判）** | 套件 DSL（Promptfoo、DeepEval 等）内的框架原生检查或 scorer。Softprobe 将结果存为产物 / 来源；不重定义 DSL。 |
| <a id="capability-descriptor"></a>**Capability descriptor（能力描述符）** | Runner / 环境元数据：所需网络、挂载、密钥、预算、驻留地、结果包 schema。 |
| <a id="case"></a>**Case / test / example（用例 / 测试 / 样例）** | 套件内的框架原生单元（如 Promptfoo `tests`）。Softprobe 将其存放在 **FrameworkDefinition** 产物中；不拥有用例 schema。 |
| <a id="closure-report"></a>**Closure report（封闭性报告）** | episode 的按依赖诚实账本：每次交互为 `recorded`、`simulated`、`seeded`、`live` 或 `unsupported`。Schema `softprobe.closure-report/v1`。见 [环境包](/zh/evaluation/concepts/environment-bundles)。 |
| <a id="dependency-tape"></a>**Dependency tape（依赖 tape）** | 有序、内容寻址的依赖交互记录（tool / MCP / HTTP / fs / …），用于副作用前的回放。Schema `softprobe.dependency-tape/v1`。 |
| <a id="environment-bundle"></a>**Environment bundle（环境包）** | 不可变可执行世界包：刺激、主体适配器、tape 索引、状态种子、episode 策略、评估器句柄。由 **[EnvironmentVersion](#environment-version)** 引用。 |
| <a id="environment-version"></a>**EnvironmentVersion** | 不可变可执行世界契约：环境包引用、晋升后的适配器、挂载、凭证引用、网络策略、资源 / 时间限额，以及声明的 reset / checkpoint / fork 能力。 |
| <a id="evidence-artifact"></a>**EvidenceArtifact** | 内容寻址材料：原生定义、原生结果包、日志、trace、用量、环境证据。 |
| <a id="expected-output"></a>**Expected output（期望输出）** | 一种 **文本** **[score](#score)**（通常名为 `expected_output`），存放修正后的助手文本，供后续数据集 / gold 使用。仍是 **score**，不是第二种产物类型。 |
| <a id="framework-attempt"></a>**FrameworkAttempt** | 一次 Softprobe 调用的 runner 执行；外层 attempt 的重试不可变且相互链接。框架内部 attempt 留在原生结果包中。 |
| <a id="framework-definition"></a>**FrameworkDefinition** | 封闭、内容寻址的原生套件及其引用的全部依赖。 |
| <a id="gate-decision"></a>**GateDecision** | 将 WorkflowVersion 中钉死的门禁策略应用于外层状态、来源，以及可选的选定 runner 上报字段后的结果。 |
| <a id="gym-episode"></a>**Gym episode / EnvironmentEpisode** | 对已解析 **[EnvironmentVersion](#environment-version)** 的一次隔离执行，含 reset / step（以及可选 checkpoint / fork）。用于评估与训练。见 [Gym episode 与训练 rollout](/zh/evaluation/guides/gym-and-training-rollouts)。 |
| <a id="human-annotation-workflow"></a>**Human annotation workflow（人工标注工作流）** | 框架或工具自有的评审队列 / 评分标准 / 裁决流。Softprobe 可将其导出存为证据；Softprobe 不提供 Softprobe 人工评估器运行时。有别于 Softprobe LLM 对已捕获流量的 **[annotation](#annotation)**。 |
| <a id="measurement"></a>**Measurement（测量）** | 来自框架上报结果的可选投影分数事实：名称、值、目标、证据引用。永非 Softprobe 评估器发明。 |
| <a id="observation"></a>**Observation** | Softprobe 对 **[span](#span)** 的查询视图（类型、名称、时序、模型、token、属性、事件、附带分数）。在 API 与 UI 中，“选择 observation”即“选择该 span”。 |
| <a id="online-policy"></a>**Online policy（在线策略）** | 过滤 + 采样 + watermark 规则，用于为在线框架运行选择生产 trace（是工作流输入，不是评估器）。 |
| <a id="reproducibility-class"></a>**Reproducibility class（可复现类别）** | `hermetic`、`pinned_external`、`recorded_external` 或 `live`。 |
| <a id="runner-version"></a>**RunnerVersion** | 钉死的框架 runner：包 / lockfile / 镜像摘要、命令、结果包 schema、声明能力。 |
| <a id="score"></a>**Score（分数）** | thelake 中的不可变判断事实：带名称的值（`boolean`、`numeric`、`categorical` 或 `text`），可含注释与元数据。人工 **[annotation](#annotation)** 创建分数；自动化检查也可写入分数。不是单独的“标注对象”类型。 |
| <a id="score-config"></a>**Score config（分数配置）** | 分数 **名称** 与 **数据类型**（及类别 / 边界）的只追加 schema。保持评审者间标签一致。 |
| <a id="score-projection"></a>**Score projection（分数投影）** | 将框架上报测量映射到 thelake `scores` 的可选、有损映射。原生包仍权威。 |
| <a id="score-target"></a>**Score target（分数目标）** | 投影测量的规范挂载点：`span \| trace \| session \| workflow_run \| framework_attempt`。 |
| <a id="session"></a>**Session** | 一次产品对话或编码 Agent 聊天：一个逻辑上的用户–Agent 对话，可含多轮。Softprobe 以稳定 `session_id` 存储（例如 OpenCode / spcode session id）。 |
| <a id="span"></a>**Span** | 一条 OTLP **span**：位于 **[trace](#trace)** 内的一次计时操作（Agent 轮次、generation、工具调用等）。Softprobe LLM 将 span 投影为 **[observation](#observation)**。Softprobe LLM **[annotation](#annotation)** 的主要挂载点。 |
| <a id="subject-version"></a>**SubjectVersion** | 被测 Agent、模型路由、镜像或部署。 |
| <a id="terminal-status"></a>**Terminal status（终态）** | FrameworkAttempt 结果 — 不是质量分数。见 [结果状态](/zh/evaluation/reference/result-status)。 |
| <a id="trace"></a>**Trace** | 一条 W3C 分布式 **trace**：共享同一 `trace_id` 的相关工作树。一个 **[session](#session)** 常含多条 trace（每轮或每次请求一条）。 |
| <a id="trial"></a>**Trial / reduce / pass@k** | 框架原生或可选投影的对重复 attempt 的聚合。Softprobe 不重定义 trial 语义。 |
| <a id="workflow-run"></a>**WorkflowRun** | 一次 WorkflowVersion 的一次执行（外层生命周期）。 |
| <a id="workflow-version"></a>**WorkflowVersion** | 已解析的 FrameworkDefinition + RunnerVersion + SubjectVersion + EnvironmentVersion + 门禁策略。 |

## 已弃用 Softprobe 术语

优先使用上表名词。旧文档可能仍写 **SuiteVersion**、**RunManifest**、**CaseRun**、**EvaluatorVersion** 或 **RunRequestVersion** — 将其视为 runner 优先之前、同一工作流思想的词汇。
