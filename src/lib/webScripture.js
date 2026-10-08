/**
 * webScripture.js — scripture text for the Episcopal / RCL readings, in the World English Bible (WEB).
 *
 * WEB is public domain, so it can be shown in full inside the app (the NRSV that the Episcopal
 * lectionary prescribes is licensed). Text comes from the free Bible API at bible.helloao.org,
 * which serves static JSON per chapter with `Access-Control-Allow-Origin: *`, so the browser
 * fetches it directly — no proxy or API key needed.
 *
 * Lectionary citations are messier than "Book 1:1-5": optional verses in (parentheses) and
 * [brackets], verse-part letters (13b), discontinuous ranges, cross-chapter ranges, and
 * psalms cited by chapter alone. parseReference() handles all of those. Optional verses are
 * INCLUDED in the text; the printed reference still shows them in brackets.
 */

const API = 'https://bible.helloao.org/api'
const PROTESTANT = 'ENGWEBP'   // World English Bible (66-book canon)
const CATHOLIC = 'eng_webc'    // World English Bible incl. deuterocanon (Wisdom, Sirach, Baruch…)

// book name → [USFM code, translation id]
const P = c => [c, PROTESTANT]
const D = c => [c, CATHOLIC]
const BOOKS = {
  'Genesis': P('GEN'), 'Exodus': P('EXO'), 'Leviticus': P('LEV'), 'Numbers': P('NUM'), 'Deuteronomy': P('DEU'),
  'Joshua': P('JOS'), 'Judges': P('JDG'), 'Ruth': P('RUT'), '1 Samuel': P('1SA'), '2 Samuel': P('2SA'),
  '1 Kings': P('1KI'), '2 Kings': P('2KI'), '1 Chronicles': P('1CH'), '2 Chronicles': P('2CH'), 'Ezra': P('EZR'),
  'Nehemiah': P('NEH'), 'Esther': P('EST'), 'Job': P('JOB'), 'Psalm': P('PSA'), 'Psalms': P('PSA'),
  'Proverbs': P('PRO'), 'Ecclesiastes': P('ECC'), 'Song of Solomon': P('SNG'), 'Song of Songs': P('SNG'),
  'Isaiah': P('ISA'), 'Jeremiah': P('JER'), 'Lamentations': P('LAM'), 'Ezekiel': P('EZK'), 'Daniel': P('DAN'),
  'Hosea': P('HOS'), 'Joel': P('JOL'), 'Amos': P('AMO'), 'Obadiah': P('OBA'), 'Jonah': P('JON'), 'Micah': P('MIC'),
  'Nahum': P('NAM'), 'Habakkuk': P('HAB'), 'Zephaniah': P('ZEP'), 'Haggai': P('HAG'), 'Zechariah': P('ZEC'),
  'Malachi': P('MAL'),
  'Matthew': P('MAT'), 'Mark': P('MRK'), 'Luke': P('LUK'), 'John': P('JHN'), 'Acts': P('ACT'), 'Romans': P('ROM'),
  '1 Corinthians': P('1CO'), '2 Corinthians': P('2CO'), 'Galatians': P('GAL'), 'Ephesians': P('EPH'),
  'Philippians': P('PHP'), 'Colossians': P('COL'), '1 Thessalonians': P('1TH'), '2 Thessalonians': P('2TH'),
  '1 Timothy': P('1TI'), '2 Timothy': P('2TI'), 'Titus': P('TIT'), 'Philemon': P('PHM'), 'Hebrews': P('HEB'),
  'James': P('JAS'), '1 Peter': P('1PE'), '2 Peter': P('2PE'), '1 John': P('1JN'), '2 John': P('2JN'),
  '3 John': P('3JN'), 'Jude': P('JUD'), 'Revelation': P('REV'),
  // Deuterocanonical books the RCL uses
  'Wisdom': D('WIS'), 'Sirach': D('SIR'), 'Baruch': D('BAR'), 'Judith': D('JDT'), 'Tobit': D('TOB'),
  '1 Maccabees': D('1MA'), '2 Maccabees': D('2MA'), 'Song of the Three': D('DAG'), 'Susanna': D('DAG'),
  '2 Esdras': ['2ES', 'eng_weu'],     // WEB British Edition (the only WEB with 2 Esdras)
}
const SINGLE_CHAPTER = new Set(['Obadiah', 'Philemon', '2 John', '3 John', 'Jude'])

/**
 * "Hebrews 10:11-14 (15-18) 19-25" → { book, segments: [{ c1, v1, c2, v2 }] }
 * v1/v2 null = whole chapter (start/end). Returns null if the reference can't be understood.
 */
