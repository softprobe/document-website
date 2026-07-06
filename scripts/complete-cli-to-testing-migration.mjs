#!/usr/bin/env node
/**
 * Option A: move canonical CLI user docs into en|zh/testing/* and replace
 * en|zh/cli/* copies with redirect stubs. Run once from document-website root.
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const locales = ['en', 'zh']

/** cli relative path -> testing relative path */
const moves = [
  ['cli/commands', 'testing/commands'],
  ['cli/examples', 'testing/examples'],
  ['cli/reference', 'testing/reference'],
  ['cli/policies', 'testing/policies'],
  ['cli/guide/overview.md', 'testing/agents/overview.md'],
  ['cli/guide/output-contract.md', 'testing/agents/output-contract.md'],
  ['cli/guide/versioning.md', 'testing/agents/versioning.md'],
  ['cli/guide/log-correlation-ids.md', 'testing/reference/log-correlation-ids.md'],
  ['cli/guide/authentication.md', 'testing/agents/authentication.md'],
  ['cli/guide/concepts.md', 'testing/agents/concepts.md'],
  ['cli/guide/introduction.md', 'testing/agents/introduction.md'],
]

const rewriteLinks = (content, locale) => {
  const p = `/${locale}`
  let s = content
  const pairs = [
    [`${p}/cli/commands/`, `${p}/testing/commands/`],
    [`${p}/cli/examples/`, `${p}/testing/examples/`],
    [`${p}/cli/reference/`, `${p}/testing/reference/`],
    [`${p}/cli/policies/`, `${p}/testing/policies/`],
    [`${p}/cli/guide/overview`, `${p}/testing/agents/overview`],
    [`${p}/cli/guide/output-contract`, `${p}/testing/agents/output-contract`],
    [`${p}/cli/guide/versioning`, `${p}/testing/agents/versioning`],
    [`${p}/cli/guide/log-correlation-ids`, `${p}/testing/reference/log-correlation-ids`],
    [`${p}/cli/guide/authentication`, `${p}/testing/agents/authentication`],
    [`${p}/cli/guide/concepts`, `${p}/testing/agents/concepts`],
    [`${p}/cli/guide/introduction`, `${p}/testing/agents/introduction`],
    [`${p}/cli/guide/installation`, `${p}/testing/installation/`],
    [`${p}/cli/guide/configuration`, `${p}/testing/installation/configuration`],
    [`${p}/cli/guide/spcode`, `${p}/testing/installation/code`],
    [`${p}/cli/guide/quickstart`, `${p}/testing/getting-started`],
    [`](/en/cli/`, `](/en/testing/`],
    [`](/zh/cli/`, `](/zh/testing/`],
    ['./setup.md', `${p}/testing/installation/`],
  ]
  for (const [from, to] of pairs) {
    s = s.split(from).join(to)
  }
  return s
}

function copyTree(srcRel, destRel, locale) {
  const src = path.join(root, locale, srcRel)
  const dest = path.join(root, locale, destRel)
  if (!fs.existsSync(src)) return []
  const copied = []
  const walk = (s, d, relBase) => {
    for (const name of fs.readdirSync(s)) {
      const sp = path.join(s, name)
      const dp = path.join(d, name)
      const rel = path.join(relBase, name)
      if (fs.statSync(sp).isDirectory()) {
        fs.mkdirSync(dp, { recursive: true })
        walk(sp, dp, rel)
      } else if (name.endsWith('.md')) {
        let content = fs.readFileSync(sp, 'utf8')
        content = rewriteLinks(content, locale)
        fs.mkdirSync(path.dirname(dp), { recursive: true })
        fs.writeFileSync(dp, content)
        copied.push(`${locale}/${destRel}/${rel}`.replace(/\\/g, '/'))
      }
    }
  }
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    walk(src, dest, '')
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    let content = fs.readFileSync(src, 'utf8')
    content = rewriteLinks(content, locale)
    fs.writeFileSync(dest, content)
    copied.push(`${locale}/${destRel}`)
  }
  return copied
}

function stubFor(locale, relPath, targetLink) {
  const title = path.basename(relPath, '.md')
  return `---
title: Moved — ${title}
---

# Moved

This page now lives under **Testing**: [${title}](${targetLink}).
`
}

