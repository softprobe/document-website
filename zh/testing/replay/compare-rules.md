---
title: 对比规则参考
description: 配置哪些回放差异不算数——在可视化编辑器里逐字段设置每一种规则，配截图。
---

# 对比规则参考

对比规则决定哪些回放差异**不算数**。原则很简单：*配了的就跳过，没配的严格对比。*

你在**可视化编辑器**里配置它们——选一种规则、填一两个字段、点添加。本页按你在 UI 里配置的方式，走一遍每一种规则。（另有 YAML 视图供自动化使用，在文末汇总。）

## 在哪里配置规则

有两个位置，对应两种作用范围：

| | 全局默认规则 | 应用规则 |
| --- | --- | --- |
| **从哪打开** | 设置 → 对比规则 | 工作台 → 配置 → 对比规则 |
| **作用于** | 每个应用 | 仅当前应用 |
| **规则类型** | 全部类型，分六个 tab | 三种常用类型加接口专属 overlay；其余走 YAML 视图 |

不管你打开哪个，应用面板顶部都有一个到全局默认的链接，所以你随时看得到还有什么在生效。

<div class="sp-img">
  <img src="/img/docs/replay/compare-rules-panel.png" alt="应用对比规则面板" />
  <p class="sp-caption">应用的对比规则面板：头部链接到全局默认；应用级区列出对每个接口生效的规则；接口专属区放 overlay。</p>
</div>

全局页把规则类型分成六个 tab——每种一个，对应下面各节：

<div class="sp-img">
  <img src="/img/docs/replay/rules-global-tabs.png" alt="全局对比规则页的六个规则 tab" />
  <p class="sp-caption">全局对比规则页的六个规则 tab。</p>
</div>

---

## 按路径忽略一个字段

**最常用的规则——不再对比某个字段。** 适合易变字段：时间戳、traceId、随机 token。这个字段及其下面的一切都会从对比里剔除。

**怎么加：** 打开 **按路径忽略** tab，在 **忽略字段（回放时不比对）** 里填字段路径，点 **添加**。

<div class="sp-img">
  <img src="/img/docs/replay/rule-exclude-path.png" alt="路径 tab，含白名单和忽略两个输入框" />
  <p class="sp-caption">路径 tab。下面的「忽略字段」是常用的；上面的输入框是白名单（见下）。</p>
</div>

**填什么：** 一个字段路径。`data.traceId`（点号形态）和 `/data/traceId`（JSON Pointer）都行——点号形态会自动归一化。用 `*` 匹配一层、`**` 匹配任意深度，如 `/data/*/updatedAt` 或 `/response/body/data/**/timestamp`。

::: tip 白名单输入框（极少用）
同一个 tab 上面有一个 **包含路径（白名单）** 输入框。往这里加东西后，**只**对比这些路径、其余全忽略——和忽略列表相反。留空（常态）=对比一切。只在你关心一小组固定字段时才用它。
:::

---

## 整类忽略某种依赖 {#ignore-categories-by-dependency-type}

**一个粗开关——丢掉某种下游调用的全部差异。** 例如忽略所有 Redis 差异，或某个数据库查询的全部差异。与字段级规则相互独立。

**怎么加：** 打开 **依赖类型** tab。填 **类型**（如 `Redis`、`Database`、`Dubbo`、`HttpClient`），可选再填某个具体依赖 **名字**。名字留空=忽略整类。增删即改即存。

<div class="sp-img">
  <img src="/img/docs/replay/rule-ignore-category.png" alt="依赖类型 tab" />
  <p class="sp-caption">依赖类型 tab。在应用面板里，类型和名字输入框从你录制里实际出现的依赖自动补全。</p>
</div>

**填什么：**

| 字段 | 必填 | 填什么 |
| --- | --- | --- |
| 类型 | 是 | 依赖类型。在应用里从你的录制自动补全。 |
| 名字 | 否 | 该类型下的某个具体依赖。留空=整类。 |

