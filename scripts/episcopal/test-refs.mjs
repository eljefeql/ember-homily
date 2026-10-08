// Checks that every reference in the Episcopal data parses and returns real WEB text.
// Usage: node scripts/episcopal/test-refs.mjs [--network]
import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { pathToFileURL } from 'node:url'
const here = path.dirname(new URL(import.meta.url).pathname)
const out = path.join(os.tmpdir(), 'webScripture.bundle.mjs')
await build({ entryPoints: [path.join(here, '../../src/lib/webScripture.js')], bundle: true, format: 'esm', outfile: out, logLevel: 'silent' })
const { parseReference, fetchWebPassage } = await import(pathToFileURL(out).href)
const { lectionary } = JSON.parse(fs.readFileSync(path.join(here, 'built.json'), 'utf8'))

const refs = new Set()
for (const e of Object.values(lectionary)) for (const set of [e.readings, e.track2 || []]) for (const r of set) {
  for (const x of [r.reference, ...(r.alternates || [])]) refs.add(r.textRefs?.[x] || x)
}
console.log(refs.size, 'unique references')
let bad = 0
for (const r of refs) if (!parseReference(r)) { bad++; console.log('UNPARSEABLE:', r) }
console.log('parse failures:', bad)
if (process.argv.includes('--network')) {
  const list = [...refs]; let empty = 0, done = 0
  const worker = async () => { while (list.length) { const r = list.pop(); const t = await fetchWebPassage(r); done++; if (!t || t.length < 20) { empty++; console.log('EMPTY:', r) } } }
  await Promise.all(Array.from({ length: 6 }, worker))
  console.log(`fetched ${done}; empty/failed: ${empty}`)
}
process.exit(bad ? 1 : 0)