export function parseReference(reference) {
  let s = String(reference || '')
    .replace(/[–—]/g, '-')
    .replace(/[()[\]]/g, ' ')            // optional verses are read, so just drop the markers
    .replace(/(\d):\s+/g, '$1:')
    .replace(/\s+/g, ' ')
    .trim()
  const m = s.match(/^((?:[1-3] )?[A-Za-z][A-Za-z ]*?)\s+(\d.*)$/)
  if (!m) return null
  const book = m[1].trim()
  if (!BOOKS[book]) return null
  let rest = m[2]
  if (SINGLE_CHAPTER.has(book)) rest = `1:${rest}`

  const segments = []
  let chapter = null
  // tokens: 12  |  12-15  |  3:5  |  3:5-9  |  3:5-4:2  (each with optional trailing a/b/c)
  const re = /(\d+)(?::(\d+))?[a-c]?(?:\s*-\s*(\d+)(?::(\d+))?[a-c]?)?/g
  let t
  while ((t = re.exec(rest))) {
    const [, n1, n2, n3, n4] = t
    if (n2 !== undefined) {                          // C:V…
      chapter = Number(n1)
      if (n4 !== undefined) segments.push({ c1: chapter, v1: Number(n2), c2: Number(n3), v2: Number(n4) })
      else segments.push({ c1: chapter, v1: Number(n2), c2: chapter, v2: n3 !== undefined ? Number(n3) : Number(n2) })
      if (n4 !== undefined) chapter = Number(n3)
    } else if (chapter === null) {                   // first token with no colon = whole chapter(s)
      const c1 = Number(n1), c2 = n3 !== undefined ? Number(n3) : c1
      segments.push({ c1, v1: null, c2, v2: null })
      chapter = c2
      if (n3 === undefined) chapter = null          // "Psalm 103" – a later bare number is another chapter
    } else {                                         // verses within the current chapter
      segments.push({ c1: chapter, v1: Number(n1), c2: chapter, v2: n3 !== undefined ? Number(n3) : Number(n1) })
    }
  }
  // Merge back-to-back pieces (optional verses split by parentheses) into one continuous reading
  const merged = []
  for (const seg of segments) {
    const last = merged[merged.length - 1]
    if (last && last.v2 !== null && seg.v1 !== null && last.c2 === seg.c1 && seg.v1 === last.v2 + 1) { last.c2 = seg.c2; last.v2 = seg.v2 }
    else merged.push({ ...seg })
  }
  return merged.length ? { book, segments: merged } : null
}

// ─── Fetch + format ───────────────────────────────────────────────────────────
const chapterCache = new Map()

function loadChapter(book, chapter) {
  const [code, tr] = BOOKS[book]
  const key = `${tr}/${code}/${chapter}`
  if (!chapterCache.has(key)) {
    chapterCache.set(key, fetch(`${API}/${tr}/${code}/${chapter}.json`).then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status} for ${key}`)
      return r.json()
    }).catch(err => { chapterCache.delete(key); throw err }))
  }
  return chapterCache.get(key)
}

// One verse → { text, poetry }. Poetry lines (poem flag) each get their own line; prose runs together.
function verseText(verse) {
  let out = ''
  let poetry = false
  for (const piece of verse.content || []) {
    const gap = out && !out.endsWith('\n') ? ' ' : ''
    if (typeof piece === 'string') out += gap + piece
    else if (piece.lineBreak) out += poetry ? '\n' : '\n\n'
    else if (typeof piece.text === 'string') {
      if (piece.poem) { out += (out && !out.endsWith('\n') ? '\n' : '') + piece.text; poetry = true }
      else out += gap + piece.text
    }
  }
  return { text: out, poetry }
}

function chapterVerses(data, from, to) {
  const verses = []
  for (const item of data.chapter?.content || []) {
    if (item.type !== 'verse' || item.number < from || item.number > to) continue
    verses.push(verseText(item))
  }
  return verses
}

// The WEB prints the closing doxology of Romans (16:25-27 in most Bibles) after 14:23.
// Likewise, the Prayer of Azariah / Song of the Three and Susanna are chapters of Daniel in the WEB.
export const REMAP = {
  'Romans 16:25-27': 'Romans 14:24-26',
  'Azariah 1:28-34,52-59,68': 'Song of the Three 3:51-57, 75-82, 90',
  'Susanna 34-46': 'Susanna 13:34-46',
}

const cache = new Map()

/** Fetch the WEB text for a lectionary reference. Returns '' if it can't be found. */
export async function fetchWebPassage(reference) {
  if (cache.has(reference)) return cache.get(reference)
  const parsed = parseReference(REMAP[reference] || reference)
  if (!parsed) { console.warn('[webScripture] cannot parse reference:', reference); return '' }

  try {
    const blocks = []
    for (const seg of parsed.segments) {
      const parts = []
      for (let c = seg.c1; c <= seg.c2; c++) {
        const data = await loadChapter(parsed.book, c)
        const from = c === seg.c1 && seg.v1 !== null ? seg.v1 : 1
        const to = c === seg.c2 && seg.v2 !== null ? seg.v2 : Infinity
        parts.push(...chapterVerses(data, from, to))
      }
      blocks.push(joinVerses(parts))
    }
    const text = blocks.filter(Boolean).join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
    cache.set(reference, text)
    return text
  } catch (err) {
    console.warn('[webScripture] fetch failed for', reference, err.message)
    return ''
  }
}

function joinVerses(verses) {
  let out = ''
  let prev = null
  for (const v of verses) {
    if (!v.text) continue
    if (prev) out += (prev.poetry || v.poetry) && !out.endsWith('\n') ? '\n' : (out.endsWith('\n') ? '' : ' ')
    out += v.text
    prev = v
  }
  return out
}

/** Fetch text for every reading (using textRefs for BCP canticles). Returns readings with .text filled. */
export async function fetchAllWebReadings(readings) {
  return Promise.all(readings.map(async r => {
    const ref = r.textRefs?.[r.reference] || r.reference
    const text = await fetchWebPassage(ref)
    return { ...r, text, translation: 'WEB' }
  }))
}
