---
title: Manage policies in Git
---

# Manage policies in Git

Keep recording, mock and compare policies as YAML files in a repository: review changes in pull requests, validate them in CI, and apply them only after merge. Field reference: [Policy YAML reference](/en/testing/policy-yaml-guide); command reference: [sp policy](/en/testing/commands/policy).

## Repository layout

```text
policies/
├── recording-staging.yaml
├── recording-prod.yaml
├── mock-staging.yaml
└── compare-global.yaml
```

## Start from what's on the server

```bash
sp policy recording list --json
sp policy recording export <policy-id> -o policies/recording-prod.yaml
```

## One profile per environment

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

## Validate in CI {#ci-validation}

Validate every policy file on each pull request, and apply only on merge to the main branch. `sp policy gate` exits `1` if any file is invalid, which fails the job; the per-file results are still on stdout under `data.files`.

```yaml
jobs:
  policy-validate:
    runs-on: ubuntu-latest
    env:
      SP_API_URL: https://sp-staging.example.com
      SP_TOKEN: ${{ secrets.SP_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - name: Install sp
        run: |
          curl -fsSL -o sp "${SP_DOWNLOAD_URL:-https://install.softprobe.ai/artifacts/sp/latest}/sp-linux-amd64"
          chmod +x sp && sudo mv sp /usr/local/bin/
      - name: Validate all policies
        run: sp policy gate --dir policies/ --json
      - name: Apply policies
        if: github.ref == 'refs/heads/main'
        run: |
          sp policy recording apply -f policies/recording-prod.yaml --json
          sp policy mock apply -f policies/mock-staging.yaml --json
```

The runner must be able to reach the backend. Keep `SP_TOKEN` in the CI secret store, never in the repository.

## Check for drift

Compare a file in the repository with what's on the server:

```bash
sp policy recording diff -f policies/recording-prod.yaml --against <policy-id> --json
```

## When an AI agent edits policies

1. Validate against the staging backend first. With `sp policy gate`, check the exit code; with `sp policy <type> validate`, check `data.valid` — that command exits `0` even when the policy is invalid.
2. Commit the YAML and open a pull request.
3. Never write `SP_TOKEN` into repository files.

Validating policies is not the same as gating a release on replay results; for that, see [Replay after deployment](/en/testing/webhook-and-ci).
