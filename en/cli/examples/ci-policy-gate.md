# Example: CI policy gate

**Audience:** GitHub Actions / GitLab CI (agents may generate this YAML)

Validate policy files on every pull request; apply only on merge to main.

## GitHub Actions

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
      - name: Validate recording policy
        run: sp policy recording validate -f policies/recording.yaml --json
      - name: Validate mock policy
        run: sp policy mock validate -f policies/mock.yaml --json
```

Exit code non-zero fails the job.

## Apply on deploy (main only)

```yaml
      - name: Apply policies
        if: github.ref == 'refs/heads/main'
        run: |
          sp policy recording apply -f policies/recording.yaml --json
          sp policy mock apply -f policies/mock.yaml --json
```

## Agent-generated pipelines

When an agent edits policy YAML in a repo, it should:

1. Run `validate` locally against staging `SP_API_URL`
2. Commit YAML + open PR
3. Not embed `SP_TOKEN` in repo files

## Related

- [policy](/en/cli/commands/policy.md)
- [GitOps policies](./gitops-policies.md)
