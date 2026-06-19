# Softprobe documentation (VitePress v2)

Unified public docs: **Platform** (`/en/platform/…`), **Testing** (`/en/testing/…` — Java record & replay), and **CLI** (`/en/cli/…`).

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

## Deploy (GitHub Actions to Cloudflare)

This repository is configured for automated deployments to Cloudflare using GitHub Actions. 

Any push to the **`v2`** branch automatically triggers the `.github/workflows/deploy-docs.yml` workflow, which builds the site and deploys it to Cloudflare:
- **Trigger**: Automatically on pushing to the `v2` branch.
- **Workflow**: Builds the site (`npm run docs:build`) and deploys it to Cloudflare Workers using Wrangler.

### Setup Requirement (GitHub Secrets)
To enable this, make sure the following secret is added to your GitHub repository secrets (Go to **Settings** → **Secrets and variables** → **Actions**):
* **`CLOUDFLARE_API_TOKEN`**: A Cloudflare API token with Edit Workers permissions.

### Manual CLI Deploy (Fallback)
If you ever need to deploy manually from your local machine:

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
| `en/testing/` | New product docs (rewritten from legacy `auto-testing/` backup) |
| `zh/testing/` | ZH overview + links to EN detail pages |
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
