# Example: GitOps policies

**Audience:** Platform engineers and agents maintaining policy repos

## Repository layout

```text
policies/
├── recording-staging.yaml
├── recording-prod.yaml
├── mock-staging.yaml
└── compare-global.yaml
```

## Export from server (bootstrap)

```bash
sp policy recording list --json
sp policy recording export <policy-id> -o policies/recording-prod.yaml
```

## Drift check (agent or CI)

```bash
sp policy recording validate -f policies/recording-prod.yaml --json
# optional v2:
# sp policy recording diff -f policies/recording-prod.yaml --against prod-id
```

## Apply after review

```bash
sp policy recording apply -f policies/recording-prod.yaml --json
```

## Multi-environment profiles

```jsonc
// ~/.config/softprobe/config.jsonc
{
  "profiles": {
    "staging": {
      "api_url": "https://sp-staging.example.com"
    },
    "prod": {
      "api_url": "https://sp.example.com"
    }
  }
}
```

```bash
sp --profile staging policy recording apply -f policies/recording-staging.yaml --json
sp --profile prod policy recording apply -f policies/recording-prod.yaml --json
```

## Related

- [Policy YAML](/en/testing/policies)
- [CI policy gate](./ci-policy-gate)
