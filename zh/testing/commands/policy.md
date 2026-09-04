# sp policy

**When agents use this:** Validate and apply YAML policy changes; CI gates on `validate`.

## Synopsis

Manage declarative policies: **recording**, **mock**, **compare**.

## Structure

```text
sp policy <kind> <action>
```

`<kind>`: `recording` | `mock` | `compare`

| Action | Description |
|--------|-------------|
| `list` | List policy documents |
| `get <id>` | Get policy by id |
| `apply` | Create or update (`-f` file or stdin) |
| `delete <id>` | Remove policy |
| `validate` | Validate without save (`-f`) |
| `export <id>` | Write YAML to stdout or `-o` |
| `import` | Import YAML file (`-f`) |
| `diff` | Diff local file vs server export (`-f`, `--against <id>`) |
| `gate` | Validate all YAML files in a directory (CI) |

## Examples

```bash
sp policy recording list --json
sp policy recording validate -f policies/recording-prod.yaml --json
cat policies/recording-prod.yaml | sp policy recording validate -f - --json
sp policy recording apply -f policies/recording-prod.yaml --json
sp policy recording diff -f policies/recording-prod.yaml --against <policy-id> --json
sp policy gate --dir policies/ --json
sp policy gate --changed-only policies/recording-prod.yaml policies/mock-prod.yaml --json
sp policy recording delete <policy-id> --confirm --json
sp policy mock export policy-id-1 -o mock.yaml
sp policy compare get compare-global --json
```

### JSON output (`validate`)

```json
{
  "ok": true,
  "command": "policy recording validate",
  "data": {
    "valid": true,
    "details": {
      "valid": true,
      "errors": [],
      "warnings": []
    }
  }
}
```

### JSON output (`gate`)

用于 CI/CD 流水线中校验全部变更或提交的策略文件：

```json
{
  "ok": true,
  "command": "policy gate",
  "data": {
    "valid": true,
    "files": [
      {
        "path": "policies/recording-prod.yaml",
        "kind": "recording",
        "valid": true
      },
      {
        "path": "policies/mock-prod.yaml",
        "kind": "mock",
        "valid": true
      }
    ]
  }
}
```

当策略文件校验失败时，`policy gate` 退出码为 1，并包含校验错误明细：

```json
{
  "ok": true,
  "command": "policy gate",
  "data": {
    "valid": false,
    "files": [
      {
        "path": "policies/recording-prod.yaml",
        "kind": "recording",
        "valid": false,
        "details": {
          "valid": false,
          "errors": ["unsupported filter key 'invalidField'"]
        }
      }
    ]
  }
}
```

### JSON output (`apply`)

```json
{
  "ok": true,
  "command": "policy recording apply",
  "data": {
    "id": "rec-policy-prod",
    "version": 1,
    "status": "applied"
  }
}
```

### JSON output (`diff`)

对比本地策略文件与服务端当前生效配置：

```json
{
  "ok": true,
  "command": "policy recording diff",
  "data": {
    "against": "rec-policy-prod",
    "file": "policies/recording-prod.yaml",
    "added": ["includeOperations[1]"],
    "changed": ["samplingRate"],
    "removed": [],
    "unchanged": ["excludeOperations"]
  }
}
```

### JSON output (`list`)

```json
{
  "ok": true,
  "command": "policy recording list",
  "data": {
    "policies": {
      "items": [
        {
          "id": "rec-policy-prod",
          "name": "Production Recording",
          "version": 1
        }
      ]
    }
  }
}
```

## REST mapping

### Recording (`/api/recording-policies`)

| Action | Method | Path |
|--------|--------|------|
| `list` | GET | `/policies` |
| `get` | GET | `/policies/{id}` |
| `apply` (JSON) | POST | `/policies` |
| `apply` (YAML) | POST | `/policies/yaml` (`Content-Type: text/yaml`) |
| `delete` | DELETE | `/policies/{id}` |
| `validate` | POST | `/policies/validate` |
| `export` | GET | `/policies/{id}/yaml` |

### Mock (`/api/mock-policies`)

Same path pattern under `/api/mock-policies`.

### Compare (`/api/compare-rules`)

| Action | Method | Path |
|--------|--------|------|
| `list` | GET | `/policies` |
| `get` | GET | `/policies/{id}` |
| `apply` | POST | `/policies` |
| `validate` | POST | `/policies/validate` |
| `export` | GET | `/policies/{id}/yaml` |
| templates | GET | `/templates`, `/functions` (v2 helpers) |

## Schema

见 [CLI 策略索引](/zh/testing/policies) 与 [策略 YAML 指南](/zh/testing/policy-yaml-guide)。

## Related

- [CI policy gate](/zh/testing/examples/ci-policy-gate)
- [GitOps policies](/zh/testing/examples/gitops-policies)
