---
sidebar_label: 总览
sidebar_position: 1
title: 回放对比总览
description: 了解 SoftProbe 如何把回放响应与录制基准逐字段对比，以及「修正单个用例的判定」和「配置一条对比规则」之间的本质区别。
---

# 回放对比总览

回放录制流量时，SoftProbe 会把每个回放响应与录制基准逐字段对比。每个不一致的字段就是一处**差异**；一个用例只要在对比规则跑完后还剩下任何差异，就会被判为**失败**。

大多数差异并不是真正的回归——时间戳、随机 token、traceId 以及其他易变字段每次调用都会变。本章讲清楚如何告诉 SoftProbe 忽略哪些差异，以及贯穿始终的那个关键区别：**修正判定** 还是 **配置对比规则**。

## 对一处差异，你能做的两件事 {#the-two-things-you-can-do-with-a-difference}

让一处差异不再计为差异，恰好有两种方式。它们在界面上看着相似，行为却大不相同——分清哪个是哪个，是用好回放对比的关键。

<div className="row sp-card-grid">
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>修正判定</h3></div>
      <div className="card__body">
        在<strong>某一条具体用例</strong>上接受一处差异。<strong>立即生效</strong>，下次回放这条用例时自然失效。不改动任何配置。
        <br /><br />
        <em>「这一条我看过了，没问题。」</em>
      </div>
    </div>
  </div>
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>配置对比规则</h3></div>
      <div className="card__body">
        为<strong>某个接口或整个应用</strong>配置对比方式。<strong>下次回放才生效</strong>，并持久保存在配置里。
        <br /><br />
        <em>「这个字段每次都变，永远别比它。」</em>
      </div>
    </div>
  </div>
</div>

### 一表对照

| | 修正判定 | 配置对比规则 |
| --- | --- | --- |
| **作用范围** | 仅这一条用例 | 某个接口，或整个应用 |
| **在忽略菜单里** | 「仅此用例」（在**立即生效**组下） | 「仅此接口」/「所有接口」（在**比对规则 · 下次回放生效**组下） |
| **何时生效** | 立即 | 下次回放 |
| **再次回放后** | 失效——新结果从头判定 | 持久——规则继续生效 |
| **影响本次回放的其他用例吗** | 不影响 | 除非你重跑或**重新比对**，否则不影响 |
| **存在哪里** | 存在该对比结果行上 | 存在应用的对比规则策略里 |

:::info 这个区分为什么重要
修正判定在你点击的那一刻就改变一条用例的结果。对比规则改的是*配置*——它完全不动当前这次回放，所以本次回放始终自洽（列表、通过率、diff 抽屉不会互相打架）。如果你想让当前回放立刻反映一条新规则，用 **[重新比对](/replay/trace-view#recompare-apply-rules-to-an-existing-run)**——它按当前规则重评本次回放已存的响应，不重放任何流量。
:::

## 重新比对不是回放

有两个操作会重新评估一次回放，很容易混淆：

- **回放（Replay）** 会把录制流量重新发到目标环境并记录新响应，会真正打你的服务。
- **重新比对（Recompare）** 只对上一次回放**已存**的响应，按**当前**对比规则重新判定，绝不接触目标环境——它只重算哪些已存差异还算数。

当你加了或删了一条对比规则、想看它对一次已跑完的回放有什么影响时，就用重新比对。详见 [重新比对](/replay/trace-view#recompare-apply-rules-to-an-existing-run)。

## 接下来看哪里

<div className="row sp-card-grid">
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>Trace 视图</h3></div>
      <div className="card__body">
        在 diff 抽屉里读懂差异、忽略字段、标记用例通过、重新比对一次回放、查看已忽略的字段。
        <br /><br />
        <a href="/replay/trace-view">打开 trace 视图指南 →</a>
      </div>
    </div>
  </div>
  <div className="col col--6">
    <div className="card">
      <div className="card__header"><h3>对比规则参考</h3></div>
      <div className="card__body">
        每一种规则——按路径忽略、依赖类型整类忽略、CEL 规则、数组匹配、值转换等——细到每个字段，覆盖可视化与 YAML 两种编辑器。
        <br /><br />
        <a href="/replay/compare-rules">打开对比规则参考 →</a>
      </div>
    </div>
  </div>
</div>
