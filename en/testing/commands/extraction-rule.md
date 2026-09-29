# sp extraction-rule

**When agents use this:** Configure or preview business-attribute extraction for `sp trace find`.

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `list --app <id>` | App extraction rules |
| `apply -f rules.yaml` | PUT app rules |
| `preview -f rules.yaml` | POST preview |

## Examples

```bash
sp extraction-rule list --app my-app --json
sp extraction-rule apply --app my-app -f rules.yaml --json
sp extraction-rule preview -f rules.yaml --json
```

### JSON output (`list`)

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

### JSON output (`apply`)

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

### JSON output (`preview`)

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

`matches` lines up 1:1 with the rules you sent (by index). A rule that matched nothing has empty `values` and a `miss_reason`. `validationErrors` carries the same list as `warnings`.

## REST mapping

| Subcommand | Method | Path |
|------------|--------|------|
| `list` | GET | `/api/applications/{appId}/extraction-rules` |
| `apply` | PUT | `/api/applications/{appId}/extraction-rules` |
| `preview` | POST | `/api/extraction-rules/preview` |
| agent pull | GET | `/api/agent/extraction-rules` (agent use; CLI rarely) |

## Related

- [trace](./trace)
