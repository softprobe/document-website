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
    "errors": [],
    "warnings": []
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
