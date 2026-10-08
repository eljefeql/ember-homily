// Dev helper: print the WEB text for references.
//   node scripts/episcopal/show.mjs "Psalm 23" "Luke 2:1-14 (15-20)"
import { build } from 'esbuild'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const src = new URL('../../src/lib/webScripture.js', import.meta.url).pathname
const out = path.join(os.tmpdir(), 'ws.bundle.mjs')
await build({ entryPoints: [src], bundle: true, format: 'esm', outfile: out, logLevel: 'silent' })
const { fetchWebPassage } = await import(pathToFileURL(out).href)
for (const r of process.argv.slice(2)) { console.log('=====', r); console.log((await fetchWebPassage(r)).slice(0, 600)) }
