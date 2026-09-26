---
title: 鲁棒性与安全评估器
---

# 鲁棒性与安全评估器

> **Softprobe 职责：** Softprobe 不会把这类方法实现为 Softprobe 评估器。请使用已拥有这些检查的框架，将其钉选为 **RunnerVersion**，并捕获原生结果包。参见 [生态方法族](/zh/evaluation/evaluators/)。

**鲁棒性评估器**使用扰动、蜕变测试、模糊测试与 red-team 用例生成器，并配合血缘、预算与安全沙箱。

## 度量内容

- 输入扰动下的行为
- 蜕变关系（例如释义不变性）
- 模糊生成的边界用例
- Red-team 成功率（越狱、渗出）

## 安全测试示例

Episode 套件可包含以下用例：

- Prompt injection 抵抗
- 租户密钥渗出
- 恶意仓库内容处理
- 禁止的出站网络访问

## 所需证据

- 派生框架用例上的生成器血缘
- 沙箱证明与启动元数据
- 检查失败时的安全事件产物

## 类似能力

Promptfoo red-team 插件、Agent 安全基准、蜕变测试文献。

## 扩展规则

交付或钉选已拥有该方法族的 **framework runner**。**不要**添加 Softprobe scorer 插件、Softprobe Measurement schema、Softprobe reducer，或 Softprobe 人工评估器运行时。

参见 [生态方法族](/zh/evaluation/evaluators/) 与 [Framework runners](/zh/evaluation/reference/framework-adapters)。
