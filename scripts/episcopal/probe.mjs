// Dev helper: show what the resolver returns.  node scripts/episcopal/probe.mjs 2027-03-28 [track]
import { build } from 'esbuild'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const out = path.join(os.tmpdir(), 'epcal.bundle.mjs')
await build({ entryPoints: [new URL('../../src/data/episcopalCalendar.js', import.meta.url).pathname], bundle: true, format: 'esm', outfile: out, logLevel: 'silent' })
const { getEpiscopalReadings, getEpiscopalInfo } = await import(pathToFileURL(out).href)
const [date, track] = process.argv.slice(2)
const r = getEpiscopalReadings({ date, occasion: 'Sunday Mass', track: Number(track) || 1 })
console.log(date, '|', getEpiscopalInfo(date).sundayName, '|', r.feastName || '', '| year', r.year, '| track2:', r.track2Available)
for (const x of r.readings) console.log('  ', x.label.padEnd(34), x.reference, x.alternates.length ? ' [or ' + x.alternates.join(' | ') + ']' : '')
if (r.also?.length) console.log('   also:', r.also.map(a => a.name).join(' ; '))
