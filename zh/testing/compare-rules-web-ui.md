---
title: 配置对比规则
---

# 配置对比规则

对比规则决定哪些差异**不算数**：配了的跳过，没配的严格对比。在[审查差异](/zh/testing/review-diffs-in-the-web-ui)里逐条处理只管一次；把总在变的字段（时间戳、随机 ID、流水号）配成规则，以后每次回放都不再误报。

本页讲在控制台里配置。同样的规则也可以写成 YAML，放进 Git 管理，见 [策略 YAML 参考](/zh/testing/policy-yaml-guide#comparerulepolicy)。

## 在哪里配置 {#where}

| | 应用规则 | 全局默认规则 |
|---|---|---|
| 从哪里打开 | 「配置 → 对比规则」 | 应用规则页上的「查看全局 →」 |
| 对谁生效 | 当前应用 | 所有应用 |
| 可配的规则 | 按路径忽略、按条件忽略（CEL）、依赖类型，以及只对部分接口生效的「接口专属」规则；其余类型写 YAML | 全部六类，每类一个页签 |

![应用的对比规则](/img/docs/testing/zh/compare-app.png)

应用规则页顶部会显示全局默认规则有几条，点「查看全局 →」可以查看和修改。全局默认规则已经内置了几条常用规则，例如两边都是 UUID、两边都是 IP 地址、两边都是容差内的时间戳时忽略差异。

应用规则点右上角「编辑」修改，改完点「保存」；也可以切到「YAML」直接编辑。全局默认规则页上，「按路径忽略（快）」和「数组匹配」页签添加或修改后要点「保存配置」才会保存，只点「添加」不会生效；「按条件忽略（CEL）」和「依赖类型」添加后立即保存。

![全局默认规则](/img/docs/testing/zh/compare-global.png)

## 按路径忽略字段 {#paths}

最常用：不再对比某个字段。适合时间戳、traceId、随机 token 这类字段；这个字段和它下面的内容都不再参与对比。

在「按路径忽略（快）」页签的「忽略字段（回放时不参与对比）」里填字段路径，点「添加」。路径可以写成 `data.traceId`，也可以写成 JSON Pointer `/data/traceId`；`*` 匹配一层，`**` 匹配任意多层，例如 `/data/*/updatedAt`。

::: tip 包含路径（白名单）
同一页签上还有「包含路径（白名单）」。填了之后，**只**对比这些路径，其余全部忽略，与忽略字段正好相反。一般留空，即全部对比。
:::

![按路径忽略字段](/img/docs/testing/zh/compare-rules.gif)

## 整类忽略某种依赖 {#categories}

粗粒度的开关：某一类下游调用的差异全部不算，例如所有 Redis 调用，或者某一个数据库操作。

在「依赖类型」页签填类型（如 `Redis`、`Database`、`Dubbo`、`HttpClient`），需要时再填具体的依赖名；依赖名留空表示整类忽略。

回放结果里，被整类忽略的调用标着「本类已整类忽略」，不逐字段对比。

![整类忽略某种依赖](/img/docs/testing/zh/rule-ignore-category.gif)

## 按条件忽略（CEL） {#cel}

最灵活：写一个条件，对比出的每一处差异都拿它判断一遍，条件成立就不算。按路径或字段名匹配不够用时用它，例如「两边的值都是时间戳就忽略」。

在「按条件忽略（CEL）」页签点「添加规则」，名称可以不填，写条件表达式；也可以「从模板选择」。点「可用函数」能看到全部函数。

常用变量：`left`、`right`（录制值、回放值），`path`、`pointer`（字段路径），`fieldName`，`category`，`time_tolerance_ms`。常用函数：`isUUID`、`isIP`、`isTimestamp`、`toTimestamp`、`toNumber`。

例如：

- 两边都是时间戳：`isTimestamp(left) && isTimestamp(right)`
- 生成的请求 ID：`fieldName == "requestId" && isUUID(right)`

![添加 CEL 忽略规则](/img/docs/testing/zh/rule-cel.gif)

## 暂不生效的页签 {#not-yet-effective}

<a id="transforms"></a><a id="decompress"></a>

全局默认规则页上还有「值转换」和「解压配置」两个页签，分别用来在对比前归一化数值、解码 Base64 或 Gzip 编码的字段。当前版本里这两类规则保存后不会生效：对比时找不到对应的处理程序，会跳过这些规则、按原值对比。请不要依赖它们。

## 数组元素顺序会变时 {#arrays}

数组默认按下标逐个对比。录制和回放时元素顺序不同，就会报出一堆缺元素、多元素的假差异。

在「数组匹配」页签填数组路径，选策略，点「添加数组配置」：

| 策略 | 什么时候用 |
|---|---|
| 按索引 | 默认，按位置逐个对比 |
| 按主键 | 按主键字段配对元素，填主键，如 `orderId`；顺序变了也能对上 |

写 YAML 时对应 `BY_INDEX`、`BY_KEY`。界面上的「LCS 算法」当前版本不生效，选了等同于按索引。

![配置数组匹配](/img/docs/testing/zh/rule-arrays.gif)

## 只对部分接口生效 {#operation-rules}

上面的规则对应用的所有接口生效。只想对某些接口加规则时，在应用规则的「接口专属」里添加：填要匹配的接口（精确的接口名，或 `/api/order/*` 这样的通配），再配这一组自己的规则。

## 在差异视图里加的规则去了哪 {#from-diff-view}

在[审查差异](/zh/testing/review-diffs-in-the-web-ui#ignore-a-field)时忽略字段，除「仅当前用例」外，都会写成一条对比规则：

| 在差异视图里选 | 写成 |
|---|---|
| 按路径忽略 | 一条按路径忽略的规则 |
| 按字段名忽略（所有名为某个名字的字段） | 一条匹配这个字段名的 CEL 规则 |

范围选「当前接口」或某个依赖调用时，写进「接口专属」；选「整个应用」时，写进应用级规则。

## 下一步 {#next}

在这里配的规则从下次[回放](/zh/testing/replay-and-diff)开始生效。想让已经跑完的回放按新规则判定，再回放一次；只有在回放的差异视图里直接加了或删了规则时，才能当场[重新对比](/zh/testing/review-diffs-in-the-web-ui#recompare)。剩下的失败，就是值得认真看的差异。

用 Git 管理对比规则，见 [用 Git 管理策略](/zh/testing/examples/gitops-policies) 和 [策略 YAML 参考](/zh/testing/policy-yaml-guide#comparerulepolicy)。
