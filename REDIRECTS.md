# URL redirects (legacy → v2)

Canonical site: `https://docs.softprobe.ai` (Cloudflare Worker `softprobe-docs`).

VitePress `rewrites` in [`.vitepress/config.ts`](.vitepress/config.ts) handle many legacy paths at build time. Configure **Cloudflare Bulk Redirects** (or Worker rules) for 301s from old hosts.

## Docusaurus platform (document-website / saas-doc)

| Old path | New path |
|----------|----------|
| `/getting-started/:path*` | `/en/platform/getting-started/:path*` |
| `/deployment/:path*` | `/en/platform/deployment/:path*` |
| `/configuration/:path*` | `/en/platform/configuration/:path*` |
| `/production/:path*` | `/en/platform/production/:path*` |
| `/advanced-guides/:path*` | `/en/platform/advanced-guides/:path*` |
| `/billing/:path*` | `/en/platform/billing/:path*` |
| `/support/:path*` | `/en/platform/support/:path*` |
| `/sessify` | `/en/platform/sessify` |
| `/web-sdk` | `/en/platform/sessify` |
| `/zh/getting-started/:path*` | `/zh/platform/getting-started/:path*` |
| `/zh/deployment/:path*` | `/zh/platform/deployment/:path*` |
| (same pattern for other `/zh/*` platform slugs) | `/zh/platform/...` |

## CLI docs (softprobe-cli-docs.pages.dev)

| Old path | New path |
|----------|----------|
| `/guide/:path*` | `/en/cli/guide/:path*` |
| `/commands/:path*` | `/en/cli/commands/:path*` |
| `/examples/:path*` | `/en/cli/examples/:path*` |
| `/reference/:path*` | `/en/cli/reference/:path*` |
| `/policies/:path*` | `/en/cli/policies/:path*` |

## Hostnames

| Old host | Action |
|----------|--------|
| `document.softprobe.ai` | 301 → `docs.softprobe.ai` |
| `doc.softprobe.ai` | 301 → `docs.softprobe.ai` |
| `softprobe-cli-docs.pages.dev` | 301 → `docs.softprobe.ai` (or keep as preview) |

## Legacy AREX auto-testing

| Old path | New path |
|----------|----------|
| `/en/auto-testing/*` | `/en/cli/guide/quickstart` (or 410) |

Update hardcoded links in `arex-client-opensource` separately.
