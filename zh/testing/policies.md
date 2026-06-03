---
title: 策略
---

# 策略概览

Softprobe 测试用**声明式 YAML 策略**（`apiVersion: softprobe.ai/v1`）控制行为，而非临时请求参数。策略按应用匹配、按 `metadata.priority` 合并，由 sp-boot 在运行时生效。

**操作流程**与**策略配置**分开阅读：

| 阶段 | 操作文档 | 策略配置 |
|------|----------|----------|
| **1 · 录制** | [如何录制](/zh/testing/recording) | 本节 [RecordingPolicy](#recording-policy) |
| **2 · 回放** | [回放与对比](/zh/testing/replay-and-diff) | 本节 [MockPolicy](#mock-policy)、[CompareRulePolicy](#compare-policy) |

逐字段说明与完整 YAML 示例：[策略 YAML 指南](/zh/testing/policy-yaml-guide) · [CLI 策略索引](/zh/cli/policies/)

## CLI 速查

```bash
sp policy recording validate -f recording.yaml --json
sp policy recording apply -f recording.yaml --json
sp policy mock apply -f mock.yaml --json
sp policy compare apply -f compare.yaml --json
```

冲突时 **`metadata.priority`** 更高者生效。内置 priority 0 全局默认；应用策略请设 `priority > 0`。

## 按生命周期分阶段

| 阶段 | Kind | 何时配置 | CLI |
|------|------|----------|-----|
| **1 · 录制** | `RecordingPolicy` | 产生流量**之前** | `sp policy recording` |
| **2 · 回放** | `MockPolicy` | 执行 `sp replay run` **之前** | `sp policy mock` |
| **2 · 回放** | `CompareRulePolicy` | 执行 `sp replay run` **之前** | `sp policy compare` |

完整生命周期：[快速开始](/zh/testing/getting-started)

---

## RecordingPolicy {#recording-policy}

**阶段 1 · 产生流量之前**

控制 Agent **录什么**：采样、时间窗口、操作包含/排除、序列化跳过、录制时时间 Mock。

- **采样** — `ratePerHundredSeconds`（每 100 秒上限；`0` = 不录）、`machineCountLimit`（并发录制实例上限，省略 = 不限）
- **时间窗口** — `daysOfWeek`、`from` / `to`（Agent JVM 本地时区）
- **操作过滤** — `exclude`（黑名单 Glob）；非空 `include` 时变为白名单模式
- **序列化跳过** — `serializeSkip` 按类名与字段名
- **`timeMock`** — 录制时固定 `java.time.*`

**如何录制（操作步骤）：** [如何录制](/zh/testing/recording)

**YAML 字段与示例：** [策略 YAML 指南 · RecordingPolicy](/zh/testing/policy-yaml-guide#recordingpolicy)

::: info 说明
- `spec.sensitiveData` 在 Agent 录制路径**尚未生效**；Mock 键噪声用 `matchTolerance`，查看脱敏用 `SensitivePolicy`（见 YAML 指南相关配置）。
- 修改 `operations` 包含/排除会影响**回放调度**的操作范围，无需单独改调度文档。
:::

```bash
sp policy recording validate -f my-recording.yaml --json
```

---

## MockPolicy {#mock-policy}

**阶段 2 · 回放之前**

控制回放时**依赖是否 Mock**、Mock 键容差、跨应用依赖与无匹配 Mock 时的回退。

- **`mockByDefault`** — 默认 Mock 全部依赖（`skipMock` 为例外），或反之以 `forceMock` 为例外
- **`Category:operationGlob`** — 如 `HttpClient:/payment/**`（**不是** `Servlet` 等入口类型）
- **`matchTolerance`** — 忽略易变头、查询参数、body 路径
- **`multiServiceDependencies`** — 同会话内下游应用 Mock
- **`fallback`** — `FAIL`（默认）、`PASS_THROUGH`、`RETURN_DEFAULT`

内置全局策略 **强制 Mock** `DynamicClass:SystemTime.**` / `RandomSource.**`；用户 `skipMock` 无效。

**YAML 字段与示例：** [策略 YAML 指南 · MockPolicy](/zh/testing/policy-yaml-guide#mockpolicy)

[完整依赖分类列表](/zh/testing/policy-yaml-guide#mock-categories)

---

## CompareRulePolicy {#compare-policy}

**阶段 2 · 回放之前**

控制回放**差异对比**中的噪声（非 Mock 行为）。

- **`excludePaths` / `includePaths`** — JSON Pointer（支持 Glob）
- **`defaults.timeToleranceMs`** 与 CEL **`validations`** — 按规则丢弃差异（含按 `category` 忽略，如 DATABASE body）
- **`operationSpecs`** — 按入口操作覆盖（**不要**在 `selector` 上写操作名）

**YAML 字段与示例：** [策略 YAML 指南 · CompareRulePolicy](/zh/testing/policy-yaml-guide#comparerulepolicy)

回放后用 `sp replay diff` 排查，再收紧策略而非改业务代码。

---

## 动态类（非 RecordingPolicy）

本地缓存等方法在**动态类配置**（控制台/API）登记，不在 `RecordingPolicy` 中。回放 Mock 通过 **MockPolicy** 的 `UserDynamic` / `DynamicClass` 规则控制。见 [策略 YAML 指南 · 相关配置](/zh/testing/policy-yaml-guide#related-configuration)。

## 相关文档

- [如何录制](/zh/testing/recording)
- [回放与对比](/zh/testing/replay-and-diff)
- [策略 YAML 指南](/zh/testing/policy-yaml-guide)
- [CLI：policy 命令](/zh/cli/commands/policy)
