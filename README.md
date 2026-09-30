# Softprobe documentation (VitePress v2)

Unified public docs, in English and Chinese: **Replay Testing** (`/{en,zh}/testing/…` — record and replay, deployment and operations, pipelines, the `sp` command line and AI agent contracts), **Business observability** (`/{en,zh}/platform/…`, Softprobe Cloud only), **Agent QA** (`/{en,zh}/agent-qa/…`) and **Agent Evaluation** (`/{en,zh}/evaluation/…`).

Legacy `/cli/*` and Docusaurus URLs are redirected by Cloudflare rules in [`public/_redirects`](./public/_redirects); see [REDIRECTS.md](./REDIRECTS.md).

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

## Deploy (Cloudflare Git Integration)

This repository is configured for automated deployments directly connected to Cloudflare (following the same pattern as `sp-airline-ndc`). 

Any push to the **`v2`** branch automatically triggers a build and deploy on Cloudflare:
- **Build Command**: `npm run docs:build`
- **Output Directory**: `.vitepress/dist`

No manual deployment commands are necessary.

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

| Path | Contents |
|------|----------|
| `{en,zh}/testing/` | Replay Testing. Sidebar groups: getting started, everyday use, deploy and operate, pipelines and notifications, integrate and AI agents, command reference |
| `{en,zh}/platform/` | Business observability (Istio/Envoy mesh capture), Softprobe Cloud only |
| `{en,zh}/agent-qa/` | Agent QA |
| `{en,zh}/evaluation/` | Agent Evaluation |
| `{en,zh}/cli/implementer/`, `en/evaluation/implementer/` | Internal notes, excluded from the build |

Sidebars live in `.vitepress/config.ts`; nav and footer in `.vitepress/theme/shared.ts`. Screenshots are under `public/img/docs/testing/{en,zh}/` and come from the latest v2 console.

## Branch

- **`v2`** — VitePress + Workers (this layout)
- **`main`** — legacy Docusaurus + K8s until cutover
