// Compares getEpiscopalDay() against The Lectionary Page's own calendars (truth.json, built by truth.py).
// Usage: node scripts/episcopal/verify-calendar.mjs [fromYear] [toYear] [-v]
import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { pathToFileURL } from 'node:url'

const here = path.dirname(new URL(import.meta.url).pathname)
const out = path.join(os.tmpdir(), 'episcopalCalendar.bundle.mjs')
await build({ entryPoints: [path.join(here, '../../src/data/episcopalCalendar.js')], bundle: true, format: 'esm', outfile: out, logLevel: 'silent' })
const { getEpiscopalDay } = await import(pathToFileURL(out).href)

const truth = JSON.parse(fs.readFileSync(path.join(here, 'truth.json'), 'utf8'))
const { pages } = JSON.parse(fs.readFileSync(path.join(here, 'built.json'), 'utf8'))
const pageToKey = Object.fromEntries(Object.entries(pages).map(([k, p]) => [p, k]))
const from = process.argv[2] && !process.argv[2].startsWith('-') ? Number(process.argv[2]) : 2017
const to = process.argv[3] && !process.argv[3].startsWith('-') ? Number(process.argv[3]) : 2027
const verbose = process.argv.includes('-v')

let bad = 0, checked = 0
const mismatches = []
for (const [date, v] of Object.entries(truth).sort()) {
  const y = Number(date.slice(0, 4)); if (y < from || y > to) continue
  const want = new Set(v.keys.map(k => pageToKey[k]).filter(Boolean))
  const day = getEpiscopalDay(date)
  // Lesser Feasts aren't linked in the published calendars, so they're excluded from this comparison
  const got = new Set((day ? [day.primary.key, ...day.also.map(a => a.key)] : []).filter(k => !k.startsWith('LFF.')))
  // The oracle lists Easter-week/Lesser Feasts pages we don't carry; only compare keys we know about.
  checked++
  const same = want.size === got.size && [...want].every(k => got.has(k))
  if (!same) { bad++; mismatches.push({ date, want: [...want], got: [...got], label: v.label }) }
}
console.log(`checked ${checked} dates ${from}–${to}; mismatches: ${bad}`)
for (const m of mismatches.slice(0, verbose ? 500 : 40)) console.log(m.date, '| want', m.want.join(','), '| got', m.got.join(','), '|', m.label)
process.exit(bad ? 1 : 0)
