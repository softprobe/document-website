# Softprobe documentation (VitePress v2)

Unified public docs: **Platform** (`/en/platform/…`, `/zh/platform/…`) and **CLI** (`/en/cli/…`).

## Local dev

```bash
npm install
npm run docs:dev
```

Open [http://localhost:5173/en/](http://localhost:5173/en/).

## Build

```bash
npm run docs:build
npm run docs:preview
```

## Deploy (Cloudflare Worker static assets)

```bash
# wrangler login (Softprobe account)
npm run deploy
```

Worker name: `softprobe-docs`. Output: `.vitepress/dist`.

**Preview (v2):** https://softprobe-docs.github-visualizer.workers.dev/en/

Attach custom domain `docs.softprobe.ai` in Cloudflare dashboard (Workers → `softprobe-docs` → Domains) after approval.

See [REDIRECTS.md](./REDIRECTS.md) for legacy URL mapping.

## Content layout

| Path | Source |
|------|--------|
| `en/platform/` | Former `document-website/docs/` |
| `zh/platform/` | Former `i18n/zh/.../current/` |
| `en/cli/` | Former `backend/docs-site/` (public pages) |
| `zh/cli/` | English CLI mirror + locale banner |
| `en/cli/implementer/` | Internal only — excluded from build |

To refresh CLI content from backend after API changes:

```bash
node scripts/migrate-content.mjs
node scripts/fix-html.mjs
```

## Branch

- **`v2`** — VitePress + Workers (this layout)
- **`main`** — legacy Docusaurus + K8s until cutover
