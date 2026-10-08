---
title: CI/CD 发版回归
---

# CI/CD 发版回归

每次发版前都要回归一遍，确认改动没有改坏已有的功能。下面按时间顺序讲一次真实的发版：开发提交代码、流水线触发回放、出结论停下、AI 查原因、群里收到通知、有人处理、修好重发通过。每一站都讲：发生了什么，能看到什么，要注意什么。

<div class="sp-flow-board">
  <!-- 生产环境输入 -->
  <div class="sp-flow-card sp-flow-static" style="grid-area: p;">
    <div class="sp-flow-card-head">
      <span class="sp-flow-card-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
        生产环境
      </span>
    </div>
    <div class="sp-flow-card-sub">录制真实请求</div>
  </div>
  <div class="sp-flow-edge sp-flow-edge-down" style="grid-area: ep;">
    <svg viewBox="0 0 24 24"><path d="M12 4v16M5 13l7 7 7-7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
  <!-- 主线 (Left to Right) -->
  <a href="#deploy" class="sp-flow-card" style="grid-area: n1;">
    <div class="sp-flow-card-head">
      <span class="sp-flow-card-title">① 部署</span>
      <span class="sp-flow-card-time" style="visibility: hidden;" aria-hidden="true">00:00</span>
    </div>
    <div class="sp-flow-card-sub">新版本到测试环境</div>
  </a>
  <div class="sp-flow-edge" style="grid-area: e1;">
    <svg viewBox="0 0 24 24"><path d="M4 12h16M13 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
  <a href="#trigger" class="sp-flow-card" style="grid-area: n2;">
    <div class="sp-flow-card-head">
      <span class="sp-flow-card-title">② 触发</span>
      <span class="sp-flow-card-time">18:06</span>
    </div>
    <div class="sp-flow-card-sub">流水线调用回放</div>
  </a>
  <div class="sp-flow-edge" style="grid-area: e2;">
    <svg viewBox="0 0 24 24"><path d="M4 12h16M13 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
  <a href="#replay" class="sp-flow-card" style="grid-area: n3;">
    <div class="sp-flow-card-head">
      <span class="sp-flow-card-title">③ 回放</span>
      <span class="sp-flow-card-time">18:08</span>
    </div>
    <div class="sp-flow-card-sub">拿生产请求测新版本</div>
  </a>
  <div class="sp-flow-edge" style="grid-area: e3;">
    <svg viewBox="0 0 24 24"><path d="M4 12h16M13 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
  <a href="#verdict" class="sp-flow-card" style="grid-area: n4;">
    <div class="sp-flow-card-head">
      <span class="sp-flow-card-title">④ 结论</span>
      <span class="sp-flow-card-time">18:09</span>
    </div>
    <div class="sp-flow-card-sub">对比新旧结果</div>
  </a>
  <div class="sp-flow-edge sp-flow-edge-success" style="grid-area: e4;">
    <svg viewBox="0 0 24 24"><path d="M4 12h16M13 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
  <a href="#pass" class="sp-flow-card sp-flow-card-success" style="grid-area: n8;">
    <div class="sp-flow-card-head">
      <span class="sp-flow-card-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        ⑧ 发布
      </span>
      <span class="sp-flow-card-time">18:27</span>
    </div>
    <div class="sp-flow-card-sub">没发现问题</div>
  </a>
  <!-- 分支连线 (Down & Up) -->
  <div class="sp-flow-edge sp-flow-edge-down sp-flow-edge-error" style="grid-area: ed;">
    <svg viewBox="0 0 24 24"><path d="M12 4v16M5 13l7 7 7-7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
  <div class="sp-flow-edge sp-flow-edge-up sp-flow-edge-dashed" style="grid-area: eu;">
    <span class="sp-flow-edge-label">修好重发<br>18:19</span>
    <svg viewBox="0 0 24 24"><path d="M12 20V4M5 11l7-7 7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 4"/></svg>
  </div>
  <!-- 支线 (Right to Left 回路) -->
  <a href="#verdict" class="sp-flow-card sp-flow-card-error" style="grid-area: ns;">
    <div class="sp-flow-card-head">
      <span class="sp-flow-card-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
        停下
      </span>
      <span class="sp-flow-card-time">18:09</span>
    </div>
    <div class="sp-flow-card-sub">结果有变化</div>
  </a>
  <div class="sp-flow-edge" style="grid-area: e5;">
    <svg viewBox="0 0 24 24"><path d="M20 12H4M11 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
  <a href="#ai" class="sp-flow-card" style="grid-area: n5;">
    <div class="sp-flow-card-head">
      <span class="sp-flow-card-title">⑤ AI</span>
      <span class="sp-flow-card-time" style="visibility: hidden;" aria-hidden="true">00:00</span>
    </div>
    <div class="sp-flow-card-sub">查出是哪次提交</div>
  </a>
  <div class="sp-flow-edge" style="grid-area: e6;">
    <svg viewBox="0 0 24 24"><path d="M20 12H4M11 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
  <a href="#notify" class="sp-flow-card" style="grid-area: n6;">
    <div class="sp-flow-card-head">
      <span class="sp-flow-card-title">⑥ 通知</span>
      <span class="sp-flow-card-time">18:17</span>
    </div>
    <div class="sp-flow-card-sub">群里收到消息</div>
  </a>
  <div class="sp-flow-edge" style="grid-area: e7;">
    <svg viewBox="0 0 24 24"><path d="M20 12H4M11 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
  <a href="#handle" class="sp-flow-card" style="grid-area: n7;">
    <div class="sp-flow-card-head">
      <span class="sp-flow-card-title">⑦ 处理</span>
      <span class="sp-flow-card-time" style="visibility: hidden;" aria-hidden="true">00:00</span>
    </div>
    <div class="sp-flow-card-sub">修复或放行</div>
  </a>
  <!-- 移动端专属提示 -->
  <div class="sp-flow-mobile-return">
    <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 20V4M5 11l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    修好后重新发版，回到 ①（18:19）
  </div>
