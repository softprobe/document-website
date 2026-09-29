# sp policy

**When agents use this:** Validate and apply YAML policy changes; in CI, use `gate`.

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

`validate` exits `0` whenever the backend answered, even if the policy is invalid; `ok: true` only means the check ran. Read `data.valid`.

### JSON output (`gate`)

Used in CI/CD pipelines to validate all changed or committed policy files:

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

When a policy file fails validation, `policy gate` exits with code 1. The result is still written to stdout with `ok: true`, including the validation details:

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

Diff local policy file against current server state:

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
    "unchanged": false
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
| `validate` | POST | `/validate` |
| `export` | GET | `/policies/{id}/export` (JSON with a `yaml` field; the CLI writes out the YAML) |
| templates | GET | `/templates`, `/functions` (v2 helpers) |

## Schema

See [CLI policies](/en/testing/policies) and [Policy YAML guide](/en/testing/policy-yaml-guide).

## Related

- [Manage policies in Git](/en/testing/examples/gitops-policies) — including [validation in CI](/en/testing/examples/gitops-policies#ci-validation)
