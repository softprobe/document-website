---
title: 在 Web UI 里配对比规则
---

# 在 Web UI 里配对比规则

对比规则决定哪些回放差异**不算数**。原则：*配了的就跳过，没配的严格对比。*

本页讲在**可视化编辑器**里配规则——选一种规则、填一两个字段、点添加。同样的规则也能用 YAML 写（见 [策略 YAML 指南](/zh/testing/policy-yaml-guide)）；日常还是可视化编辑器更友好。

## 在哪里配置规则

有两个位置，对应两种作用范围：

| | 全局默认规则 | 应用规则 |
|---|---|---|
| 从哪打开 | 设置 → 对比规则 | 工作台 → 配置 → 对比规则 |
| 作用于 | 每个应用 | 仅当前应用 |
| 规则类型 | 全部类型，分六个 tab | 三种常用类型加接口专属 overlay；其余走 YAML |

应用面板顶部会链接到全局默认，所以你随时看得到还有什么在生效。

![应用对比规则面板](/img/docs/replay/compare-rules-panel.png)

全局页把规则类型分成六个 tab——每种一个，对应下面各节。

![六个规则 tab](/img/docs/replay/rules-global-tabs.png)

## 按路径忽略一个字段

**最常用的规则——不再对比某个字段。** 适合易变字段：时间戳、traceId、随机 token。这个字段及其下面的一切都会从对比里剔除。

**怎么加：** 打开 **按路径忽略** tab，在 **忽略字段** 里填字段路径，点 **添加**。

![路径 tab](/img/docs/replay/rule-exclude-path.png)

**填什么：** 一个字段路径。`data.traceId`（点号形态）和 `/data/traceId`（JSON Pointer）都行。用 `*` 匹配一层、`**` 匹配任意深度，如 `/data/*/updatedAt`。

::: tip 白名单输入框（极少用）
同一个 tab 上面有一个 **包含路径（白名单）** 输入框。往这里加东西后，**只**对比这些路径、其余全忽略——和忽略列表相反。留空（常态）=对比一切。
:::

## 整类忽略某种依赖

**一个粗开关——丢掉某种下游调用的全部差异。** 例如忽略所有 Redis 差异，或某个数据库查询的全部差异。

**怎么加：** 打开 **依赖类型** tab。填 **类型**（如 `Redis`、`Database`、`Dubbo`、`HttpClient`），可选再填某个具体依赖 **名字**。名字留空=忽略整类。

![依赖类型 tab](/img/docs/replay/rule-ignore-category.png)

在回放里，被这样忽略的调用显示一个 **「本类已整类忽略」** chip，而不是逐字段删除线——整个调用被一次性挡下了。

## 按条件忽略（CEL）

**最灵活的规则——条件成立时忽略一处差异。** 当按路径或字段名匹配不够用时用它，例如「忽略任何录制值和回放值都是时间戳的字段」。对比跑完后，每一处差异都用你的条件检验；命中就丢弃。

**怎么加：** 打开 **按条件忽略（CEL）** tab，点 **添加规则**，可选起个名字，写条件。模板选择提供现成条件。

![CEL 规则 tab，含示例规则](/img/docs/replay/rule-cel.png)

可用变量：`left` / `right`（录制值 / 回放值）、`path` / `pointer`（字段路径）、`fieldName`、`category`、`time_tolerance_ms`。辅助函数：`isUUID`、`isIP`、`isTimestamp`、`toTimestamp`、`toNumber`。

示例：

- 两侧都是时间戳：`isTimestamp(left) && isTimestamp(right)`
- 一个生成的 ID：`fieldName == "requestId" && isUUID(right)`

## 对比前归一化一个值

**四舍五入或重塑一个值，让噪声不登记**——例如给浮点四舍五入，让精度差异不算差异。

**怎么加：** 打开 **值转换** tab，填字段 **路径** 和一个作用于值的 CEL **表达式**（`value` 是该字段原始值），点 **添加转换规则**。

![值转换 tab](/img/docs/replay/rule-transform.png)

示例——四舍五入到两位小数：路径 `/data/orders/*/total`，表达式 `math.round(value * 100) / 100`。

## 对比前解码一个编码字段

**解码 base64/gzip 的 JSON，让对比看到真实数据**，而不是报「这两个编码串不一样」。

**怎么加：** 打开 **解压配置** tab，填字段 **路径**，选 **编码格式**（`Base64 + JSON`、`Gzip + Base64 + JSON`、`Plain JSON`）。

![解压配置 tab](/img/docs/replay/rule-decompress.png)

## 顺序会变时匹配数组元素

**把无序数组当集合比，而不是按位置比。** 默认数组按索引比——当元素顺序在录制和回放之间会变时，会产生假的「缺失/新增元素」差异。

**怎么加：** 打开 **数组匹配** tab，填数组 **路径**，选 **策略**，（对「按主键」）填 **主键字段**。点 **添加数组配置**。

![数组匹配 tab](/img/docs/replay/rule-arrays.png)

| 策略 | 什么时候用 |
|---|---|
| 按索引 | 默认——逐位置对比。 |
| 按主键 | 按一个主键字段配对元素（填主键，如 `orderId`）。 |
| LCS 算法 | 最长公共子序列——没有主键时的尽力对齐。 |

## 只对特定接口叠加规则

上面的规则对每个接口生效。要只给某些接口加规则，用应用面板的 **接口专属** 区。点 **添加接口规则**，填要匹配的接口——精确名和/或像 `/api/order/*` 的 glob 模式——然后填这个组自己的规则表。

## diff 里的快捷规则去了哪

当你[在回放里忽略一个字段](/zh/testing/review-diffs-in-the-web-ui#ignore-a-field)时，它会写进上面某种规则：

| diff 动作 | 变成 |
|---|---|
| 忽略此字段的差异 | 一条按路径忽略规则 |
| 忽略所有 "…" 字段 | 一条匹配该字段名的 CEL 规则 |
| 设为数组主键 | 一条数组规则（按主键） |

作用于某接口时落进接口专属组，作用于整个应用时落进顶层。

## 相关

- [在 Web UI 里查看差异](/zh/testing/review-diffs-in-the-web-ui) —— 这些规则从哪来
- [策略 YAML 指南](/zh/testing/policy-yaml-guide) —— 每个规则字段，用 YAML
- [Mock 与对比策略](/zh/testing/policies#mock-policy)
