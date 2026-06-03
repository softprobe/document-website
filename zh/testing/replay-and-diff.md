---
title: 回放与对比
---

# 回放计划与对比

回放是**第二阶段**：将已录制用例变成一次**回归运行**（相同入口请求、Mock 依赖、自动差异判定）。

::: tip 先录制，再回放
1. 完成 [如何录制](/zh/testing/recording)，确认 `sp record case list` 有用例  
2. 配置 [Mock 与对比策略](/zh/testing/policies#mock-policy)  
3. 再执行本页的 `sp replay run`
:::

## 前置条件

- 该 `appId` 下**已有录制用例**（见 [如何录制](/zh/testing/recording)）
- **测试环境**中的被测应用已挂载 Agent 并运行
- 已应用 Mock 与对比策略
- **`targetEnv` 可达** — 该测试实例的基础 URL

::: warning 在生产录制，在测试环境回放
可在生产或预发录制流量，但除非明确接受风险，否则**应在非生产实例上回放**。回放驱动会向 `targetEnv` 发送真实 HTTP；仅下游调用被 Mock。
:::

回放主机上请将**录制频率调低或关闭**，避免在回放过程中再录一套数据。

## 回放计划

**计划**是带 `planId` 的批处理任务：

```bash
sp replay run --app <appId> --env http://order-service.test:8080 --json
sp replay status --plan <planId> --json
```

| 概念 | 含义 |
|------|------|
| `targetEnv` / `--env` | 接收回放入口流量的服务基础 URL（协议 + 主机 + 端口） |
| `planId` | 整次运行的容器 |
| `planItemId` | 计划内的一个操作（API 路径） |
| `replayId` | 单个用例的一次回放执行 |
| Case | 一条录制的入口请求及其依赖 mocker |

`SP_API_URL` 指向 **sp-boot**，不是 `targetEnv`。混淆二者是常见集成错误 — 见 [CLI 概念](/zh/cli/guide/concepts#replay-target-url-targetenv)。

## 回放时发生什么

1. 调度服务加载选定用例并将 Mock **预加载**到 Redis。
2. 对每个用例，向 `targetEnv` 发送录制的入口 HTTP 请求。
3. 服务处理请求；每次依赖调用时 Agent 向存储查询**录制响应**。
4. 存储记录回放侧 mocker 供对比。
5. 对比引擎运行；结果写入回放报告与差异 API。

**入口流量是真实的；依赖不是。** 主 API 在测试 JVM 上真实执行；在 Mock 策略生效时，数据库与外部 HTTP 客户端收到的是 Mock 响应体。

## 通过、失败与无效

当对比在配置范围内未发现实质差异时，用例**通过**。**失败**用例会展示差异场景，例如：

- **缺依赖调用** — 回放时 `HttpClient` 未调用录制时访问过的 `/api/foo`
- **值差异** — 调用了依赖但响应体不同
- **主响应差异** — 入口 `Servlet` 响应与录制不一致

排查命令：

```bash
sp replay case list --plan <planId> --json
sp replay diff --plan <planId> --json
sp diagnose replay --plan <planId> --json
```

## 降低噪声

跨环境必然不同的字段 — 时间戳、随机 ID、Pod IP、会话令牌 — 若不忽略会导致误报。

常用做法：

1. **CompareRulePolicy** — 在重新回放前声明忽略的 JSON 路径或分类
2. **重复回放** — 部分团队在同一环境跑两次以发现不稳定字段（旧版「智能推荐」会从配对运行建议忽略列表）
3. **时间与随机** — 默认 Mock 策略会强制 Mock `DynamicClass` 中的时间/随机源

尽量通过 `sp policy compare` 配置，而非仅改界面开关，以便 CI 与 Agent 共用同一套规则。

### 常见忽略模式

| 噪声来源 | 处理方式 |
|----------|----------|
| `createdAt`、`updatedAt` | 在对比策略中忽略节点 |
| UUID / trace id | 忽略或正则转换 |
| Base64 包裹的载荷 | 在对比策略中配置解压/解码 |
| DB `SELECT` 元数据 | 全局默认常排除低信号操作 |

## 用例选择

回放范围来自：

- 计划请求中的时间范围与操作过滤
- 录制策略的操作包含/排除（与调度配置读取时耦合）

CLI 不支持手写用例；扩大覆盖请录制更多流量或调整录制策略。

## 仪表盘与 CLI

人工常在 workbench 或仪表盘中查看差异树；Agent 与 CI 应使用 **`sp replay diff`** 及 [输出约定](/zh/cli/guide/output-contract) 中的 `--out-dir` 产物路径。

部署 Webhook 或 GitHub Actions / Jenkins 门禁的完整示例见 [Webhook 与 CI/CD](/zh/testing/webhook-and-ci)。

## 相关文档

- [工作原理](/zh/testing/how-it-works)
- [策略](/zh/testing/policies)
- [CLI：replay 命令](/zh/cli/commands/replay)
- [Webhook 与 CI/CD](/zh/testing/webhook-and-ci)
- [示例：诊断回放失败](/zh/cli/examples/agent-diagnose-replay)
