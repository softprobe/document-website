import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const FORBIDDEN_COMPILER_TOKENS = [
  'softprobe-compile-session',
  'compile_session_test',
  'SessionTestExportDrawer',
  '@softprobe/e2e/session-compiler',
  'compileSessionTo',
]

function walkMarkdownFiles(directory) {
  const files = []
  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry)
    const stats = statSync(fullPath)
    if (stats.isDirectory()) {
      files.push(...walkMarkdownFiles(fullPath))
    } else if (entry.endsWith('.md')) {
      files.push(fullPath)
    }
  }
  return files
}

function findForbiddenCompilerReferences(rootDirectory) {
  const findings = []
  for (const locale of ['en', 'zh']) {
    const localeDir = resolve(rootDirectory, locale)
    for (const filePath of walkMarkdownFiles(localeDir)) {
      const lines = readFileSync(filePath, 'utf8').split('\n')
      lines.forEach((line, index) => {
        for (const token of FORBIDDEN_COMPILER_TOKENS) {
          if (line.includes(token)) {
            findings.push(`${relative(rootDirectory, filePath)}:${index + 1} contains "${token}"`)
          }
        }
      })
    }
  }
  return findings
}

function formatViolationMessage(findings) {
  return [
    'Removed static session-compiler references reappeared in documentation.',
    'Use Blackbox MCP get_session_semantic_actions and get_trace with a coding agent instead of softprobe-compile-session, compile_session_test, SessionTestExportDrawer, @softprobe/e2e/session-compiler, or compileSessionTo*.',
    ...findings,
  ].join('\n')
}

test('detector flags simulated session-compiler regressions across en/ and zh/', () => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'sp-docs-compiler-guard-'))
  try {
    mkdirSync(join(fixtureRoot, 'en/ui-testing'), { recursive: true })
    mkdirSync(join(fixtureRoot, 'zh/ui-testing'), { recursive: true })
    writeFileSync(join(fixtureRoot, 'en/ui-testing/sample.md'), 'Run softprobe-compile-session or SessionTestExportDrawer.\n')
    writeFileSync(join(fixtureRoot, 'zh/ui-testing/sample.md'), '调用 compile_session_test 或 compileSessionToMobileE2E。\n')

    const findings = findForbiddenCompilerReferences(fixtureRoot)
    assert.equal(findings.length, 4)
    const message = formatViolationMessage(findings)
    assert.match(message, /get_session_semantic_actions/)
    assert.match(message, /get_trace/)
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
})

test('en/ and zh/ documentation contain zero static session-compiler references', () => {
  const repositoryRoot = fileURLToPath(new URL('../', import.meta.url))
  const findings = findForbiddenCompilerReferences(repositoryRoot)
  assert.deepEqual(findings, [], formatViolationMessage(findings))
})