在回放里，被这样忽略的调用显示一个 **「本类已整类忽略」** chip，而不是逐字段删除线——整个调用被一次性挡下了。

---

## 按条件忽略（CEL）

**最灵活的规则——条件成立时忽略一处差异。** 当按路径或字段名匹配不够用时用它，例如「忽略任何录制值和回放值都是时间戳的字段」。对比跑完后，每一处差异都用你的条件检验；命中就丢弃。

**怎么加：** 打开 **按条件忽略（CEL）** tab，点 **添加规则**，可选起个名字，写条件。**模板选择** 提供现成条件，**可用函数** 列出你能调用的辅助函数。

<div class="sp-img">
  <img src="/img/docs/replay/rule-cel.png" alt="CEL 规则 tab，含示例规则" />
  <p class="sp-caption">CEL tab，含内置示例规则（忽略 UUID 形态、IP 地址、容忍范围内的时间戳）。每条规则有启停开关，可删除。</p>
</div>

**条件里可用的变量：**

| 变量 | 含义 |
| --- | --- |
| `left` / `right` | 录制值 / 回放值 |
| `path` / `pointer` | 完整字段路径（点号形态 / JSON Pointer 形态） |
| `fieldName` | 叶子字段名 |
| `category` | 依赖类型 |
| `time_tolerance_ms` | 配置的时间容忍度（默认 `60000`） |

**辅助函数：** `isUUID`、`isIP`、`isTimestamp`、`toTimestamp`、`toNumber`，以及标准 CEL、strings、math 库。

示例（都有对应模板）：

- 忽略两侧都是时间戳的值：`isTimestamp(left) && isTimestamp(right)`
- 忽略生成的 ID：`fieldName == "requestId" && isUUID(right)`
- 跳过数据库调用的原始 SQL body：`category == "DATABASE" && fieldName == "body"`

---

## 对比前归一化一个值

**四舍五入或重塑一个值，让噪声不登记。** 例如给浮点四舍五入，让精度差异不算差异。值在对比看到之前先被转换。

**怎么加：** 打开 **值转换** tab，填字段 **路径** 和一个作用于值的 CEL **表达式**（变量 `value` 是该字段原始值），点 **添加转换规则**。

<div class="sp-img">
  <img src="/img/docs/replay/rule-transform.png" alt="值转换 tab" />
  <p class="sp-caption">值转换 tab：一个路径输入框和一个 CEL 表达式输入框，<code>value</code> 是该字段的原始值。</p>
</div>

示例——四舍五入到两位小数：路径 `/response/body/data/orders/*/total`，表达式 `math.round(value * 100) / 100`。

---

## 对比前解码一个编码字段

**解码 base64/gzip 的 JSON，让对比看到真实数据。** 当一个字段存的是一坨编码 blob 时，先解码——否则对比只会报「这两个编码串不一样」，而不是里面真正的差异。

**怎么加：** 打开 **解压配置** tab，填字段 **路径**，选 **编码格式**。

<div class="sp-img">
  <img src="/img/docs/replay/rule-decompress.png" alt="解压配置 tab" />
  <p class="sp-caption">解压配置 tab：一个路径输入框和一个编码格式下拉。</p>
</div>

**编码格式选项：** `Base64 + JSON`、`Gzip + Base64 + JSON`、`Plain JSON`。

---

## 顺序会变时匹配数组元素

**把无序数组当集合比，而不是按位置比。** 默认数组按索引比——当元素顺序在录制和回放之间会变时，会产生假的「缺失/新增元素」差异。改配一个匹配策略。

**怎么加：** 打开 **数组匹配** tab，填数组 **路径**，选 **策略**，（对「按主键」）填 **主键字段**。点 **添加数组配置**。

<div class="sp-img">
  <img src="/img/docs/replay/rule-arrays.png" alt="数组匹配 tab" />
  <p class="sp-caption">数组匹配 tab：一个路径输入框、一个策略下拉，以及（对「按主键」）一个逗号分隔的主键字段输入框。</p>
</div>

**策略选项：**

