# URL redirects

Canonical site: `https://docs.softprobe.ai` (Cloudflare Worker `softprobe-docs`).

All redirects are Cloudflare rules in [`public/_redirects`](./public/_redirects). VitePress `rewrites` are not used (`npm run validate:testing-ia` rejects them). Rules are evaluated top to bottom and the first match wins, so exact rules must come before any wildcard that would also match them. Cloudflare limits the number of rules per file: use `:splat` wildcards for pure prefix moves and exact rules only where the destination differs.

## What is redirected

| Old paths | New paths |
|-----------|-----------|
| `/` | `/en/` (302; the zh site is one click away in the nav) |
| `/auto-testing*`, `/{en,zh}/auto-testing*` (AREX era) | `/{en,zh}/testing/` |
| `/{en,zh}/cli/guide/*` | Listed one by one: each guide page moved to a different Testing page |
| `/{en,zh}/cli/{commands,examples,reference}/*` | `/{en,zh}/testing/{commands,examples,reference}/*` |
| `/{en,zh}/cli/policies/*` | `/{en,zh}/testing/policies` |
| `/guide/*`, `/commands/*`, `/examples/*`, `/reference/*`, `/policies/*` (old CLI docs site) | The English Testing tree |
| `/getting-started/*`, `/deployment/*`, `/configuration/*`, `/production/*`, `/advanced-guides/*`, `/billing/*`, `/support/*` (Docusaurus) | `/en/platform/…` |
| `/cli/*`, `/platform/*`, `/testing/*` | The English tree |
| Pages merged in the 2026-09 restructure (for example `testing/download-java-agent`, `testing/installation/doctor`, `testing/agents/versioning`, `testing/reference/exit-codes`) | The section of the page that now holds their content |
| `/{en,zh}/testing/cicd-best-practice` (2026-09-30, moved to the new Best practices section) | `/{en,zh}/best-practices/release-regression` |

When you merge or move a page, add an exact rule for the old URL of both languages, with a fragment pointing at the right section if there is one.

## Hostnames

Configured in the Cloudflare dashboard, not in this repository:

| Old host | Action |
|----------|--------|
| `document.softprobe.ai` | 301 → `docs.softprobe.ai` |
| `doc.softprobe.ai` | 301 → `docs.softprobe.ai` |
| `softprobe-cli-docs.pages.dev` | 301 → `docs.softprobe.ai` (or keep as preview) |

Hardcoded links in `arex-client-opensource` are updated separately.
