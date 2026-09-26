---
title: 能力描述符
---

# 能力描述符

每个 **RunnerVersion** 与 **EnvironmentVersion** 都会声明一份 **能力描述符（capability descriptor）**，以便 Softprobe 在 **plan/validate** 阶段拒绝不兼容的 WorkflowVersion（状态为 `unsupported`）——绝不会静默当成门禁通过。

描述符**不是** Softprobe evaluator ABI。Softprobe 不提供 Softprobe scorer 插件表面。

## 描述符字段

| 字段 | 说明 |
|------|------|
| Protocol / implementation version | Runner 或 environment 的 ABI 级别 |
| Runtime | `oci`、`process` 等 |
| Result-bundle schema | 声明的原生输出契约 / 大小限制 |
| Required mounts / network / secrets | 最小权限授权 |
| Determinism / reproducibility class | Hermetic / pinned_external / recorded_external / live |
| Resources | CPU、内存、GPU、时间、成本预算 |
| Residency | 数据敏感度与区域约束 |

## 协议演进

- 同一主版本内可加字段（additive）。
- 每个描述符带有 **最小/最大 kernel protocol**。
- **Required capability IDs** — 仅当全部被识别时 host 才执行。
- **可选不透明扩展**按字节原样保留。
- 未知可选字段忽略；未知 **required** 能力 → validate 时返回 `unsupported`。

## 谁挂载描述符

RunnerVersion · EnvironmentVersion ·（host 放置约束）

SubjectVersion 锁定 digest 与模型/工具身份；它不声明 Softprobe evaluator 拓扑。

## 一致性（Conformance）

语料覆盖：旧 host/新 manifest、新 host/旧 manifest、拒绝降级、扩展往返，以及未知能力等 fixture。

## 相关

- [扩展模型](/zh/evaluation/architecture/plugin-model)
- [Framework runners](/zh/evaluation/reference/framework-adapters)
- [Result status](/zh/evaluation/reference/result-status)
