# 策略与活动

Lisa 将**策略定义**与**会话证据**严格分离，确保未经所有者确认的观测行为不会自动成为已批准规则。

## 策略生命周期

- 策略保存在 `lisa.policies` 表中（包含 `id`、`scope`、`target_agent_name`、`name`、`criteria`、`approved`）。
- **工作区与 Agent 作用域：** 工作区规则适用于部署中的所有 Agent；同名情况下，已批准的 Agent 规则会覆盖工作区规则。
- **审批要求：** 新建或修改的策略默认为未批准（`approved: no`）。只有所有者（`LISA_OWNER_USER_IDS`）批准的策略才会参与评估裁决。

## 评估流程

1. 遥测发送端向 `POST /internal/v1/session-traces` 推送 OTLP JSON 会话包。
2. Lisa 解析 `sp.session.id`（回退至 `gen_ai.conversation.id`、Trace ID）与 `sp.agent.name`（回退至 `service.name`），写入 `otlp.json` 与 `manifest.json` 并入队 PGMQ 任务。
3. 评估 Worker 加载该 Agent 已批准的策略，分诊候选会话-策略对，对升级项运行 LLM 裁决并落库结果。

## 活动与 Slack

- 每次评估都会生成一条活动记录，可在 Lisa UI 中查看。
- 配置可选的 `LISA_SLACK_*` 后，Lisa 可将已确认的策略失败告警发送至 Slack 并处理监控线程。
