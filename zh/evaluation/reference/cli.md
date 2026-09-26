---
title: CLI 参考
---

# CLI 参考

Agent Evaluation 命令扩展 **`sp`** CLI，并与 Testing 使用相同的 `--json` 信封。命令解析或执行 **WorkflowVersion**（framework suite + subject + environment + runner）。

## 命令

| 命令 | 用途 |
|------|------|
| `sp eval pack` | 关闭 FrameworkDefinition（对所有文件引用求哈希） |
| `sp eval validate` | 校验 pin、runner 能力、已关闭的 definition |
| `sp eval run` | 在本地或托管 host 上执行 FrameworkAttempt |
| `sp eval compare` | 对比 WorkflowRun 间选定字段 / 投影 |
| `sp eval publish` | 将本地 JSONL bundle 上传到 thelake（托管） |
| `sp eval promote` | 记录授权的 workflow/gate 晋级，供发布审计 |

## Pack 与 validate

```bash
sp eval pack --dir ./promptfoo-suite --out .softprobe/definition.json --json

sp eval validate \
  --definition .softprobe/definition.json \
  --runner promptfoo-runner@2.1.0 \
  --subject support-router@sha256:... \
  --environment ci-noop@sha256:... \
  --out .softprobe/workflow.resolved.json \
  --json
```

对未 pin 的文件、不允许的能力，以及 runner 兼容性返回带类型的诊断——**不做断言翻译，也不消耗模型额度**。

## Run

```bash
sp eval run --workflow .softprobe/workflow.resolved.json \
  --out-dir .sp-work/runs/latest \
  --json
```

本地执行写入 JSONL 事件与内容寻址制品（含原生 result bundle）。当 **GateDecision** 失败时退出码为 `1`（除非使用 `--no-gate`）。

## Compare

```bash
sp eval compare --baseline run-a --candidate run-b \
  --gate-policy sha256:... \
  --json
```

输出选定字段/投影的增量以及门禁结果，供晋级工作流使用。

## JSON 信封

契约与 [Testing 输出契约](/zh/testing/agents/output-contract) 相同：

```json
{
  "ok": true,
  "command": "eval run",
  "data": { "workflow_run_id": "...", "gate": "pass" }
}
```

## 退出码

| 码 | 含义 |
|----|------|
| 0 | 成功；门禁通过（若已评估） |
| 1 | API/kernel 错误或门禁失败 |
| 2 | 用法错误 / 无效 workflow |
| 3 | 缺少鉴权 / 租户上下文 |

FrameworkAttempt 状态（与 CLI 退出码不同）见 [Result status](/zh/evaluation/reference/result-status)。
