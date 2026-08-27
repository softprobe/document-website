---
title: 回放与对比
---

# 回放与对比

回放把 [录制](/zh/testing/recording) 攒下的用例变成一次**回归运行**：把当初的入口请求原样打到你的**测试实例**上，依赖调用（数据库、外部 HTTP…）由录制数据自动 Mock，跑完自动对比录制响应和回放响应，给出通过/失败。

继续用 `order-service` 的例子：生产流量已经录了一批用例，现在要在测试环境验证新版本代码有没有回归。

## 第 1 步 · 准备测试实例

在测试环境把**新版本**的应用跑起来，同样挂 Agent、用同一个 `appId`：

```bash
java -javaagent:sp-agent.jar \
     -Dsp.app.id=<你的 appId> \
     -Dsp.api.url=http://<后端主机>:8090 \
     -jar order-service-new.jar
```

记下它的访问地址，比如 `http://order-service.test:8080`——这就是 **`targetEnv`**，回放流量的目的地。

::: warning 在生产录制，在测试环境回放
回放会向 `targetEnv` 发送**真实 HTTP 请求**（只有下游依赖被 Mock），所以除非明确接受风险，回放目标应该是非生产实例。同时把回放机上的录制关掉或调到极低，避免回放流量又被录一遍污染用例库。
:::

## 第 2 步 · 发起回放

```bash
sp replay run --app <你的 appId> --env http://order-service.test:8080 --json
```

命令返回一个 `planId`。盯着它跑完：

```bash
sp replay status <planId> --watch
```

::: tip 两个 URL 别混
`--env`（`targetEnv`）是**被测服务**的地址；`SP_API_URL` 是 **sp-backend 后端服务**的地址。混淆二者是最常见的集成错误——见 [CLI 概念](/zh/testing/agents/concepts#replay-target-url-targetenv)。
:::

回放期间发生的事：调度服务把用例的 Mock 预加载进 Redis，逐条向 `targetEnv` 重发录制的入口请求；你的服务真实执行业务代码，但每次调依赖时 Agent 返回**录制的响应**，不碰真实数据库和外部系统；回放侧流量被存下来，与录制侧自动对比。

sp-backend 在每次入口请求发出前记录 **`Replay send start`**，发出后记录 **`Replay send done`** / **`Replay send failed`**——这是回放 HTTP 派发的进入/退出边界，日志排查见 [Replay send / 日志标记](/zh/testing/reference/replay-send-log-markers)。

## 第 3 步 · 读结果

对比没有发现实质差异的用例**通过**。**失败**的用例会给出差异场景：

- **值差异** — 依赖调了，但响应体不同
- **缺调用** — 录制时调过的依赖，回放时没调
- **主响应差异** — 入口响应与录制不一致

命令行快速排查：

```bash
sp replay case list --plan <planId> --json     # 哪些用例失败
sp diagnose replay <planId> --failed-only --out-dir .sp-work --json   # 失败详情 + diff 产物落盘
```

拿到某条差异的 `diffId` 后，看单条完整 diff：`sp replay diff get <diffId> --out-dir .sp-work --json`。

## 有失败？先别当 bug

**大多数失败不是 bug。** 时间戳、随机 ID、Pod IP、会话令牌每次运行都会变——它们永远会"不一样"，但并没有出错。接下来两步就是干这个的：

- **[审查差异](/zh/testing/review-diffs-in-the-web-ui)** — 在工作台里逐条看 diff，接受不是 bug 的差异，让真失败露出来
- **[配置对比规则](/zh/testing/compare-rules-web-ui)** — 把"永远会变"的字段配成规则，以后每次回放都不再误报

规则也能用 YAML 声明（`sp policy compare`），方便进 CI 和 GitOps——见 [策略 YAML 指南 · CompareRulePolicy](/zh/testing/policy-yaml-guide#comparerulepolicy)。

## 术语速查

| 概念 | 含义 |
|------|------|
| `targetEnv` / `--env` | 接收回放入口流量的服务基础 URL |
| `planId` | 整次运行的容器 |
| `planItemId` | 计划内的一个操作（API 路径） |
| `replayId` | 单个用例的一次回放执行 |
| Case | 一条录制的入口请求及其依赖 mocker |

## 回放范围

普通回放哪些用例由计划请求的时间范围、操作过滤，以及录制策略的 `operations` 包含/排除决定。默认的 Rolling 回放使用基于时间范围的选择逻辑。

回放支持两种用例选择模式：

| 模式 | 选择方式 | 是否使用时间范围 |
|------|----------|------------------|
| Rolling（默认） | 计划时间窗与操作过滤匹配的录制用例 | 使用；省略参数时采用普通滚动窗口 |
| `--suite Pinned` | 应用 `Pinned` 集合中手动保存的用例 | 不使用；忽略 `--from` 和 `--to` |

`Pinned` 用于建立稳定的回归套件。它只包含手动置顶的用例，不包含自动管理的 `AutoPinned` 用例。因此，即使用例早于普通滚动窗口，也可以被回放。

运行 Pinned 套件：

```bash
sp replay run \
  --app <你的 appId> \
  --env http://order-service.test:8080 \
  --suite Pinned \
  --watch \
  --json
```

如果手动集合为空，命令会返回 `NO_PINNED_CASES`，不会创建一个看似成功的空运行。要扩大 Rolling 用例库，请回到 [录制](/zh/testing/recording) 录制更多流量；要调整 Pinned 套件，请在 Workbench 中置顶或取消置顶用例。

如果要在普通保留期后回放录制数据，请在 Workbench 中选择 **Pinned cases（固化用例）** 范围，并选择要组成测试集的固化用例；此时不要求原始录制仍处于时间窗口内。详见[固化用例与测试集](/zh/testing/pinned-cases)。

如果固化用例对应的 API 已被删除或重命名，工作台会标记 **API gone（API 已不存在）** 并跳过该用例。请更新应用配置，或将该用例从测试集中移除。

## 自动化

人工看差异用工作台；CI 与 AI 代理用 `sp diagnose replay <planId> --json` 和 [输出约定](/zh/testing/agents/output-contract) 的 `--out-dir` 产物。部署后自动触发回放、流水线门禁的完整示例见 [Webhook 与 CI/CD](/zh/testing/webhook-and-ci)。

## 下一步

回放跑完有失败的用例 → **[审查差异](/zh/testing/review-diffs-in-the-web-ui)**：看懂它们，把噪声清掉。
