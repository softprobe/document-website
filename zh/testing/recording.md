---
title: 如何录制
---

# 如何录制

录制是回放之前的**第一阶段**：让 Agent 在真实请求经过应用时，把入口流量与依赖调用写入 sp-boot。没有录制产生的用例，后续 `sp replay run` 没有可执行数据。

操作步骤见下文；**采样、时间窗口、操作黑白名单**属于 [录制策略](/zh/testing/policies#recording-policy)（YAML），字段说明见 [策略 YAML 指南](/zh/testing/policy-yaml-guide#recordingpolicy)。

## 录制产生什么

每次有效请求会形成一条**用例**：入口（如 `Servlet`）+ 链路上的依赖 mockers（`HttpClient`、`Database`、`Redis` 等）。机制说明见 [工作原理 · 录制阶段](/zh/testing/how-it-works#录制阶段)。

::: tip
用例**仅由**已挂载 Agent 的真实流量产生。CLI 不能手写用例；请在录制期间向应用发送业务或压测流量。
:::

## 前置条件

| 项 | 说明 |
|----|------|
| 应用已注册 | `sp app create` 得到 `appId` |
| 录制策略已应用 | `sp policy recording apply` — [录制策略](/zh/testing/policies#recording-policy) |
| Agent 已挂载 | `-javaagent:…/sp-agent.jar` 与 `-Dsp.app.id` — [Java Agent](/zh/testing/java-agent) |
| 网络可达 | Agent 能访问 sp-boot（`SP_API_URL`，通常 `:8090`） |

## 操作步骤

### 1. 应用录制策略

在产生流量**之前**提交 `RecordingPolicy`：

```bash
sp policy recording validate -f recording.yaml --json
sp policy recording apply -f recording.yaml --json
```

全局默认策略（priority 0）已排除 `/health` 等探针；应用级策略用 `priority > 0` 覆盖采样与范围。

### 2. 启动带 Agent 的应用

按 [Java Agent](/zh/testing/java-agent) 挂载 `sp-agent.jar`，并设置：

```text
-Dsp.app.id=<你的 appId>
```

多环境时用标签匹配策略中的 `envTags`，例如：

```text
-Dsp.mocker.tags=env=prod
```

### 3. 产生流量

对接口执行业务请求、压测或合成流量。仅健康检查且已被 `exclude` 的操作不会产生用例。

### 4. 确认录制成功

```bash
sp app status --app <appId> --json
sp record case list --app <appId> --since -1h --json
```

可选：按 trace 检查完整性 `sp record completeness --trace-id <id> --json`。

## 录制环境与回放环境

| 环境 | Agent 录制 | 说明 |
|------|------------|------|
| 生产 / 预发 | 开启（按策略） | 采集真实流量建库 |
| 测试 / CI 回放机 | 关闭或极低采样 | 避免回放时再录一套数据污染用例库 |

按来源环境筛选用例时，保持录制与查询使用一致的 `sp.mocker.tags`（如 `env=prod`）。

## 调整录制范围

下列项在 **RecordingPolicy** 中配置，不是 JVM 开关：

- `ratePerHundredSeconds`、`machineCountLimit`
- `timeWindow`、`operations.include` / `exclude`
- `timeMock`、`serializeSkip`

详见 [策略 YAML 指南 · RecordingPolicy](/zh/testing/policy-yaml-guide#recordingpolicy)。

::: warning `machineCountLimit: 1` 慎用
该字段限制同环境**同时录制**的实例数。设为 `1` 时，首个占坑实例下线后配额可能长期不释放，其它实例会显示不录制。生产策略建议省略该字段（不限）或设为不小于实例数。
:::

## 常见问题：没有产生用例

| 现象 | 优先排查 |
|------|----------|
| `sp record case list` 为空 | `ratePerHundredSeconds` 是否为 0；是否在 `timeWindow` 外；操作是否被 `exclude` |
| Agent 显示不录制 | `machineCountLimit` 是否过小；是否另有实例占满配额 |
| 有用例但很少 | 采样上限；`include` 白名单是否过窄 |
| 完全无上报 | `appId` 是否与策略 `selector` 一致；`SP_API_URL` 是否可达；Agent 是否在线 |

录制路径上的 `spec.sensitiveData` 目前**不会**改变入库内容；查看时脱敏见 `SensitivePolicy`（[策略 YAML 指南 · 相关配置](/zh/testing/policy-yaml-guide#related-configuration)）。

## 下一步（回放阶段）

::: warning 先有用例，再回放
在 `sp record case list` 能看到用例之前，不要执行 `sp replay run`。
:::

1. 配置 [Mock 与对比策略](/zh/testing/policies#mock-policy)（回放之前）
2. 执行 [回放与对比](/zh/testing/replay-and-diff)

完整生命周期：[快速开始](/zh/testing/getting-started)

## 相关文档

- [录制策略](/zh/testing/policies#recording-policy)
- [策略 YAML 指南](/zh/testing/policy-yaml-guide)
- [CLI 快速入门](/zh/testing/getting-started)
