# Policies and the CLI

SoftProbe server configuration for recording, mocking, and comparison is **declarative YAML** managed through `sp policy` (v1).

## Policy kinds

| Kind | CLI | Server module |
|------|-----|---------------|
| `RecordingPolicy` | `sp policy recording` | `RecordingPolicyService` |
| `MockPolicy` | `sp policy mock` | `MockPolicyService` |
| `CompareRulePolicy` | `sp policy compare` | `CompareRulesService` |

## Schema and examples

Full authoring guide (merge rules, selectors, pipeline):

**[策略 YAML 指南](/zh/testing/policy-yaml-guide)**

Example files ship in `sp-policy-rules/src/main/resources/examples/`.

## Agent workflow

```bash
# Always validate before apply
sp policy recording validate -f recording.yaml --json
sp policy recording apply -f recording.yaml --json
```

CI should fail on `valid: false` or non-zero exit.

## GitOps

```bash
sp policy recording export prod-policy-id -o policies/recording-prod.yaml
git commit -m "chore: sync recording policy"
```

See [GitOps policies](/en/testing/examples/gitops-policies.md).

## Relationship to legacy config

`sp config legacy schedule` and Mongo `ServiceCollectConfiguration` are **not** the source of truth after policy-rules migration. Use `sp policy recording` for operation include/exclude that affects both agent and replay scope.

## Commands

- [sp policy](/en/testing/commands/policy.md)
