#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

function fix(content) {
  return content
    .replace(/style=\{\{textAlign:\s*'center',\s*margin:\s*'24px 48px'\}\}/g, 'style="text-align: center; margin: 24px 48px"')
    .replace(/style=\{\{maxWidth:\s*'100%',\s*height:\s*'auto',\s*borderRadius:\s*'8px'\}\}/g, 'style="max-width: 100%; height: auto; border-radius: 8px"')
    .replace(/style=\{\{marginTop:'8px'\}\}/g, 'style="margin-top: 8px"')
    .replace(/className=/g, 'class=')
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walk(p)
    else if (name.endsWith('.md')) {
      fs.writeFileSync(p, fix(fs.readFileSync(p, 'utf8')))
    }
  }
}

for (const sub of ['en/platform', 'zh/platform']) {
  walk(path.join(ROOT, sub))
}
console.log('Fixed HTML in platform docs')
