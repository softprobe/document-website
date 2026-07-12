---
sidebar_label: 对比规则参考
sidebar_position: 3
title: 对比规则参考
description: 每一种对比规则——按路径忽略、白名单路径、依赖类型整类忽略、CEL 规则、解压、值转换、数组匹配、默认值、接口专属 overlay——逐字段说明，覆盖可视化与 YAML 两种编辑器。
---

# 对比规则参考

对比规则决定哪些回放差异**不算数**。指导原则：*配了的不比，没配的严格对比。* 本页把每一种规则细到每个字段。

## 编辑规则的两个位置

| | 全局默认规则 | 应用规则 |
| --- | --- | --- |
| **位置** | 设置 → 对比规则（`/sp/settings/compare-rules`） | 工作台 → 配置 → 对比规则 |
| **作用范围** | 所有应用 | 仅当前应用 |
| **编辑器** | 仅可视化 | **可视化和 YAML**（右上角切换） |
| **覆盖** | 全部规则类型，分六个 tab | 可视化覆盖按路径忽略、CEL 规则、依赖类型整类忽略、接口专属 overlay；其余走 YAML |

每个应用的面板顶部都会显示一个到全局默认的链接（*「N 条全局默认规则，对所有应用生效」*），所以你随时知道还有什么在生效。

<div className="sp-img">
  <img src="/img/docs/replay/compare-rules-panel.png" alt="应用对比规则面板" />
  <p className="sp-caption">应用对比规则面板：头部链接到全局默认，应用级区列出对每个接口生效的规则，接口专属区放 overlay。</p>
</div>


:::info 可视化 vs YAML 覆盖差异
应用**可视化**编辑器覆盖三种最常用的规则——按路径忽略、CEL 规则、依赖类型整类忽略——加上接口专属 overlay。其余类型（白名单路径、解压、值转换、数组匹配、默认值）在 **YAML** 模式里编辑。全局默认页在六个 tab 里暴露全部类型。本页所有内容在 YAML 里都可配。
:::

## 策略结构

每个应用只有一份 `CompareRulePolicy` 文档。它的 `spec` 承载每一个规则维度：

```yaml
apiVersion: softprobe.ai/v1
kind: CompareRulePolicy
metadata:
  name: my-app-compare
  description: my-app 的对比规则
  priority: 100
selector:
  appIds: ["my-app"]        # 全局默认策略改用 matchAll: true
spec:
  excludePaths: []          # 按路径忽略
  includePaths: []          # 白名单路径
  ignoreCategories: []      # 按依赖类型整类忽略
  validations: []           # CEL 规则（必填 key，可为空）
  decompress: []            # 对比前解码
  transforms: []            # 对比前归一化值
  arrays: []                # 数组匹配策略
  defaults: {}              # 时间容忍、忽略的 header
  operationSpecs: []        # 接口专属 overlay
```

