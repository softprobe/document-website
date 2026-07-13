#!/usr/bin/env node
// Structural guards for the Softprobe docs IA. Runs in CI (see package.json
// `validate:testing-ia`). Fails the build on:
//   1. en/zh content-tree drift (a page in one locale, missing in the other)
//   2. en/zh Testing sidebar structure drift (different group/item counts)
//   3. sidebar links that point at non-existent pages
//   4. removed legacy scaffolding creeping back in
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const problems = []
const fail = (msg) => problems.push(msg)

// --- helpers ---------------------------------------------------------------

function walkMd(dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) out.push(...walkMd(full))
    else if (name.endsWith('.md')) out.push(full)
  }
  return out
}

// Map a site link like /zh/testing/agents/concepts (or .../) to a source file.
function pageExists(link) {
  const clean = link.replace(/[#?].*$/, '')
  const rel = clean.replace(/^\//, '')
  const candidates = rel.endsWith('/')
    ? [`${rel}index.md`]
    : [`${rel}.md`, `${rel}/index.md`]
  return candidates.some((c) => fs.existsSync(path.join(root, c)))
}

// --- 1. en/zh content-tree parity -----------------------------------------
// implementer/** is design-doc-only (srcExcluded) and intentionally not mirrored.
function relSet(locale) {
  return new Set(
    ['testing', 'platform']
      .flatMap((area) => walkMd(path.join(root, locale, area)))
      .map((f) => path.relative(path.join(root, locale), f))
  )
}
const enSet = relSet('en')
const zhSet = relSet('zh')
const missingInZh = [...enSet].filter((p) => !zhSet.has(p)).sort()
const missingInEn = [...zhSet].filter((p) => !enSet.has(p)).sort()
if (missingInZh.length) fail(`Pages in en/ but missing in zh/:\n  ${missingInZh.join('\n  ')}`)
if (missingInEn.length) fail(`Pages in zh/ but missing in en/:\n  ${missingInEn.join('\n  ')}`)

// --- 2 & 3. sidebar parity + link validity --------------------------------
const config = fs.readFileSync(path.join(root, '.vitepress/config.ts'), 'utf8')

if (!config.includes('testingSidebarEn') || !config.includes('testingSidebarZh')) {
  fail('Both testingSidebarEn and testingSidebarZh must exist in config.ts')
}

// Extract each sidebar array's shape: number of groups + items per group.
function sidebarShape(varName) {
  const start = config.indexOf(`const ${varName} = [`)
  if (start === -1) return null
  // Find the matching close bracket for the array.
  let depth = 0
  let i = config.indexOf('[', start)
  const arrStart = i
  for (; i < config.length; i++) {
    if (config[i] === '[') depth++
    else if (config[i] === ']') {
      depth--
      if (depth === 0) break
    }
  }
  const body = config.slice(arrStart, i + 1)
  const groups = (body.match(/^\s{2}\{/gm) || []).length
  const links = [...body.matchAll(/link:\s*'([^']+)'/g)].map((m) => m[1])
  return { groups, links }
}

const enShape = sidebarShape('testingSidebarEn')
const zhShape = sidebarShape('testingSidebarZh')
if (enShape && zhShape) {
  if (enShape.groups !== zhShape.groups) {
    fail(`Testing sidebar group count differs: en=${enShape.groups} zh=${zhShape.groups}`)
  }
  if (enShape.links.length !== zhShape.links.length) {
    fail(`Testing sidebar item count differs: en=${enShape.links.length} zh=${zhShape.links.length}`)
  }
  // Every sidebar link must resolve to a real page.
  for (const link of [...enShape.links, ...zhShape.links]) {
    const bare = link.replace(/#.*$/, '')
    if (!pageExists(bare)) fail(`Sidebar links a non-existent page: ${link}`)
  }
}

// --- 4. removed legacy scaffolding must stay removed -----------------------
if (config.includes('rewrites:')) {
  fail('config.ts must not reintroduce the dead `rewrites` block (redirects live in public/_redirects)')
}
if (fs.existsSync(path.join(root, 'en/testing/policies/index.md'))) {
  fail('en/testing/policies/index.md was merged into policies.md — do not recreate it')
}
const tombstones = [...walkMd(path.join(root, 'en/cli')), ...walkMd(path.join(root, 'zh/cli'))]
  .filter((f) => !f.includes(`${path.sep}implementer${path.sep}`))
if (tombstones.length) {
  fail(`cli/ tombstone pages must be deleted (redirects live in public/_redirects):\n  ${tombstones.map((f) => path.relative(root, f)).join('\n  ')}`)
}

// --- report ----------------------------------------------------------------
if (problems.length) {
  console.error('IA validation FAILED:\n\n' + problems.join('\n\n'))
  process.exit(1)
}
console.log('IA validation passed: en/zh trees + Testing sidebars are in sync.')