| 策略 | 什么时候用 |
| --- | --- |
| 按索引 | 默认——逐位置对比。 |
| 按主键 | 按一个主键字段配对元素（填主键，如 `orderId`）。 |
| LCS 算法 | 最长公共子序列——没有主键时的尽力对齐。 |

::: tip 外键
数组还能声明一个到另一个数组的 **外键**（让嵌套引用对齐）。这个通过 diff 里的「声明外键」快捷动作、或在 YAML 视图里配——没有专门的可视化控件。
:::

---

## 只对特定接口叠加规则

**给某些接口叠加额外规则。** 上面的规则对应用里每个接口生效。当你只需要对某些接口的规则时，加一个 **接口专属** 组——顶层规则仍作基底，这个组的规则叠加在它匹配的接口上。

**怎么加：** 在应用面板的 **接口专属** 区，点 **添加接口规则**，填要匹配的接口——**精确名**（逗号或换行分隔）和/或像 `/api/order/*` 的 **glob 模式**——然后填这个组自己的规则表（路径、CEL、依赖类型规则，和顶层一样）。

**填什么：**

| 字段 | 填什么 |
| --- | --- |
| 精确匹配 | 接口名，如 `/api/order/list, /api/order/detail` |
| Glob 匹配 | 接口模式，如 `/api/order/*` |
| 规则 | 只对这些接口生效的规则 |

---

## 时间容忍度和忽略的 header

有两项设置在策略默认里，不在 tab 里：

- **时间容忍度**——两个时间值在这么多毫秒内不算差异（默认 `60000`）。也可以用 diff 里的快捷动作设。
- **忽略的 header**——要跳过的 header **名字**（按名字不按值），glob 模式。新应用默认 `sp-*` 和 `x-sp-*`，用于屏蔽 Softprobe 自己的 header。

这两项在 YAML 视图里编（时间容忍度也可用 diff 快捷动作）。

---

## diff 里的快捷规则去了哪

当你[在回放里忽略一个字段](/zh/testing/replay/handle-failed-run#ignore-a-field)时，它会写进上面某种规则：

| diff 动作 | 变成 |
| --- | --- |
| 忽略此字段的差异 | 一条 **按路径忽略** 规则 |
| 忽略所有 "`{name}`" 字段 | 一条匹配该字段名的 **CEL** 规则 |
| 设为数组主键 | 一条 **数组** 规则（按主键） |
| 声明外键 | 一个数组 **外键** |

作用于某接口时落进接口专属组，作用于整个应用时落进顶层。

---

## YAML 视图（给自动化）

上面每种规则都对应 `CompareRulePolicy` 文档里的一个字段，应用面板能把它展示和编辑成 YAML。这主要给自动化、以及用 AI 生成规则用——日常还是可视化编辑器更友好。映射关系：

| 规则类型 | `spec` 下的 YAML key | 关键字段 |
| --- | --- | --- |
| 按路径忽略 | `excludePaths` | 路径字符串列表 |
| 白名单 | `includePaths` | 路径字符串列表 |
| 依赖类型 | `ignoreCategories` | `operationType`、`operationName` |
| CEL | `validations` | `expression`、`action: DROP`、`enabled` |
| 值转换 | `transforms` | `path`、`expression` |
| 解压 | `decompress` | `path`、`codec` |
| 数组匹配 | `arrays` | `path`、`strategy`、`keys`、`references` |
| 时间容忍度 / header | `defaults` | `timeToleranceMs`、`ignoreHeaderPatterns` |
| 接口专属 | `operationSpecs` | `operationNames`、`operationNamePatterns`、`spec` |

一个精简示例：

```yaml
spec:
  excludePaths: ["/data/traceId", "/data/*/updatedAt"]
  ignoreCategories:
    - operationType: Redis
  validations:
    - expression: 'isTimestamp(left) && isTimestamp(right)'
      action: DROP
      enabled: true
  operationSpecs:
    - operationNames: ["/api/order/list"]
      spec:
        excludePaths: ["/data/recommendList"]
```
