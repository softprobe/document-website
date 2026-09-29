# Contributing to document-website

## Where to edit (canonical paths)

Replay Testing docs live under **`en/testing/`** and **`zh/testing/`**.

| Topic | Edit here |
|-------|-----------|
| Getting started, how it works, capabilities | `{en,zh}/testing/{index,getting-started,how-it-works,core-features-and-performance}.md` |
| Everyday use in the console (recordings, pinned cases, replay, report, diffs, rules, settings) | `{en,zh}/testing/*.md` at the top level |
| Deploy and operate (deployment choice, preparation, All-in-One, Helm, Java agent, data protection, AI diagnosis, maintenance) | `{en,zh}/testing/installation/*.md`, `{en,zh}/testing/java-agent.md`, `{en,zh}/testing/supported-frameworks.md` |
| Pipelines and notifications | `{en,zh}/testing/{webhook-and-ci,notifications}.md`, `{en,zh}/testing/examples/gitops-policies.md` |
| `sp` command line, AI agent contracts, references | `{en,zh}/testing/{agents,commands,reference,examples}/`, `{en,zh}/testing/policy-yaml-guide.md` |
| Business observability (SoftProbe Cloud only) | `{en,zh}/platform/` |
| Agent Evaluation (`en/evaluation/implementer/` is internal, excluded from the build) | `{en,zh}/evaluation/` |

Content for our own implementation engineers (on-site process, compatibility assessment, internal troubleshooting, schedules) does **not** belong on this public site; it lives in the internal field handbook.

Pages written for AI agents and tools (`testing/agents/output-contract`, parts of `testing/commands/`) keep an English body on the zh site, with a Chinese introduction saying so.

## Redirects

Redirects live in [`public/_redirects`](./public/_redirects) (Cloudflare, first match wins). VitePress `rewrites` are not used; `npm run validate:testing-ia` fails if they come back. When you merge or move a page, add an exact rule for its old URL, pointing at the section that now holds the content. See [REDIRECTS.md](./REDIRECTS.md).

## Validation

```bash
npm run validate:testing-ia
```

Run before opening a docs PR. CI should run the same check.

## EN / ZH parity

When you change `en/testing/...`, update the matching `zh/testing/...` path unless the page is intentionally English-only (note why in the PR).

## Screenshots

Take screenshots from the latest v2 console, in the language of the page (`public/img/docs/testing/zh/` for Chinese, `en/` for English). Button and menu names quoted in the text must match the console's i18n strings exactly.
