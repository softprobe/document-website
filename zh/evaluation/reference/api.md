---
title: REST API
---

# REST API

托管式 Agent Evaluation 在 **sp-backend** 上提供带版本的 REST API（租户与鉴权与 Testing 相同）。本地运行使用 JSONL bundle；发布时经 ingestion 事务校验并追加。

## 资源分组

| 分组 | 操作 |
|------|------|
| **Workflows** | 解析 WorkflowVersion、按 digest 获取、校验 |
| **Runs** | 创建（基于 WorkflowVersion）、获取、列表、取消 |
| **Attempts** | FrameworkAttempt 状态与关联 |
| **Artifacts** | 按 digest 获取元数据；拉取字节（签名 URL） |
| **Gates** | 获取 WorkflowRun 的 GateDecision |
| **Events** | 只追加流读取（游标分页） |
| **Scores** | 查询可选投影测量值 |
| **Online policies** | 生产采样 / 回填策略的 CRUD |

## 公开 resolve API

便捷入口将用户意图解析为 WorkflowVersion：

```http
POST /api/v1/eval/resolve
Content-Type: application/json

{
  "framework_definition": { "digest": "sha256:..." },
  "runner": { "version": "sha256:..." },
  "subject": { "version": "sha256:..." },
  "environment": { "version": "sha256:..." },
  "gate_policy": { "version": "sha256:..." }
}
```

响应：完整解析后的 **WorkflowVersion**，含可复现性类别与能力协商结果。

## 启动一次运行（托管）

```http
POST /api/v1/eval/runs
Content-Type: application/json

{ "workflow_version_digest": "sha256:..." }
```

返回 `workflow_run_id`，并向租户 eval ledger 流式写入事件。本地 CLI（`sp eval run`）使用相同的 WorkflowVersion 语义，无需此 HTTP 跳转。

## Score 写入（v2）

```http
POST /api/v2/scores
```

接受规范的 `target_type` + `target_id`：

`span | trace | session | workflow_run | framework_attempt`

WorkflowRun 期间的 **Eval 投影**仅由可信 host 在 FrameworkAttempt 之后发出——公开客户端不得自行合成 Softprobe scorer 输出。v2 写入 API 仍用于遗留遥测、人工标注摄入，以及非 eval 的 score 路径；eval 自动化应使用 `sp eval run` / publish + query API。

v1 API 仍仅支持 span/trace/session。参见 [Score targets](/zh/evaluation/reference/score-targets) 与 [Trust boundaries](/zh/evaluation/architecture/trust-boundaries)。

## 鉴权

与 Testing 相同的 API key 与 JWT 租户模型。联邦 worker 使用短时凭证与签名事件发布（Phase 5B）。

## 客户端

托管 Phase 3 将附带 OpenAPI 生成的客户端。在此之前，自动化请使用 `sp eval publish` 与 `sp eval compare --json`。
