#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const required = [
  'en/testing/installation/server.md',
  'en/testing/installation/index.md',
  'en/testing/installation/configuration.md',
  'en/testing/installation/code.md',
  'en/testing/installation/doctor.md',
  'en/testing/installation/upgrade.md',
  'en/testing/download-java-agent.md',
  'en/testing/commands/index.md',
  'en/testing/commands/setup.md',
  'en/testing/agents/overview.md',
  'en/testing/agents/output-contract.md',
  'en/testing/examples/index.md',
  'en/testing/reference/index.md',
  'en/testing/policies/index.md',
  'zh/testing/installation/server.md',
  'zh/testing/installation/index.md',
  'zh/testing/installation/configuration.md',
  'zh/testing/installation/code.md',
  'zh/testing/installation/doctor.md',
  'zh/testing/installation/upgrade.md',
  'zh/testing/download-java-agent.md',
  'zh/testing/commands/index.md',
  'zh/testing/commands/setup.md',
  'zh/testing/agents/overview.md',
  'zh/testing/agents/output-contract.md',
  'zh/testing/examples/index.md',
  'zh/testing/reference/index.md',
  'zh/testing/policies/index.md',
  '.vitepress/config.ts',
  '.vitepress/theme/shared.ts',
  'CONTRIBUTING.md',
]

const commandPages = [
  'agent.md',
  'app.md',
  'auth.md',
  'config.md',
  'diagnose.md',
  'policy.md',
  'record.md',
  'replay.md',
  'setup.md',
  'trace.md',
]

const rewriteTargets = [
  ['en/cli/commands', 'en/testing/commands/'],
  ['en/cli/examples', 'en/testing/examples/'],
  ['en/cli/reference', 'en/testing/reference/'],
  ['en/cli/policies', 'en/testing/policies/'],
  ['en/cli/guide/installation', 'en/testing/installation/'],
  ['en/cli/guide/configuration', 'en/testing/installation/configuration'],
  ['en/cli/guide/spcode', 'en/testing/installation/code'],
  ['en/cli/guide/overview', 'en/testing/agents/overview'],
  ['zh/cli/commands', 'zh/testing/commands/'],
  ['zh/cli/examples', 'zh/testing/examples/'],
  ['zh/cli/reference', 'zh/testing/reference/'],
  ['zh/cli/policies', 'zh/testing/policies/'],
  ['zh/cli/guide/installation', 'zh/testing/installation/'],
]

const stubDirs = ['en/cli/commands', 'en/cli/examples', 'en/cli/reference', 'en/cli/policies']

function fail(msg) {
  console.error(msg)
  process.exit(1)
}

const missing = required.filter((entry) => !fs.existsSync(path.join(root, entry)))
if (missing.length) {
  fail(`Missing Testing IA paths: ${missing.join(', ')}`)
}

for (const page of commandPages) {
  const en = path.join(root, 'en/testing/commands', page)
  if (!fs.existsSync(en)) {
    fail(`Missing en/testing/commands/${page}`)
  }
}

const config = fs.readFileSync(path.join(root, '.vitepress/config.ts'), 'utf8')
if (!config.includes('testingSidebarEn') || !config.includes('testingSidebarZh')) {
  fail('Testing sidebars are not configured for both locales')
}
if (config.includes('function cliSidebar')) {
  fail('Remove dead cliSidebar() — Testing is the only product sidebar')
}

if (!config.includes('/en/testing/installation/server')) {
  fail('Testing sidebar must link server installation before client')
}

for (const snippet of [
  '/en/testing/installation/',
  '/zh/testing/installation/',
  '/en/testing/commands/',
  '/en/testing/agents/',
  "'en/cli/commands': 'en/testing/commands/'",
  "'en/cli/guide/overview': 'en/testing/agents/overview'",
]) {
  if (!config.includes(snippet)) {
    fail(`VitePress config missing ${snippet}`)
  }
}

for (const [rewrite, target] of rewriteTargets) {
  const key = `'${rewrite}': '${target}'`
  if (!config.includes(key)) {
    fail(`Missing rewrite in config: ${key}`)
  }
  const checkPath = target.endsWith('/')
    ? path.join(root, target, 'index.md')
    : path.join(root, `${target}.md`)
  if (!fs.existsSync(checkPath)) {
    fail(`Rewrite target missing on disk: ${target} (expected ${checkPath})`)
  }
}

for (const dir of stubDirs) {
  const full = path.join(root, dir)
  if (!fs.existsSync(full)) continue
  for (const name of fs.readdirSync(full)) {
    if (!name.endsWith('.md')) continue
    const content = fs.readFileSync(path.join(full, name), 'utf8')
    if (!content.includes('This page now lives under **Testing**')) {
      fail(`${dir}/${name} must be a redirect stub — edit testing/ instead`)
    }
  }
}

const setup = fs.readFileSync(path.join(root, 'en/testing/installation/index.md'), 'utf8')
if (!setup.includes('Spcode Service')) {
  fail('en/testing/installation/index.md must document Spcode Service (011)')
}
if (!setup.includes('Prerequisite') || !setup.includes('server.md')) {
  fail('en/testing/installation/index.md must link server install as prerequisite')
}

const server = fs.readFileSync(path.join(root, 'en/testing/installation/server.md'), 'utf8')
if (!server.includes('Unified log pipeline') || !server.includes('helm install')) {
  fail('en/testing/installation/server.md must combine Helm install and log pipeline')
}

const shared = fs.readFileSync(path.join(root, '.vitepress/theme/shared.ts'), 'utf8')
if (shared.includes('CLI & agents') || shared.includes('CLI 与自动化')) {
  fail('Primary navigation still presents CLI as a product area')
}

console.log('Testing IA validation passed')