</div>

这次发版跑在演示环境：一个 Java 计价服务，有 3 个接口；生产和测试实例在同一台机器上，线上流量由脚本模拟；群机器人换成了本地程序代收，贴出的就是群里会收到的原文。

## 准备工作（只做一次） {#setup}

- 生产环境的服务挂上 Softprobe 的 Agent（随服务启动的探针程序），打上环境标签 `env=prod`，把线上真实的请求和处理结果录下来。见 [接入 Java Agent](/zh/testing/java-agent)。
- 测试环境的服务也挂 Agent、用同一个应用 ID，打上 `env=test`，但不录制：在录制配置里给 `env=test` 设采样率 0。见 [录制配置](/zh/testing/policies#recording)。
- 把每次发版必须测到的接口登记为「主链路接口」。见 [主链路接口](/zh/testing/webhook-and-ci#main-operations)。
- 接入 AI、给应用绑定代码仓库（建议），AI 才能查出差异是哪次提交引起的。见 [配置 AI 诊断与代码仓库](/zh/testing/installation/ai-diagnosis)。
- 在群里加飞书或钉钉机器人。见 [回放结果通知](/zh/testing/notifications)。
- 正式用回归结论拦发布之前，先把线上相同的版本回放到 `CLEAN`（每次都变的字段配成对比规则跳过），再故意改坏一次，确认流水线真的会停。见 [对比规则](/zh/testing/compare-rules-web-ui)。

::: warning 测试环境必须和生产隔离
回放时，数据库、缓存、下游接口的调用默认用录下的结果应答，找不到对应结果时判为失败。但应用可以把个别依赖设成真实调用，少数类型的调用（例如 UMQ 消息发送）找不到录制时也会真的发出去。所以测试环境不能连生产的数据库和下游服务。另外，触发回放的接口没有鉴权，只能让内网的 CI 机器访问。详见 [依赖 Mock](/zh/testing/policies#mock) 和 [准备工作](/zh/testing/webhook-and-ci#before-you-start)。
:::

## ① 开发提交代码，部署到测试环境 {#deploy}

开发提交了 `0026097`「调整会员价计算」：会员价的取整从四舍五入改成向下取整。开发没意识到，这会让应付金额变少。流水线照常构建，把新版本部署到测试环境。

## ② 流水线触发回放 {#trigger}

部署完成后，流水线多了一步：运行 Softprobe 提供的脚本（[完整脚本](/zh/testing/webhook-and-ci#script)，各家 CI 的写法见 [在流水线中使用](/zh/testing/webhook-and-ci#在流水线中使用)）：

```bash
export SP_BACKEND=http://<Softprobe 地址>:8090
export SP_APP_ID=sp-diag-e2e-app                 # 应用 ID
export SP_TARGET=http://<测试环境里新版本的地址>
export SP_CASE_TAGS='{"env":"prod"}'             # 只回放生产录下的请求
export SP_CASE_SOURCE_HOURS=8                    # 回放最近 8 小时的录制
export SP_REVISION=0026097 SP_BRANCH=release/2026.10 SP_PIPELINE_RUN_ID=130
bash ci/softprobe-replay.sh
```

脚本先输出：

```text
已触发回放，planId=6abcdf32e5eb34767296d347
```

**要注意**：只拿生产录下的请求当标准。回放回答的是「新版本和线上比，变没变」，测试环境录下的请求混进来，标准就不纯了。提交、分支、流水线编号会显示在报告和群消息里，一眼看出是哪次发版。

## ③ 回放：拿生产的请求测新版本 {#replay}

Softprobe 把生产环境最近 8 小时录下的 237 个请求，逐个发给测试环境里的新版本。新版本照常执行业务代码；要查数据库、调下游服务时，由录下的结果应答，所以测试环境不用准备数据。1 分 34 秒后，237 个请求全部回放完。

接着对比新版本和线上的返回：3 个接口里 2 个完全一致；`/order/price` 回放了 81 个请求，其中 79 个的应付金额 `payable` 比线上少 1。

## ④ 出结论，流水线停下 {#verdict}

回放结束、AI 降噪（把时间戳这类每次都变的字段排除掉）完成后，结论就定了。脚本输出：

```text
回放结论：NEEDS_ACTION
报告：https://<控制台地址>/sp/workbench/sp-diag-e2e-app/runs/6abcdf32e5eb34767296d347
```

脚本退出码是 1，流水线停下，没有继续发布。从触发到这里，用了 2 分 23 秒。

结论按三类处理：

| 结论 | 意思 | 流水线 |
|---|---|---|
| `CLEAN` | 测了，没发现问题 | 唯一可以自动继续发布的情况 |
| `NEEDS_ACTION`、`REVIEW_ONLY` | 结果有变化，例如接口报错、字段值变了、多了字段 | 停下，由人看报告确认 |
| `LOW_COVERAGE`、`NO_CASES`、`INTERRUPTED`、`ENVIRONMENT_FAILURE` | 这次没测成：覆盖不足、没有可回放的请求、没跑完、大量接口同样报错 | 停下，查清原因重跑 |

**要注意**：只认结论，不看通过率。这次通过率是 66%，但通过率 95% 也可能恰好是下单接口坏了，100% 也可能只测了三个接口。「没测成」同样要停——那正是这次回归什么也没测到。各结论的判定条件见 [根据结论决定是否继续](/zh/testing/webhook-and-ci#decide)。

## ⑤ AI 查原因 {#ai}

流水线不等 AI。停下约 9 分钟后，AI 查完了：79 处差异都由代码改动引起，改动在提交 `0026097`、`PricingService.java` 第 12 行。原因也附上了：标价 1990 打 85 折是 1691.5，四舍五入得 1692，向下取整得 1691。报告里能直接看到改动前后的代码：

![回放报告：1 处差异由代码改动引起，首次出现，定位到提交和代码行](/img/docs/testing/zh/cicd-report.png)

**要注意**：AI 把未通过的用例分成「问题」（代码改动引起）、「原因未查明」和「其他结果」，但它也会判错，所以分析结果不改变结论，放不放行始终由人决定。AI 读的是绑定分支上的代码，不会核对它是不是这次发布的版本，绑定的分支要和发版分支一致。

## ⑥ 群里收到通知 {#notify}

AI 查完后，飞书群和钉钉群同时收到消息。钉钉群收到的原文如下（去掉了链接地址，标题改为加粗）；飞书收到的是内容相同的卡片：

::: info 钉钉群消息
**sp-diag-e2e-app 发版回放：1 处差异由代码改动引起**

**环境**：test  
**流水线**：#130  
**分支**：release/2026.10  
**提交**：0026097

**回放接口**：3 个  
**回放请求**：237 个  
**一致接口**：2 个

**代码改动引起的差异 · 1 处**

· 会员价改为向下取整，应付少 1 元（首次出现）：接口数 1，受影响请求 79/81，示例接口 `/order/price`

未通过的 79 条都由代码改动引起。

**待处理 · 1 个接口**

· 字段值不一致：接口数 1，受影响请求 79/81，示例接口 `/order/price（payable）`

录制时段：prod 环境，9 月 30 日 10:06 至 18:06；回放时间：9 月 30 日 18:06，耗时 1 分 34 秒。  
已按忽略规则排除字段 `quoteId`、`quotedAt`。

查看待处理问题　查看回放结果
:::

标题就是结论。下面依次是这次发版的信息、回放了多少、代码改动引起的差异、待处理的问题，最后是报告入口。「首次出现」表示这处差异是第一次报出来。

**要注意**：群消息只是让人及时知道，可能晚到，也可能发送失败；流水线停不停，以结论为准。只想在有问题时收到，可以给渠道打开「只在失败时发」。

## ⑦ 有人确认、处理 {#handle}

开发打开报告，确认这不是有意的改动：会员价不该变少。于是改回四舍五入。

如果是有意的改动，就在报告里点「标记通过」，再在流水线里人工放行。「标记通过」只对这一次回放有效。

**要注意**：回放比的是「和线上一不一样」，不是「对不对」。线上本来有 bug、新版本修好了，也会报差异，「该不该变」只能由人判断。也不能为了让流水线通过，把金额、状态这类业务字段加进忽略规则——那样以后这个字段怎么变都测不出来了。逐处确认的方法见 [审查差异](/zh/testing/review-diffs-in-the-web-ui)。

## ⑧ 修好后重新发版，通过 {#pass}

18:19，修好的版本重新部署，流水线再次回放生产上录下的 237 个请求。这次 3 个接口全部一致，脚本输出：

```text
回放结论：CLEAN
```

退出码 0，流水线继续发布。群里也收到了通过的消息：

::: info 钉钉群消息
**sp-diag-e2e-app 发版回放：回放的 3 个接口均与录制结果一致**

**环境**：test  
**流水线**：#131  
**分支**：release/2026.10

**回放接口**：3 个  
**回放请求**：237 个  
**一致接口**：3 个

录制时段：prod 环境，9 月 30 日 10:19 至 18:19；回放时间：9 月 30 日 18:19，耗时 1 分 35 秒。  
已按忽略规则排除字段 `quoteId`、`quotedAt`。

查看回放结果
:::

这次回放本身 1 分 35 秒，整个步骤却用了约 8 分钟：没有未通过的请求时，AI 降噪要多等几分钟，确认回放统计都写完了才结束。流水线的超时时间要留出这段余量。

修好的代码和线上一致，结论正是 `CLEAN`——这也说明这套回归在代码没变时不会乱报。

## 日常维护 {#maintenance}

- **定期回头看**：报告里标着「已连续 N 次」的差异、对比规则里忽略的字段，定期再看一眼。有意的改动上线后，线上旧版本录下的请求还在回放范围内时（默认回放最近 24 小时的录制），之后的发版会重复报出同一处差异；忽略规则也会越加越多，时间长了难免混进业务字段。
- **补上低频请求**：只在月底、夜间才有的关键请求，可能不在最近的录制里。把它们另存为「固化用例」（不会随录制过期删除），发版时和最近的录制分别回放、分别看结论。见 [固化用例](/zh/testing/pinned-cases)。

## 落地自检 {#checklist}

| 检查项 | 合格标准 | 去哪做 |
|---|---|---|
| 生产录制打标签 | 生产的请求带 `env=prod` 这类标签 | [接入 Java Agent](/zh/testing/java-agent) |
| 测试环境不录制 | 测试环境的采样率设为 0 | [录制配置](/zh/testing/policies#recording) |
| 回放只用生产的请求 | 触发回放时按标签筛选 | [触发回放](/zh/testing/webhook-and-ci#trigger) |
| 测试环境与生产隔离 | 不连生产的数据库和下游；触发接口只对内网 CI 开放 | [准备工作](/zh/testing/webhook-and-ci#before-you-start) |
| 必测清单 | 必测接口都已登记；低频关键请求已固化 | [主链路接口](/zh/testing/webhook-and-ci#main-operations)、[固化用例](/zh/testing/pinned-cases) |
| 先验证靠得住 | 同一版本回放到 `CLEAN`；故意改坏一次，流水线会停 | [对比规则](/zh/testing/compare-rules-web-ui) |
| 流水线只认结论 | 只有 `CLEAN` 自动继续，没测成也停 | [完整脚本](/zh/testing/webhook-and-ci#script) |
| 有人负责确认 | 谁看报告、谁能人工放行，事先约定好 | [审查差异](/zh/testing/review-diffs-in-the-web-ui) |
| AI（建议） | 模型已接入，绑定的是发版分支 | [配置 AI 诊断与代码仓库](/zh/testing/installation/ai-diagnosis) |
| 通知 | 群机器人测试发送成功 | [回放结果通知](/zh/testing/notifications) |