const stubTargets = {
  'cli/commands': (locale) => `/${locale}/testing/commands/`,
  'cli/examples': (locale) => `/${locale}/testing/examples/`,
  'cli/reference': (locale) => `/${locale}/testing/reference/`,
  'cli/policies': (locale) => `/${locale}/testing/policies/`,
  'cli/guide/installation.md': (locale) => `/${locale}/testing/installation/`,
  'cli/guide/configuration.md': (locale) => `/${locale}/testing/installation/configuration`,
  'cli/guide/spcode.md': (locale) => `/${locale}/testing/installation/code`,
  'cli/guide/quickstart.md': (locale) => `/${locale}/testing/getting-started`,
  'cli/guide/overview.md': (locale) => `/${locale}/testing/agents/overview`,
  'cli/guide/output-contract.md': (locale) => `/${locale}/testing/agents/output-contract`,
  'cli/guide/versioning.md': (locale) => `/${locale}/testing/agents/versioning`,
  'cli/guide/log-correlation-ids.md': (locale) => `/${locale}/testing/reference/log-correlation-ids`,
  'cli/guide/authentication.md': (locale) => `/${locale}/testing/agents/authentication`,
  'cli/guide/concepts.md': (locale) => `/${locale}/testing/agents/concepts`,
  'cli/guide/introduction.md': (locale) => `/${locale}/testing/agents/introduction`,
}

function replaceWithStubs(locale) {
  for (const [rel, targetFn] of Object.entries(stubTargets)) {
    const full = path.join(root, locale, rel)
    const target = targetFn(locale)
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
      for (const name of fs.readdirSync(full)) {
        if (!name.endsWith('.md')) continue
        const fp = path.join(full, name)
        const pageTarget =
          rel.includes('commands') && name !== 'index.md'
            ? `/${locale}/testing/commands/${name.replace(/\.md$/, '')}`
            : target
        fs.writeFileSync(fp, stubFor(locale, name, pageTarget))
      }
    } else if (fs.existsSync(full)) {
      fs.writeFileSync(full, stubFor(locale, path.basename(rel), target))
    }
  }
}

const setupCommandRef = (locale) => {
  const p = locale === 'zh' ? '/zh' : '/en'
  const install = `${p}/testing/installation/`
  if (locale === 'zh') {
    return `---
title: sp setup
---

# sp setup

命令参考。安装、Spcode Service 与运维说明见 [设置](${install})。

\`\`\`bash
sp setup
sp setup --api-url http://127.0.0.1:8090
sp setup --install-spcode-service
sp setup --uninstall-spcode-service
\`\`\`

| 参数 | 说明 |
|------|------|
| \`--api-url\` | 后端 URL |
| \`--install-spcode-service\` | 安装 Spcode Service（仅 Linux） |
| \`--uninstall-spcode-service\` | 卸载 Spcode Service |
| \`--spcode-service-port\` | 监听端口（默认 4096） |

使用 \`--json\` 时可能包含 \`spcodeServiceStatus\`、\`spcodeServicePort\`。
`
  }
  return `---
title: sp setup
---

# sp setup

Command reference. Install flow, Spcode Service, and systemd ops are documented in [Setup](${install}).

\`\`\`bash
sp setup
sp setup --api-url http://127.0.0.1:8090
sp setup --install-spcode-service
sp setup --uninstall-spcode-service
\`\`\`

| Flag | Description |
|------|-------------|
| \`--api-url\` | Softprobe API URL |
| \`--install-spcode-service\` | Install Spcode Service (Linux only) |
| \`--uninstall-spcode-service\` | Remove Spcode Service |
| \`--spcode-service-port\` | Listen port (default 4096) |

With \`--json\`, responses may include \`spcodeServiceStatus\` and \`spcodeServicePort\`.
`
}

const allCopied = []
for (const locale of locales) {
  for (const [src, dest] of moves) {
    if (src.endsWith('.md')) {
      const srcPath = path.join(root, locale, src)
      const destPath = path.join(root, locale, dest)
      if (fs.existsSync(srcPath)) {
        fs.mkdirSync(path.dirname(destPath), { recursive: true })
        let content = fs.readFileSync(srcPath, 'utf8')
        content = rewriteLinks(content, locale)
        fs.writeFileSync(destPath, content)
        allCopied.push(`${locale}/${dest}`)
      }
    } else {
      allCopied.push(...copyTree(src, dest, locale))
    }
  }
  replaceWithStubs(locale)
  fs.writeFileSync(
    path.join(root, locale, 'testing/commands/setup.md'),
    setupCommandRef(locale),
  )
}

console.log(`Migrated ${allCopied.length} paths; stubs written under ${locales.map((l) => `${l}/cli/`).join(', ')}`)
console.log('Review testing/commands/setup.md (command ref) vs testing/installation/index.md (operator guide).')
