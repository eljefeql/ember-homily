// Episcopal / Anglican liturgical calendar + reading resolver.
//
// Date → which Sunday / Holy Day it is → entry in EPISCOPAL_LECTIONARY (RCL as adapted
// for the Episcopal Church). All date math is done in UTC so the user's timezone can't
// shift a Sunday. Verified against The Lectionary Page's published calendars 2017–2027
// (see scripts/episcopal/verify-calendar.mjs).

import { EPISCOPAL_LECTIONARY } from './episcopalLectionary'

const DAY = 86400000

// ─── Date helpers ─────────────────────────────────────────────────────────────
function parse(dateString) {
  const [y, m, d] = dateString.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
function fmt(ms) {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}
const yearOf = ms => new Date(ms).getUTCFullYear()
const dowOf = ms => new Date(ms).getUTCDay()           // 0 = Sunday
const utc = (y, m, d) => Date.UTC(y, m - 1, d)          // m is 1-based

// Western Easter (Anonymous Gregorian algorithm)
export function easterOf(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return utc(year, month, day)
}

// First Sunday of Advent = the Sunday nearest Nov 30 (Nov 27 – Dec 3)
function adventOne(year) {
  const nov27 = utc(year, 11, 27)
  return nov27 + ((7 - dowOf(nov27)) % 7) * DAY
}

// Lectionary year: A / B / C, turning over on the First Sunday of Advent.
// Years whose Advent starts the cycle are multiples of 3 (2022, 2025, 2028 → A), then B, then C.
export function getEpiscopalYear(dateString) {
  const ms = parse(dateString)
  const y = yearOf(ms)
  const adventYear = ms >= adventOne(y) ? y : y - 1
  return ['A', 'B', 'C'][adventYear % 3]
}

const ORDINALS = ['', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth',
  'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth',
  'Eighteenth', 'Nineteenth', 'Twentieth', 'Twenty-First', 'Twenty-Second', 'Twenty-Third', 'Twenty-Fourth',
  'Twenty-Fifth', 'Twenty-Sixth', 'Twenty-Seventh', 'Twenty-Eighth']

// ─── Fixed-date Holy Days ────────────────────────────────────────────────────
// [month, day, slug, overridesSunday]
// overridesSunday: Principal Feasts and Feasts of Our Lord that take the place of an ordinary
// Sunday (outside Advent, Lent and Easter). Everything else moves to the next free weekday.
const FIXED = [
  [1, 1, 'holyName', true], [1, 6, 'epiphany', true], [1, 18, 'confessionPeter'], [1, 25, 'conversionPaul'],
  [2, 2, 'presentation', true], [2, 24, 'matthias'], [3, 19, 'joseph'], [3, 25, 'annunciation'],
  [4, 25, 'mark'], [5, 1, 'philipJames'], [5, 31, 'visitation'], [6, 11, 'barnabas'],
  [6, 24, 'nativityJohnBaptist'], [6, 29, 'peterPaul'], [7, 4, 'independenceDay'], [7, 22, 'maryMagdalene'],
  [7, 25, 'james'], [8, 6, 'transfiguration', true], [8, 15, 'maryVirgin'], [8, 24, 'bartholomew'],
  [9, 14, 'holyCross'], [9, 21, 'matthew'], [9, 29, 'michael'], [10, 18, 'luke'], [10, 23, 'jamesJerusalem'],
  [10, 28, 'simonJude'], [11, 1, 'allSaints', true], [11, 30, 'andrew'], [12, 21, 'thomas'],
  [12, 25, 'christmasDay', true], [12, 26, 'stephen'], [12, 27, 'john'], [12, 28, 'holyInnocents'],
]

export const EPISCOPAL_FEAST_NAMES = (() => {
  const names = new Map()
  for (const [, , slug] of FIXED) {
    const key = slug === 'christmasDay' ? 'ABC.christmasDay3' : slug === 'allSaints' ? 'A.allSaints' : `ABC.${slug}`
    const e = EPISCOPAL_LECTIONARY[key]
    if (e) names.set(e.name.replace(/^Christmas Day III.*/, 'Christmas Day'), slug)
  }
  for (const extra of [['Ash Wednesday', 'ashWednesday'], ['Maundy Thursday', 'maundyThursday'], ['Good Friday', 'goodFriday'],
    ['Holy Saturday', 'holySaturday'], ['The Great Vigil of Easter', 'easterVigil'], ['Easter Day', 'easterDay'],
    ['Ascension Day', 'ascension'], ['The Day of Pentecost', 'pentecost'], ['Trinity Sunday', 'trinity'],
    ['Palm Sunday', 'palmSunday'], ['Thanksgiving Day', 'thanksgiving'], ['Holy Cross Day', 'holyCross'],
    ['Monday in Holy Week', 'holyMon'], ['Tuesday in Holy Week', 'holyTue'], ['Wednesday in Holy Week', 'holyWed']]) {
    names.set(extra[0], extra[1])
  }
  return [...names.keys()].sort((a, b) => a.localeCompare(b))
})()

// Feast name → slug (for the "Holy Day / Feast" search box)
function slugForName(name) {
  const q = (name || '').toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').replace(/[’']/g, "'").trim()
  if (!q) return null
  const table = {}
  for (const [, , slug] of FIXED) {
    const key = slug === 'christmasDay' ? 'ABC.christmasDay3' : slug === 'allSaints' ? 'A.allSaints' : `ABC.${slug}`
    const e = EPISCOPAL_LECTIONARY[key]
    if (e) table[e.name.toLowerCase().replace(/^christmas day iii.*/, 'christmas day').replace(/[’']/g, "'")] = slug
  }
  Object.assign(table, {
    'ash wednesday': 'ashWednesday', 'maundy thursday': 'maundyThursday', 'holy thursday': 'maundyThursday',
    'good friday': 'goodFriday', 'holy saturday': 'holySaturday', 'the great vigil of easter': 'easterVigil',
    'easter vigil': 'easterVigil', 'easter day': 'easterDay', 'easter sunday': 'easterDay',
    'ascension day': 'ascension', 'ascension': 'ascension', 'the day of pentecost': 'pentecost',
    'pentecost': 'pentecost', 'trinity sunday': 'trinity', 'palm sunday': 'palmSunday',
    'thanksgiving day': 'thanksgiving', 'thanksgiving': 'thanksgiving', 'all saints': 'allSaints',
    'monday in holy week': 'holyMon', 'tuesday in holy week': 'holyTue', 'wednesday in holy week': 'holyWed',
    'christmas eve': 'christmasDay', 'christmas': 'christmasDay', 'the holy name': 'holyName',
    'transfiguration': 'transfiguration', 'presentation': 'presentation', 'annunciation': 'annunciation',
    'visitation': 'visitation', 'epiphany': 'epiphany',
  })
  if (table[q]) return table[q]
  const hit = Object.keys(table).find(n => n.includes(q) || q.includes(n))
  return hit ? table[hit] : null
}

// ─── Keys for a slug in a given lectionary year ──────────────────────────────
const YEAR_SPECIFIC = new Set(['allSaints', 'thanksgiving', 'easterDay', 'ascension', 'pentecost', 'trinity',
  'palmSunday', 'easterVigil'])

function keyFor(slug, year) {
  if (YEAR_SPECIFIC.has(slug)) return `${year}.${slug}`
  if (slug === 'christmasDay') return 'ABC.christmasDay1'
  return `ABC.${slug}`
}

function describe(key, extra = {}) {
  const e = EPISCOPAL_LECTIONARY[key]
  return e ? { key, name: e.name, ...extra } : null
}

// ─── Core: what is this date? ────────────────────────────────────────────────
// Returns { primary: {key,name}, also: [{key,name}], season, year, sundayName } or null.
export function getEpiscopalDay(dateString) {
  if (!dateString) return null
  const ms = parse(dateString)
  const y = yearOf(ms)
  const year = getEpiscopalYear(dateString)
  const E = easterOf(y)
  const at = n => E + n * DAY                      // Easter ± n days
  const isSunday = dowOf(ms) === 0

  // — the temporal cycle (seasons) —
  let temporal = null   // { slug|key, season, sundayName }
  const T = (key, season, sundayName) => ({ key, season, sundayName })

  const advent1 = adventOne(y)
  const pentecost = at(49)
  const trinity = at(56)
  const ashWed = at(-46)

  if (ms === ashWed) temporal = T('ABC.ashWednesday', 'Lent', 'Ash Wednesday')
  else if (ms >= at(-6) && ms <= at(-1)) {
    const slugs = { [-6]: 'holyMon', [-5]: 'holyTue', [-4]: 'holyWed', [-3]: 'maundyThursday', [-2]: 'goodFriday', [-1]: 'holySaturday' }
    const slug = slugs[(ms - E) / DAY]
    temporal = T(`ABC.${slug}`, 'Holy Week', EPISCOPAL_LECTIONARY[`ABC.${slug}`]?.name || 'Holy Week')
  } else if (ms === at(39)) temporal = T(`${year}.ascension`, 'Easter', 'Ascension Day')
  else if (isSunday) {
    if (ms >= advent1 && ms < utc(y, 12, 25)) {
      const n = (ms - advent1) / (7 * DAY) + 1
      temporal = T(`${year}.adv${n}`, 'Advent', `${ORDINALS[n]} Sunday of Advent`)
    } else if (ms >= utc(y, 12, 26)) {
      temporal = T('ABC.christmas1', 'Christmas', 'First Sunday after Christmas Day')
    } else if (ms <= utc(y, 1, 5)) {
      temporal = ms >= utc(y, 1, 2)
        ? T('ABC.christmas2', 'Christmas', 'Second Sunday after Christmas Day')
        : T('ABC.christmas1', 'Christmas', 'First Sunday after Christmas Day')
    } else if (ms === utc(y, 1, 6)) {
      temporal = null                                   // The Epiphany itself (fixed feast)
    } else if (ms < ashWed) {
      const epi1 = utc(y, 1, 6) + ((7 - dowOf(utc(y, 1, 6))) % 7 || 7) * DAY   // first Sunday after Jan 6
      if (ms === at(-49)) temporal = T(`${year}.epiLast`, 'Epiphany', 'Last Sunday after the Epiphany')
      else {
        const n = (ms - epi1) / (7 * DAY) + 1
        temporal = T(`${year}.epi${n}`, 'Epiphany', n === 1 ? 'First Sunday after the Epiphany · The Baptism of Our Lord' : `${ORDINALS[n]} Sunday after the Epiphany`)
      }
    } else if (ms < at(-7)) {
      const n = (ms - at(-42)) / (7 * DAY) + 1
      temporal = T(`${year}.lent${n}`, 'Lent', `${ORDINALS[n]} Sunday in Lent`)
    } else if (ms === at(-7)) temporal = T(`${year}.palmSunday`, 'Holy Week', 'Palm Sunday · Sunday of the Passion')
    else if (ms === E) temporal = T(`${year}.easterDay`, 'Easter', 'Easter Day')
    else if (ms < pentecost) {
      const n = (ms - E) / (7 * DAY) + 1
      temporal = T(`${year}.easter${n}`, 'Easter', `${ORDINALS[n]} Sunday of Easter`)
    } else if (ms === pentecost) temporal = T(`${year}.pentecost`, 'Pentecost', 'The Day of Pentecost')
    else if (ms === trinity) temporal = T(`${year}.trinity`, 'Pentecost', 'Trinity Sunday')
    else if (ms > trinity && ms < advent1) {
      // Proper N = the Sunday closest to (June 1 + 7·(N−4))
      const n = 4 + Math.round((ms - utc(y, 6, 1)) / (7 * DAY))
      const afterPentecost = (ms - pentecost) / (7 * DAY)
      temporal = T(`${year}.prop${n}`, 'Season after Pentecost', `${ORDINALS[afterPentecost]} Sunday after Pentecost · Proper ${n}`)
    }
  }

  // — fixed Holy Days, with transfers when they collide with a Sunday or each other —
  const feasts = observedFeasts(y, E)
  const todaysFeasts = feasts.filter(f => f.ms === ms)

  const also = []
  let primary = null
  let season = temporal?.season || null
  let sundayName = temporal?.sundayName || null

  // Christmas season & fixed-feast seasons for non-Sundays
  if (!season) {
    if (ms >= utc(y, 12, 25) || ms <= utc(y, 1, 5)) season = 'Christmas'
    else if (ms >= utc(y, 1, 6) && ms < ashWed) season = 'Epiphany'
    else if (ms >= advent1) season = 'Advent'
    else if (ms > E && ms < pentecost) season = 'Easter'
    else if (ms >= pentecost) season = 'Season after Pentecost'
  }

  const inLentAdventEaster = temporal && ['Advent', 'Lent', 'Holy Week', 'Easter'].includes(temporal.season) && isSunday
  for (const f of todaysFeasts) {
    const key = keyFor(f.slug, year)
    const d = describe(key)
    if (!d) continue
    if (f.slug === 'christmasDay') {
      d.name = 'Christmas Day I · The Nativity'
      for (const k of ['ABC.christmasDay2', 'ABC.christmasDay3']) { const x = describe(k); if (x) also.push(x) }
    }
    if (isSunday && temporal) {
      if (f.overrides && !inLentAdventEaster && f.slug !== 'christmasDay') primary = d
      else also.push(d)
    } else if (!primary) primary = d
    else also.push(d)
  }

  // Christmas Eve (Dec 24): the Nativity lessons may be used that evening
  if (ms === utc(y, 12, 24)) {
    const x = describe('ABC.christmasDay1', { name: 'Christmas Day I · The Nativity (Christmas Eve)' })
    if (x) { primary = primary || (temporal ? null : x); if (temporal) also.push(x) }
    for (const k of ['ABC.christmasDay2', 'ABC.christmasDay3']) { const z = describe(k); if (z) also.push(z) }
  }
  // Holy Saturday evening: the Great Vigil
  if (ms === at(-1)) { const v = describe(`${year}.easterVigil`); if (v) also.push(v) }

  // Thanksgiving Day: fourth Thursday of November
  if (dowOf(ms) === 4 && new Date(ms).getUTCMonth() === 10 && Math.ceil(new Date(ms).getUTCDate() / 7) === 4) {
    const t = describe(`${year}.thanksgiving`); if (t) { if (!primary && !temporal) primary = t; else also.push(t) }
  }

  // All Saints may replace the Sunday following Nov 1 (Nov 2–8)
  if (isSunday && temporal && ms > utc(y, 11, 1) && ms <= utc(y, 11, 7)) {
    const a = describe(`${year}.allSaints`); if (a) also.push(a)
  }

  if (!primary && temporal) primary = describe(temporal.key, { name: temporal.sundayName })
  if (!primary) return null

  // A feast that wins the day keeps the Sunday's own lessons as an alternate
  if (temporal && primary.key !== temporal.key) {
    const t = describe(temporal.key, { name: temporal.sundayName }); if (t && !also.find(a => a.key === t.key)) also.unshift(t)
  }

  const isFeastPrimary = !temporal || primary.key !== temporal.key
  return {
    primary,
    also,
    season: season || 'Season after Pentecost',
    year,
    sundayName: isFeastPrimary ? primary.name : sundayName,
    isSunday,
  }
}

// Fixed Holy Days with BCP transfer rules applied for a calendar year.
function observedFeasts(y, E) {
  const out = []
  const taken = new Set()
  const sundays = ms => dowOf(ms) === 0
  const annunciationTransfer = E + 8 * DAY   // Monday after the Second Sunday of Easter
  // Overriding feasts first so they claim their dates
  for (const [m, d, slug] of FIXED.filter(f => f[3])) {
    const ms = utc(y, m, d)
    out.push({ slug, ms, overrides: true }); taken.add(ms)
  }
  for (const [m, d, slug] of FIXED.filter(f => !f[3])) {
    let ms = utc(y, m, d)
    const inHolyWeekOrEasterWeek = x => x >= E - 7 * DAY && x <= E + 6 * DAY
    if (slug === 'annunciation' && inHolyWeekOrEasterWeek(ms)) ms = annunciationTransfer
    while (sundays(ms) || taken.has(ms) || (slug !== 'annunciation' && inHolyWeekOrEasterWeek(ms))) ms += DAY
    out.push({ slug, ms, overrides: false }); taken.add(ms)
  }
  return out
}

// ─── Public: readings for a date / feast ──────────────────────────────────────
function toReading(r) {
  return { id: r.id, label: r.label, reference: r.reference, alternates: r.alternates || [], textRefs: r.textRefs || null,
    translation: 'WEB', text: '', hasShortVersion: false }
}

function readingsFromEntry(entry, track) {
  const set = track === 2 && entry.track2 ? entry.track2 : entry.readings
  return set.map(toReading)
}

export function getEpiscopalInfo(dateString) {
  const day = getEpiscopalDay(dateString)
  if (!day) return { season: '', liturgicalYear: getEpiscopalYear(dateString), sundayName: '', feastName: '' }
  return { season: day.season, liturgicalYear: day.year, sundayName: day.sundayName, feastName: '' }
}

// Main entry point, mirrors getReadingsForOccasion() in lectionary.js
export function getEpiscopalReadings({ date, occasion, feastName, track = 1, observe }) {
  const base = { pickerMode: 'standard', translationDefault: 'WEB' }
  const todayYear = () => {
    const t = new Date()
    return getEpiscopalYear(fmt(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate())))
  }

  // 1. A named feast (Holy Day / Feast search, Ash Wednesday button)
  const wanted = feastName || (occasion === 'Ash Wednesday' ? 'Ash Wednesday' : '')
  if (wanted.trim()) {
    const slug = slugForName(wanted)
    if (slug) {
      const year = date ? getEpiscopalYear(date) : todayYear()
      let key = keyFor(slug, year)
      if (slug === 'christmasDay' && /eve|^christmas$/i.test(wanted) === false) key = 'ABC.christmasDay3'
      const entry = EPISCOPAL_LECTIONARY[key]
      if (entry) {
        const also = slug === 'christmasDay' ? ['ABC.christmasDay1', 'ABC.christmasDay2', 'ABC.christmasDay3'].filter(k => k !== key).map(k => describe(k)) : []
        return { ...base, readings: readingsFromEntry(entry, track), entry, key, track2Available: Boolean(entry.track2), feastName: entry.name, also }
      }
    }
  }

  if (!date) return { ...base, readings: [], feastName: null, notFound: true }

  // 2. A date: the Sunday or Holy Day it falls on (or an observed alternate the user picked)
  const day = getEpiscopalDay(date)
  if (!day) return { ...base, readings: [], feastName: null, notFound: true, year: getEpiscopalYear(date) }
  const all = [day.primary, ...day.also]
  const chosen = (observe && all.find(a => a.key === observe)) || day.primary
  const entry = EPISCOPAL_LECTIONARY[chosen.key]
  const alsoList = all.filter(a => a.key !== chosen.key)
  const isFeast = !day.isSunday || chosen.key !== day.primary.key || chosen.key.startsWith('ABC.') || /allSaints|thanksgiving/.test(chosen.key)
  return {
    ...base,
    readings: readingsFromEntry(entry, track),
    entry,
    key: chosen.key,
    track2Available: Boolean(entry.track2),
    feastName: isFeast && !/\.(prop\d+|adv\d|lent\d|epi\w+|easter\d)$/.test(chosen.key) ? entry.name : null,
    sundayName: day.sundayName,
    season: day.season,
    year: day.year,
    also: alsoList,
  }
}
