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

### Password protection

The Cloudflare Worker checks the password before serving any product page. The
same policy covers English and Chinese product areas (Testing, Platform, Agent QA and Evaluation), page JavaScript (including lean copies),
search indexes, screenshots under `/img/docs/`, raw Markdown and `llms*.txt`.
Internal `cli/implementer/` sources remain excluded from the build.

Sign-in uses one shared password and an HttpOnly, Secure, SameSite cookie lasting
7 days. Changing the password invalidates existing sessions. Product responses
use `Cache-Control: private, no-store`. The product footer includes a sign-out
button. Login attempts are limited to approximately 10 per minute per source IP
at each Cloudflare location.

For a local preview **with access control**:

```bash
cp .dev.vars.example .dev.vars
# Replace DOCS_PASSWORD in .dev.vars with a random password (16+ characters).
npm run docs:serve
```

`docs:dev` and `docs:preview` are local authoring tools and do not enforce access
control. Never expose those servers publicly. Deploy using Workers with
`wrangler.jsonc`; uploading `.vitepress/dist` to a standalone static host or
Cloudflare Pages bypasses the password protection.

Before the first production deployment, configure a long random password:

```bash
npx wrangler secret put DOCS_PASSWORD
npm run deploy
```

The secret is never committed. A missing or shorter-than-16-character secret
blocks access to product documents. Configure the secret on every deployed
Worker/environment, including previews. Only share document source through a
private repository; the website password does not protect a public Git repository.

After `npm run docs:build`, verify with:

```bash
npm run test:auth
npm run typecheck:worker
npx wrangler deploy --dry-run
```

The build generates `.vitepress/cache/access-assets.json` from Rollup's module
graph. Product content and search chunks require authentication; unknown files
under `/assets/` are also protected. The build fails if product text is merged
into the public application entry or landing-page JavaScript. Run the build
before invoking Wrangler directly. After changing bindings, regenerate types
with `npx wrangler types worker/env.d.ts --include-runtime false`.

## Deploy (Cloudflare Git Integration)

This repository is configured for automated deployments directly connected to Cloudflare (following the same pattern as `sp-airline-ndc`). 

Any push to the **`v2`** branch automatically triggers a build and deploy on Cloudflare:
- **Build Command**: `npm run docs:build`
- **Output Directory**: `.vitepress/dist`
- **Deploy Command (Workers)**: `npx wrangler deploy` (deploy the authentication Worker together with its assets)

No manual deployment commands are necessary.

### Manual CLI Deploy (Fallback)
If you ever need to deploy manually from your local machine:

```bash
# wrangler login (Softprobe account)
npm run deploy
```

Worker name: `document-website`. Output: `.vitepress/dist`.

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
