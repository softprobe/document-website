import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

test('developer skills stay in the central workspace', () => {
  const repositoryRoot = fileURLToPath(new URL('../', import.meta.url))
  const localSkillDirectories = ['.agents/skills', '.cursor/skills', '.agent/skills']
  const presentDirectories = localSkillDirectories.filter(directory => existsSync(resolve(repositoryRoot, directory)))

  assert.deepEqual(
    presentDirectories,
    [],
    'Developer skills must live in the central mono repo softprobe/dev at .agents/skills/ because agents run from that workspace.',
  )
})
