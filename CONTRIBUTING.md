# Contributing to document-website

## Where to edit (canonical paths)

User-facing **`sp`** install, setup, lifecycle, commands, and automation docs live under **`en/testing/`** and **`zh/testing/`** only.

| Topic | Edit here |
|-------|-----------|
| Install sp-backend (server) / setup / config / code / doctor / upgrade / agent | `{en,zh}/testing/installation/*.md` (setup is a section on client `index.md`) |
| Command reference | `{en,zh}/testing/commands/*.md` |
| AI agent contracts (output, versioning, concepts) | `{en,zh}/testing/agents/*.md` |
| Examples / reference / policies | `{en,zh}/testing/{examples,reference,policies}/` |
| Platform / Istio / K8s mesh ops | `{en,zh}/platform/deployment/` |
| Agent Evaluation (suites, evaluators, gates, spcode eval guides) | `en/evaluation/` (English-only for now) |

**Do not** add feature content under `{en,zh}/cli/` — those files are **redirect stubs** for legacy URLs. VitePress `rewrites` map `/en/cli/*` bookmarks to `testing/*` sources.

Normative IA contract: [`specs/010-sp-facade/contracts/docs-ia.md`](../specs/010-sp-facade/contracts/docs-ia.md) in the workspace `dev` repo.

## Validation

```bash
npm run validate:testing-ia
```

Run before opening a docs PR. CI should run the same check.

## EN / ZH parity

When you change `en/testing/...`, update the matching `zh/testing/...` path unless the page is intentionally English-only (note why in the PR).

## Preview URLs

Check the **Testing** sidebar path, e.g. `/en/testing/installation/` — not `/en/cli/commands/setup`.

## Migration script

One-time bulk move (already applied on `v2`):

```bash
node scripts/complete-cli-to-testing-migration.mjs
```
