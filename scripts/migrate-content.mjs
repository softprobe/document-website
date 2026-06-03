#!/usr/bin/env node
/**
 * One-time migration: Docusaurus docs + backend/docs-site → VitePress en/zh layout.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const BACKEND_DOCS = path.join(ROOT, '..', 'backend', 'docs-site')

const CLI_BANNER =
  '::: warning CLI reference (English)\nThe `sp` CLI documentation is available in English. [Switch to English CLI docs](/en/cli/guide/for-agents).\n:::\n\n'

function stripFrontmatter(content) {
  if (!content.startsWith('---')) return content
  const end = content.indexOf('\n---', 3)
  if (end === -1) return content
  return content.slice(end + 4).replace(/^\n/, '')
}

function convertPlatformMd(content, locale) {
  let s = stripFrontmatter(content)
  s = s.replace(/:::info\b/g, '::: info')
  s = s.replace(/:::success\b/g, '::: tip')
  s = s.replace(/:::tip\b/g, '::: tip')
  s = s.replace(/:::note\b/g, '::: info')
  s = s.replace(/:::warning\b/g, '::: warning')
  s = s.replace(/:::danger\b/g, '::: danger')
  s = s.replace(/className=/g, 'class=')
  s = s.replace(/\]\(\/web-sdk\)/g, `](/${locale}/platform/sessify)`)
  s = s.replace(/\]\(\/zh\/web-sdk\)/g, '](/zh/platform/sessify)')
  s = s.replace(/\]\(\/getting-started\//g, `](/${locale}/platform/getting-started/`)
  s = s.replace(/\]\(\/deployment\//g, `](/${locale}/platform/deployment/`)
  s = s.replace(/\]\(\/configuration\//g, `](/${locale}/platform/configuration/`)
  s = s.replace(/\]\(\/production\//g, `](/${locale}/platform/production/`)
  s = s.replace(/\]\(\/advanced-guides\//g, `](/${locale}/platform/advanced-guides/`)
  s = s.replace(/\]\(\/billing\//g, `](/${locale}/platform/billing/`)
  s = s.replace(/\]\(\/support\//g, `](/${locale}/platform/support/`)
  s = s.replace(/\]\(\.\/getting-started\//g, `](/${locale}/platform/getting-started/`)
  s = s.replace(/\]\(\.\/deployment\//g, `](/${locale}/platform/deployment/`)
  s = s.replace(/href="\.\/getting-started\//g, `href="/${locale}/platform/getting-started/`)
  s = s.replace(/href="\.\/deployment\//g, `href="/${locale}/platform/deployment/`)
  return s
}

function convertCliMd(content) {
  let s = content
  s = s.replace(/\]\(\.\.\/guide\//g, '](/en/cli/guide/')
  s = s.replace(/\]\(\.\.\/commands\//g, '](/en/cli/commands/')
  s = s.replace(/\]\(\.\.\/reference\//g, '](/en/cli/reference/')
  s = s.replace(/\]\(\.\.\/examples\//g, '](/en/cli/examples/')
  s = s.replace(/\]\(\.\.\/policies\//g, '](/en/cli/policies/')
  s = s.replace(/\]\(\/guide\//g, '](/en/cli/guide/')
  s = s.replace(/\]\(\/commands\//g, '](/en/cli/commands/')
  s = s.replace(/\]\(\/reference\//g, '](/en/cli/reference/')
  s = s.replace(/\]\(\/examples\//g, '](/en/cli/examples/')
  s = s.replace(/\]\(\/policies\//g, '](/en/cli/policies/')
  s = s.replace(/\]\(\/implementer\//g, '](/en/cli/implementer/')
  return s
}

function copyDir(src, dest, transform) {
  if (!fs.existsSync(src)) {
    console.warn('skip missing', src)
    return
  }
  fs.mkdirSync(dest, { recursive: true })
  for (const name of fs.readdirSync(src)) {
    const srcPath = path.join(src, name)
    const destPath = path.join(dest, name)
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath, transform)
    } else if (name.endsWith('.md')) {
      let content = fs.readFileSync(srcPath, 'utf8')
      if (transform) content = transform(content)
      fs.writeFileSync(destPath, content)
    }
  }
}

function copyPlatform(srcDocs, destPlatform, locale) {
  fs.mkdirSync(destPlatform, { recursive: true })
  for (const name of fs.readdirSync(srcDocs)) {
    if (name.startsWith('_') || name === 'index.md' || name === 'web-sdk.md') continue
    const srcPath = path.join(srcDocs, name)
    const destPath = path.join(destPlatform, name)
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath, (c) => convertPlatformMd(c, locale))
    } else if (name.endsWith('.md')) {
      fs.writeFileSync(destPath, convertPlatformMd(fs.readFileSync(srcPath, 'utf8'), locale))
    }
  }
}

// EN platform
copyPlatform(path.join(ROOT, 'docs'), path.join(ROOT, 'en', 'platform'), 'en')

// ZH platform
const zhSrc = path.join(ROOT, 'i18n', 'zh', 'docusaurus-plugin-content-docs', 'current')
copyPlatform(zhSrc, path.join(ROOT, 'zh', 'platform'), 'zh')
const webSdk = path.join(zhSrc, 'web-sdk.md')
if (fs.existsSync(webSdk)) {
  fs.writeFileSync(
    path.join(ROOT, 'zh', 'platform', 'sessify.md'),
    convertPlatformMd(fs.readFileSync(webSdk, 'utf8'), 'zh')
  )
}

// EN CLI
const cliDirs = ['guide', 'commands', 'examples', 'reference', 'policies', 'implementer']
for (const dir of cliDirs) {
  copyDir(path.join(BACKEND_DOCS, dir), path.join(ROOT, 'en', 'cli', dir), convertCliMd)
}
const cliIndexSrc = path.join(BACKEND_DOCS, 'index.md')
if (fs.existsSync(cliIndexSrc)) {
  fs.mkdirSync(path.join(ROOT, 'en', 'cli'), { recursive: true })
  fs.writeFileSync(path.join(ROOT, 'en', 'cli', 'index.md'), convertCliMd(fs.readFileSync(cliIndexSrc, 'utf8')))
}

// ZH CLI mirror with banner
copyDir(path.join(ROOT, 'en', 'cli'), path.join(ROOT, 'zh', 'cli'), (c) => CLI_BANNER + c)

console.log('Migration complete.')