顶层 `spec` 对应用里**所有**接口生效。`operationSpecs` 把额外规则叠加到**特定**接口上——见 [接口专属 overlay](#per-endpoint-overlays-operationspecs)。

---

## 按路径忽略（excludePaths）

**按路径忽略一个字段及其下面的一切。** 最常用的规则。列在这里的任何内容，在对比运行前就被剔除——适合时间戳、traceId、随机 token 等易变字段。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| *（每个元素）* | string | — | 一个 JSON Pointer 路径，如 `/data/traceId`。支持 `*`（单层）和 `**`（任意深度）。UI 里输入的点号形态（`data.traceId`）会被归一化为 `/data/traceId`。 |

**可视化：** 全局页的 **按路径忽略（快）** tab。在应用里，往规则表加一条 **path** 行。**YAML：**

```yaml
spec:
  excludePaths:
    - /data/traceId
    - /data/*/updatedAt
    - /response/body/data/**/timestamp
```

---

## 白名单路径（includePaths）

**一个白名单。** 非空时，**只**对比列出的路径，其余全部忽略。留空=对比一切（常态）。极少用——只在你关心一小组固定字段时才用它。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| *（每个元素）* | string | — | 一个 JSON Pointer 路径。`*` 匹配一层，`**` 匹配任意深度。 |

**可视化：** 仅全局页（**包含路径（白名单）** 区）。在应用里，仅 YAML。**YAML：**

```yaml
spec:
  includePaths:
    - /response/body/data/**
```

---

## 依赖类型整类忽略（ignoreCategories） {#ignore-categories-by-dependency-type}

**整类忽略某种下游依赖类型。** 一个*依赖粒度*的粗开关——与字段路径/值规则相互独立。用它一次性丢掉某种依赖（比如 Redis 或某个数据库调用）产生的全部差异。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `operationType` | string | 是 | 依赖类型，如 `Database`、`Redis`、`Dubbo`、`HttpClient`。取值不是固定枚举——下拉由你录制里实际出现的依赖类型动态填充。 |
| `operationName` | string | 否 | 该类型下某个具体依赖。留空=忽略整类。 |

**可视化：** 全局页的 **依赖类型** tab（增删即改即存）。在应用里，加一条 **category** 行——类型和名字输入框从录制到的依赖里自动补全。**YAML：**

```yaml
spec:
  ignoreCategories:
    - operationType: Redis                       # 忽略所有 Redis 差异
    - operationType: Database
      operationName: userDao.selectById          # 只忽略这一个 DB 调用
```

在 trace 视图里，被整类忽略的调用显示一个 **「本类已整类忽略」** chip，而不是逐字段删除线，因为整个调用被一次性挡下了。

---

## CEL 规则（validations）

**用一个条件判定来忽略差异。** 对比跑完后，每一处差异都用一个 [CEL](https://github.com/google/cel-spec) 表达式检验；命中就丢弃该差异。最灵活的规则类型——当路径或字段名匹配不够用时用它（例如「忽略任何录制值和回放值都是时间戳的字段」）。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `expression` | string | 是 | 一个返回布尔的 CEL 表达式。对某处差异求值为 true 时，该差异被丢弃。 |
| `action` | string | 是 | 目前恒为 `DROP`（丢弃命中的差异）。 |
| `enabled` | boolean | 是 | 规则是否启用。 |
| `name` | string | 否 | 规则的可读名字。 |
| `priority` | number | 否 | 求值优先级。 |
| `message` | string | 否 | 说明该规则的备注。 |

**表达式里可用的变量：**

| 变量 | 类型 | 含义 |
| --- | --- | --- |
| `path` | string | 点号形态的完整字段路径。 |
| `pointer` | string | JSON Pointer 形态的字段路径。 |
| `fieldName` | string | 叶子字段名。 |
| `category` | string | 依赖类型。 |
| `left` | string | 录制值。 |
| `right` | string | 回放值。 |
| `time_tolerance_ms` | int64 | 配置的 [时间容忍度](#defaults)，默认 `60000`。 |

**辅助函数：** `isUUID`、`isIP`、`isTimestamp`、`toTimestamp`、`toNumber`，以及 CEL 标准库、strings、math。

**可视化：** 全局页的 **按条件忽略（CEL）** tab（带模板选择和「可用函数」参考）。在应用里，加一条 **CEL** 行。两处都以 `action: DROP`、`enabled: true` 提交。**YAML：**

```yaml
spec:
  validations:
    - name: ignore-timestamps
      expression: 'isTimestamp(left) && isTimestamp(right)'
      action: DROP
      enabled: true
    - name: ignore-generated-ids
      expression: 'fieldName == "requestId" && isUUID(right)'
      action: DROP
      enabled: true
```

---

## 解压（decompress）

**对比前解码编码字段。** 当一个字段存的是 base64 或 gzip 编码的 JSON 时，先解码，让对比看到结构化数据而不是一坨看不懂的编码串（并报出有意义的差异，而不是「这两个编码串不一样」）。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `path` | string | 是 | 要解码的字段路径。 |
| `codec` | string | 是 | `base64+json`、`gzip+base64+json`、`json` 三者之一。 |

**可视化：** 仅全局页（**解压配置** tab）。在应用里，仅 YAML。**YAML：**

```yaml
spec:
  decompress:
    - path: /response/body/data/payload
      codec: gzip+base64+json
```

---

## 值转换（transforms）

**对比前归一化一个值。** 对字段值跑一个 CEL 表达式来消除噪声——例如给浮点四舍五入，让精度差异不再登记。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `path` | string | 是 | 目标字段路径。 |
| `expression` | string | 是 | 一个 CEL 表达式；变量 `value` 是该字段的原始值。 |

**可视化：** 仅全局页（**值转换** tab）。在应用里，仅 YAML。**YAML：**

```yaml
spec:
  transforms:
    - path: /response/body/data/orders/*/total
      expression: math.round(value * 100) / 100
```

---

## 数组匹配（arrays）

**顺序不稳定时匹配数组元素。** 默认数组按索引比。当元素顺序在录制和回放之间会变时，按索引比会产生假的「缺失/新增元素」差异。配一个匹配策略，把数组当集合来比。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `path` | string | 是 | 数组路径。 |
| `strategy` | string | 否 | `BY_INDEX`（默认）、`BY_KEY`（按主键字段配对）、`BY_LCS`（最长公共子序列）。 |
| `keys` | string[] | 否 | `BY_KEY` 用的主键字段。UI 里逗号分隔输入。 |
| `references` | object[] | 否 | 外键配对——见下。 |

`references` 里每个条目把一个元素字段关联到另一个数组：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `field` | string | 本数组元素里当外键的字段。 |
| `target` | string | 目标数组的路径。 |
| `targetKey` | string | 目标数组里用来配对的主键字段。 |

**可视化：** 仅全局页（**数组匹配** tab）；`keys` 仅在策略为 `BY_KEY` 时可用。`references` 字段在两个可视化编辑器里都不暴露——在 YAML 或用 diff 里的「声明外键」快捷动作配。在应用里，仅 YAML。**YAML：**

```yaml
spec:
  arrays:
    - path: /response/body/data/orders
      strategy: BY_KEY
      keys: [orderId]
    - path: /data/items
      strategy: BY_KEY
      references:
        - field: orderId          # items[].orderId 是外键
          target: /data/orders     # 指向 orders 数组
          targetKey: id            # 用 orders[].id 配对
```

---

## 默认值（defaults） {#defaults}

**对比的全局默认。**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `timeToleranceMs` | number | 否 | 时间容忍度（毫秒）。两个时间值差异在此窗口内不算差异。以 `time_tolerance_ms` 暴露给 CEL 规则（默认 `60000`）。 |
| `ignoreHeaderPatterns` | string[] | 是 | 要忽略的 header **名字** 的 glob 模式（按名字不按值）。新建应用策略默认 `["sp-*", "x-sp-*"]`，用于屏蔽 SoftProbe 自己注入的 header。 |

**可视化：** 两个可视化编辑器都不暴露——在 YAML 里编，或用 diff 里的快捷动作设时间容忍度。**YAML：**

```yaml
spec:
  defaults:
    timeToleranceMs: 60000
    ignoreHeaderPatterns: ["sp-*", "x-sp-*", "date", "request-id"]
```

---

## 接口专属 overlay（operationSpecs） {#per-endpoint-overlays-operationspecs}

**只对特定接口叠加额外规则。** 顶层 `spec` 对每个接口生效；overlay 把额外规则叠加到它匹配的接口上。当请求命中一个被匹配的接口时，顶层 spec 作基底，命中的 overlay 规则叠加在上（list 字段合并，标量字段覆盖）。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `operationNames` | string[] | 否 | 精确匹配的接口名。 |
| `operationNamePatterns` | string[] | 否 | glob 匹配接口名。 |
| `spec` | object | 是 | 只对匹配接口生效的规则。结构与顶层 `spec` 相同，**但**不能再嵌套 `operationSpecs`（overlay 只有一层深）。 |

**可视化：** 仅应用面板，在 **接口专属** 区——每组有自己的一份规则表（按路径忽略、CEL 规则、依赖类型整类忽略）。填精确名和/或 glob 模式（逗号或换行分隔）。**YAML：**

```yaml
spec:
  excludePaths: ["/data/serverIp"]          # 对每个接口生效
  operationSpecs:
    - operationNames: ["/api/order/list"]
      spec:
        excludePaths: ["/data/recommendList"]
    - operationNamePatterns: ["/api/report/**"]
      spec:
        validations:
          - expression: 'fieldName == "cost"'
            action: DROP
            enabled: true
```

:::note 接口作用域放 operationSpecs，不放 selector
`selector` 也有 `operationNames` / `operationNamePatterns` 字段，但它们在对比规则策略上**不允许填**——接口作用域一律走 `operationSpecs`。见 [作用域](#scope-selector)。
:::

---

## 作用域（selector） {#scope-selector}

`selector` 决定策略作用于哪些应用。你通常不直接编辑它——入口会替你设好（全局页用 `matchAll: true`；应用面板把 `appIds` 固定为当前应用）。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `matchAll` | boolean | `true` = 全局默认策略，对所有应用生效。 |
| `appIds` | string[] | 本策略作用的应用 ID。 |
| `appIdPattern` | string | 应用 ID 的 glob。 |
| `excludeAppIds` | string[] | 要排除的应用 ID。 |
| `envTags` | object | tag key → 允许值；fail-closed。 |
| `operationNames` / `operationNamePatterns` | string[] | 对比规则策略上**不允许**——用 `operationSpecs`。 |

`metadata.priority` 给重叠的策略排序（应用策略默认 `100`，全局默认为 `0`）。

---

## diff 里来的快捷规则

[trace 视图](/replay/trace-view#ignoring-a-field) 里的忽略动作写进的正是这些维度。知道这个映射，日后你在参考里看到一条规则、想知道它从哪来时会有帮助：

| diff 动作 | 写进 |
| --- | --- |
| 忽略此字段的差异 | `excludePaths`（按完整路径） |
| 忽略所有 "`{name}`" 字段 | `validations`（一条匹配该叶子名的 CEL 规则） |
| 设为数组主键 | `arrays` 且 `strategy: BY_KEY` |
| 声明外键 | `arrays[].references` |
| （快捷时间容忍度） | `defaults.timeToleranceMs` |

当动作作用于某接口时，规则落进匹配的 `operationSpecs` overlay；作用于整个应用时，落进顶层 `spec`。

## 字段总表

| 维度 | `spec` key | 元素字段 | 可视化编辑器 |
| --- | --- | --- | --- |
| 按路径忽略 | `excludePaths` | JSON Pointer 字符串 | 全局 + 应用 |
| 白名单路径 | `includePaths` | JSON Pointer 字符串 | 仅全局 |
| 依赖类型整类忽略 | `ignoreCategories` | `operationType`（必）、`operationName` | 全局 + 应用 |
| CEL 规则 | `validations` | `expression`（必）、`action`（必）、`enabled`（必）、`name`、`priority`、`message` | 全局 + 应用 |
| 解压 | `decompress` | `path`（必）、`codec`（必） | 仅全局 |
| 值转换 | `transforms` | `path`（必）、`expression`（必） | 仅全局 |
| 数组匹配 | `arrays` | `path`（必）、`strategy`、`keys`、`references` | 仅全局（不含 `references`） |
| 默认值 | `defaults` | `timeToleranceMs`、`ignoreHeaderPatterns`（必） | 仅 YAML / 快捷动作 |
| 接口专属 overlay | `operationSpecs` | `operationNames`、`operationNamePatterns`、`spec`（必） | 仅应用 |
