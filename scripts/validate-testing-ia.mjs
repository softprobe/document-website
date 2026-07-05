#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const required = [
  'en/testing/installation/index.md',
  'en/testing/installation/setup.md',
  'en/testing/installation/configuration.md',
  'en/testing/installation/code.md',
  'en/testing/installation/doctor.md',
  'en/testing/installation/upgrade.md',
  'en/testing/installation/agent.md',
  'en/testing/commands/index.md',
  'en/testing/examples/index.md',
  'en/testing/reference/index.md',
  'en/testing/policies/index.md',
  'zh/testing/installation/index.md',
  'zh/testing/installation/setup.md',
  'zh/testing/installation/configuration.md',
  'zh/testing/installation/code.md',
  'zh/testing/installation/doctor.md',
  'zh/testing/installation/upgrade.md',
  'zh/testing/installation/agent.md',
  'zh/testing/commands/index.md',
  'zh/testing/examples/index.md',
  'zh/testing/reference/index.md',
  'zh/testing/policies/index.md',
  '.vitepress/config.ts',
  '.vitepress/theme/shared.ts',
]

const missing = required.filter((entry) => !fs.existsSync(path.join(root, entry)))
if (missing.length) {
  console.error(`Missing Testing IA paths: ${missing.join(', ')}`)
  process.exit(1)
}

const config = fs.readFileSync(path.join(root, '.vitepress/config.ts'), 'utf8')
if (!config.includes('testingSidebarEn') || !config.includes('testingSidebarZh')) {
  console.error('Testing sidebars are not configured for both locales')
  process.exit(1)
}

for (const snippet of [
  '/en/testing/installation/',
  '/zh/testing/installation/',
  '/en/testing/commands/',
  '/zh/testing/commands/',
  "'en/cli/guide/installation': 'en/testing/installation/'",
  "'zh/cli/guide/installation': 'zh/testing/installation/'",
  "'en/cli/commands': 'en/testing/commands/'",
  "'zh/cli/commands': 'zh/testing/commands/'",
]) {
  if (!config.includes(snippet)) {
    console.error(`VitePress config missing ${snippet}`)
    process.exit(1)
  }
}

const shared = fs.readFileSync(path.join(root, '.vitepress/theme/shared.ts'), 'utf8')
if (shared.includes('CLI & agents') || shared.includes('CLI 与自动化')) {
  console.error('Primary navigation still presents CLI as a product area')
  process.exit(1)
}

console.log('Testing IA validation passed')
