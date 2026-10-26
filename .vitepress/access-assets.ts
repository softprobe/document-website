import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { isProductModule } from '../auth/policy'

// Classify actual Rollup modules, including VitePress's lean page copies.
// Unknown assets require authentication at runtime; only reviewed public output
// is allowlisted. A dependency change cannot silently expose product text.
export function accessAssets(): Plugin {
  let ssr = false
  return {
    name: 'softprobe-access-assets',
    apply: 'build',
    enforce: 'post',
    configResolved(config) { ssr = Boolean(config.build.ssr) },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        if (ssr) return
        const chunks = Object.values(bundle).filter(item => item.type === 'chunk')
        const privateFiles = new Set(chunks.filter(chunk =>
          Object.keys(chunk.modules).some(id => isProductModule(id) || id.includes('@localSearchIndex') || id.replaceAll('\\', '/').includes('/public/img/docs/'))
        ).map(chunk => chunk.fileName))
        // A shared chunk importing private content must itself be private.
        let changed = true
        while (changed) {
          changed = false
          for (const chunk of chunks) {
            if (!privateFiles.has(chunk.fileName) && chunk.imports.some(file => privateFiles.has(file))) {
              privateFiles.add(chunk.fileName)
              changed = true
            }
          }
        }
        if (!chunks.some(chunk => Object.keys(chunk.modules).some(isProductModule))) {
          this.error('Product modules were not found; refusing to generate an empty access policy.')
        }
        for (const chunk of chunks) {
          if (privateFiles.has(chunk.fileName) && (chunk.name === 'app' || /^(en_|zh_)?index\.md$/.test(chunk.name))) {
            this.error(`Private document content was bundled into public entry ${chunk.fileName}`)
          }
        }
        const publicAssets = Object.values(bundle).filter(item => item.type === 'chunk'
          ? !privateFiles.has(item.fileName)
          : /\.(css|woff2?|ttf|otf)$/.test(item.fileName)
        ).map(item => '/' + item.fileName).sort()
        const target = fileURLToPath(new URL('./cache/access-assets.json', import.meta.url))
        mkdirSync(fileURLToPath(new URL('./cache/', import.meta.url)), { recursive: true })
        writeFileSync(target, JSON.stringify({ publicAssets, privateAssets: [...privateFiles].map(file => '/' + file).sort() }, null, 2) + '\n')
        // The standalone login page uses the same tokens as the current site.
        const css = readFileSync(fileURLToPath(new URL('./theme/custom.css', import.meta.url)), 'utf8')
        const light = css.match(/^:root\s*\{([^}]+)\}/m)?.[1]
        const dark = css.match(/^\.dark\s*\{([^}]+)\}/m)?.[1]
        if (!light || !dark) this.error('Site theme tokens are missing; refusing to build a mismatched login page.')
        writeFileSync(fileURLToPath(new URL('./cache/login-theme.json', import.meta.url)), JSON.stringify({
          css: `:root{${light}}@media(prefers-color-scheme:dark){:root{${dark}}}`,
        }) + '\n')
      },
    },
  }
}
