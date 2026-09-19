---
title: 录制流量
---

# 录制流量

录制就是让挂了 Agent 的应用**正常处理真实请求**——每条经过的请求连同它触发的依赖调用（数据库、HTTP、Redis…）会自动存成一条**用例**，成为后面回放的素材。

本页以 `order-service` 为例：它已按 [接入 Java Agent](/zh/testing/java-agent) 挂载 Agent、按快速开始注册过应用（`appId` 在手）。录制到配置对比规则这几步都用这个应用。

::: tip 开箱即录，不需要先配策略
内置的全局默认策略（priority 0）让录制开箱即用，并已排除 `/health` 等探针流量。只有当你要调整采样率、时间窗口或操作范围时，才需要写应用级策略——见本页末尾 [调整录制范围](#调整录制范围)。
:::

## 第 1 步 · 确认 Agent 在线

在**要采集流量的环境**（通常是生产或预发）启动应用：

```bash
java -javaagent:sp-agent.jar \
     -Dsp.app.id=<你的 appId> \
     -Dsp.api.url=http://<后端主机>:8090 \
     -jar order-service.jar
```

确认 Agent 已上报：

```bash
sp app status <你的 appId> --json
```

多环境部署时给实例打标签（如 `-Dsp.mocker.tags=env=prod`），之后筛选用例、匹配策略都靠它。

## 第 2 步 · 让真实流量流过

什么都不用做——用户请求、业务调用、压测流量经过应用就会被采集。没有自然流量的环境（如预发），主动向接口发几笔业务请求即可。

::: tip 用例只能录出来，不能手写
CLI 不支持手工构造用例。想要更多用例，就让更多流量流过应用。
:::

## 第 3 步 · 确认录到了

<InterfaceTabs :tabs="['ui','cli']">
<Interface id="ui">

1. 在 Softprobe 控制台打开对应应用的 **工作台（Workbench）**。
2. 在左侧导航中展开 **滚动录制**，选择对应的 API 接口，查看捕获的录制用例列表与上报时间。
3. 点击任意一条用例进入链路详情，可核对入口请求内容及数据库、Redis、HTTP 等下游依赖调用。

![工作台查看录制用例演示](/img/docs/testing/view-recorded-data.gif)

</Interface>
<Interface id="cli">

```bash
sp record case list --app <你的 appId> --since -1h --json
```

需要按链路核对完整性时用：

```bash
sp record completeness <traceId> --json
```

</Interface>
</InterfaceTabs>

列表里出现用例，第 1 步就完成了。如果希望用例在默认保留期后仍可使用，请先[固化用例并加入测试集](/zh/testing/pinned-cases)，再进入 [回放](/zh/testing/replay-and-diff)。

## 没录到？按这张表排查

| 现象 | 优先排查 |
|------|----------|
| `sp record case list` 为空 | 应用级策略把 `ratePerHundredSeconds` 设成了 0；当前时间在 `timeWindow` 外；操作被 `exclude` |
| Agent 显示不录制 | `machineCountLimit` 过小；另有实例占满配额 |
| 有用例但很少 | 采样上限；`include` 白名单过窄 |
| 完全无上报 | `appId` 与策略 `selector` 不一致；`SP_API_URL` 不可达；Agent 不在线 |

## 录制环境与回放环境分开

| 环境 | Agent 录制 | 说明 |
|------|------------|------|
| 生产 / 预发 | 开启 | 采集真实流量建用例库 |
| 测试 / CI 回放机 | 关闭或极低采样 | 避免回放时再录一套数据污染用例库 |

按来源环境筛选用例时，保持录制与查询使用一致的 `sp.mocker.tags`（如 `env=prod`）。

## 调整录制范围 {#调整录制范围}

默认策略不满足时——比如要控制采样率、只录部分接口、限定录制时段——写一份应用级 `RecordingPolicy`（`priority > 0` 覆盖全局默认）：

```bash
sp policy recording validate -f recording.yaml --json
sp policy recording apply -f recording.yaml --json
```

可调项：`ratePerHundredSeconds`（采样）、`timeWindow`（时段）、`operations.include/exclude`（接口范围）、`serializeSkip`、`timeMock`。逐字段说明与完整示例见 [策略 YAML 指南 · RecordingPolicy](/zh/testing/policy-yaml-guide#recordingpolicy)。

::: warning `machineCountLimit: 1` 慎用
该字段限制同环境**同时录制**的实例数。设为 `1` 时，首个占坑实例下线后配额可能长期不释放，其它实例会显示不录制。生产策略建议省略该字段（不限）或设为不小于实例数。
:::

::: info 两个已知边界
- 录制路径上的 `spec.sensitiveData` 目前**不会**改变入库内容；查看时脱敏见 [SensitivePolicy](/zh/testing/policy-yaml-guide#related-configuration)。
- 修改 `operations` 包含/排除也会影响**回放调度**的操作范围。
:::

## 下一步

用例已经躺在库里了 → **[固化用例与测试集](/zh/testing/pinned-cases)** 保留选中的用例，或直接进入 **[回放与对比](/zh/testing/replay-and-diff)** 做一次时间窗口回放。
