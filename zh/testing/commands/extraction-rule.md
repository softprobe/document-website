---
title: sp extraction-rule：业务字段提取规则
---

# sp extraction-rule：业务字段提取规则

**AI 代理何时使用：** 为 `sp trace find` 配置或预览业务字段提取规则。

## 子命令 {#subcommands}

| 子命令 | 说明 |
|------------|-------------|
| `list --app <id>` | 应用的提取规则 |
| `apply -f rules.yaml` | PUT 应用规则 |
| `preview -f rules.yaml` | POST 预览 |

## 示例 {#examples}

```bash
sp extraction-rule list --app my-app --json
sp extraction-rule apply --app my-app -f rules.yaml --json
sp extraction-rule preview -f rules.yaml --json
```

### JSON 输出（`list`） {#json-output-list}

```json
{
  "ok": true,
  "command": "extraction-rule list",
  "data": {
    "rules": [
      {
        "ruleName": "orderId",
        "extractorType": "jsonPath",
        "expression": "$.orderId"
      }
    ]
  }
}
```

### JSON 输出（`apply`） {#json-output-apply}

```json
{
  "ok": true,
  "command": "extraction-rule apply",
  "data": {
    "success": true,
    "appId": "my-app"
  }
}
```

### JSON 输出（`preview`） {#json-output-preview}

```json
{
  "ok": true,
  "command": "extraction-rule preview",
  "data": {
    "matches": [
      {
        "rule_index": 0,
        "attr_name": "orderId",
        "values": ["ORD-1234"]
      }
    ],
    "warnings": [],
    "validationErrors": []
  }
}
```

`matches` 与提交的规则按下标一一对应。没有命中的规则，`values` 为空，并带 `miss_reason` 说明原因。`validationErrors` 与 `warnings` 内容相同。

## REST 接口对照 {#rest-mapping}

| 子命令 | 方法 | 路径 |
|------------|--------|------|
| `list` | GET | `/api/applications/{appId}/extraction-rules` |
| `apply` | PUT | `/api/applications/{appId}/extraction-rules` |
| `preview` | POST | `/api/extraction-rules/preview` |
| Agent 拉取 | GET | `/api/agent/extraction-rules`（Agent 用；CLI 很少用） |

## 相关文档 {#related}

- [trace](./trace)
