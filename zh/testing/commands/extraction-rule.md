# sp extraction-rule

**When agents use this:** Configure or preview business-attribute extraction for `sp trace find`.

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `list --app <id>` | App extraction rules |
| `apply -f rules.yaml` | PUT app rules |
| `preview -f rules.yaml` | POST preview |

## 示例

```bash
sp extraction-rule list --app my-app --json
sp extraction-rule apply --app my-app -f rules.yaml --json
sp extraction-rule preview -f rules.yaml --json
```

### JSON 输出 (`list`)

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

### JSON 输出 (`apply`)

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

### JSON 输出 (`preview`)

```json
{
  "ok": true,
  "command": "extraction-rule preview",
  "data": {
    "preview": [
      {
        "ruleName": "orderId",
        "extractedValue": "ORD-1234"
      }
    ]
  }
}
```

## REST mapping

| Subcommand | Method | Path |
|------------|--------|------|
| `list` | GET | `/api/applications/{appId}/extraction-rules` |
| `apply` | PUT | `/api/applications/{appId}/extraction-rules` |
| `preview` | POST | `/api/extraction-rules/preview` |
| agent pull | GET | `/api/agent/extraction-rules` (agent use; CLI rarely) |

## Related

- [trace](./trace)
