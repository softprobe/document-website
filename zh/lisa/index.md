# Lisa

Lisa 是用于审查和改进 AI Agent 行为的 QA 工程师。它通过 OTLP 接收 Agent 会话，针对已捕获的轨迹评估已批准的策略，并将分诊决策与活动线程记录在自有的 PostgreSQL 存储中。

Lisa 可独立运行，不依赖 TheLake 或 Explorer。

## 核心能力

- **直连会话接入：** 通过私网端点 `POST /internal/v1/session-traces` 接收完整的 OTLP JSON 会话包，落盘并在同一事务中通过 PGMQ 入队评估任务。
- **策略驱动评估：** 在 `lisa.policies` 中维护工作区级与 Agent 级规则。仅由所有者批准的策略才会生成评估结论。
- **分诊与裁决：** 对候选的会话-策略对进行分诊，将疑似违规的证据升级给 LLM 裁决，并保存可追溯的结果。
- **活动与 Slack 集成：** 将评估运行、监控和发现记录为活动，支持可选的 Slack 事件与告警通知。

## 下一步

- [快速开始](/zh/lisa/getting-started)
- [策略与活动](/zh/lisa/policies-and-activities)
- [运行时配置](/zh/lisa/configuration)
