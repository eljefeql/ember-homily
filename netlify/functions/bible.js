/**
 * bible.js — Netlify serverless function: scripture proxy
 *
 * Primary:  api.bible (NRSV) — requires BIBLE_API_KEY env var
 * Fallback: bible-api.com (WEB) — used if BIBLE_API_KEY is not set
 *
 * Route: /api/scripture?ref=John+20:1-9
 */

// ── Book name → USFM code ──────────────────────────────────────────────────
const BOOK_CODES = {
  // Old Testament
  'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM',
  'Deuteronomy': 'DEU', 'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT',
  '1 Samuel': '1SA', '2 Samuel': '2SA', '1 Kings': '1KI', '2 Kings': '2KI',
  '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR', 'Nehemiah': 'NEH',
  'Esther': 'EST', 'Job': 'JOB', 'Psalm': 'PSA', 'Psalms': 'PSA',
  'Proverbs': 'PRO', 'Ecclesiastes': 'ECC',
  'Song of Songs': 'SNG', 'Song of Solomon': 'SNG',
  'Isaiah': 'ISA', 'Jeremiah': 'JER', 'Lamentations': 'LAM',
  'Ezekiel': 'EZK', 'Daniel': 'DAN', 'Hosea': 'HOS', 'Joel': 'JOL',
  'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON', 'Micah': 'MIC',
  'Nahum': 'NAH', 'Habakkuk': 'HAB', 'Zephaniah': 'ZEP', 'Haggai': 'HAG',
  'Zechariah': 'ZEC', 'Malachi': 'MAL',
  // Catholic deuterocanonicals
  'Tobit': 'TOB', 'Judith': 'JDT',
  '1 Maccabees': '1MA', '2 Maccabees': '2MA',
  'Wisdom': 'WIS', 'Sirach': 'SIR', 'Ecclesiasticus': 'SIR',
  'Baruch': 'BAR',
  // New Testament
  'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN',
  'Acts': 'ACT', 'Romans': 'ROM',
  '1 Corinthians': '1CO', '2 Corinthians': '2CO',
  'Galatians': 'GAL', 'Ephesians': 'EPH', 'Philippians': 'PHP',
  'Colossians': 'COL', '1 Thessalonians': '1TH', '2 Thessalonians': '2TH',
  '1 Timothy': '1TI', '2 Timothy': '2TI', 'Titus': 'TIT', 'Philemon': 'PHM',
  'Hebrews': 'HEB', 'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE',
  '1 John': '1JO', '2 John': '2JO', '3 John': '3JO', 'Jude': 'JUD',
  'Revelation': 'REV',
}

/**
 * Split non-contiguous within-chapter references into individual segments.
 * "Psalm 118:1-2,16-17,22-23" → ["Psalm 118:1-2", "Psalm 118:16-17", "Psalm 118:22-23"]
 * "John 20:1-9" → ["John 20:1-9"] (unchanged — no comma)
 */
function splitSegments(ref) {
  const colonIdx = ref.indexOf(':')
  if (colonIdx === -1) return [ref]
  const prefix = ref.slice(0, colonIdx)       // e.g. "Psalm 118"
  const versesPart = ref.slice(colonIdx + 1)  // e.g. "1-2,16-17,22-23"
  if (!versesPart.includes(',')) return [ref]
  return versesPart.split(',').map(v => `${prefix}:${v.trim()}`)
}

/**
 * Convert a single clean reference to an api.bible passage ID.
 * "John 20:1-9"        → "JHN.20.1-JHN.20.9"
 * "Isaiah 52:13-53:12" → "ISA.52.13-ISA.53.12"
 * "John 20:1"          → "JHN.20.1"
 */
function toPassageId(ref) {
  // Match: BookName Chapter:StartVerse[-[EndChapter:]EndVerse]
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+):(\d+)|-(\d+))?$/)
  if (!m) return null

  const [, bookName, startChap, startVerse, crossChap, crossVerse, sameChapVerse] = m
  const code = BOOK_CODES[bookName.trim()]
  if (!code) return null

  const start = `${code}.${startChap}.${startVerse}`

  if (crossChap && crossVerse) {
    // Cross-chapter range: Isaiah 52:13-53:12
    return `${start}-${code}.${crossChap}.${crossVerse}`
  }
  if (sameChapVerse) {
    // Same-chapter range: John 20:1-9
    return `${start}-${code}.${startChap}.${sameChapVerse}`
  }
  // Single verse
  return start
}

/**
 * Fetch one passage segment from api.bible.
 */
async function fetchFromApiBible(passageId, apiKey, bibleId) {
  const endpoint =
    `https://api.scripture.api.bible/v1/bibles/${bibleId}/passages/${encodeURIComponent(passageId)}` +
    `?content-type=text&include-notes=false&include-titles=false` +
    `&include-chapter-numbers=false&include-verse-numbers=false&include-verse-spans=false`

  const res = await fetch(endpoint, { headers: { 'api-key': apiKey } })
  if (!res.ok) return ''
  const data = await res.json()
  // Clean up api.bible's text: collapse whitespace, remove stray control chars
  return (data?.data?.content || '')
    .replace(/[\r\n]+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

/**
 * Fallback: fetch from bible-api.com (WEB translation).
 */
async function fetchFromBibleApiCom(ref) {
  const apiPath = ref.replace(/\s+/g, '+')
  const res = await fetch(`https://bible-api.com/${apiPath}`, {
    headers: { 'User-Agent': 'Ember-Homily-App/1.0' },
  })
  return res.json()
}

// ── Main handler ────────────────────────────────────────────────────────────

export default async (request) => {
  const url = new URL(request.url)
  const ref = url.searchParams.get('ref') || ''

  const CORS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=86400',
  }

  if (!ref.trim()) {
    return new Response(JSON.stringify({ error: 'ref parameter required' }), {
      status: 400, headers: CORS,
    })
  }

  const apiKey = process.env.BIBLE_API_KEY
  const bibleId = process.env.BIBLE_ID || 'de4e12af7f28f599-02' // NRSV default

  // ── api.bible path (NRSV) ────────────────────────────────────────────────
  if (apiKey) {
    try {
      const segments = splitSegments(ref)
      const texts = await Promise.all(
        segments.map(async seg => {
          const passageId = toPassageId(seg)
          if (!passageId) return ''
          return fetchFromApiBible(passageId, apiKey, bibleId)
        })
      )
      const text = texts.filter(Boolean).join('\n\n')
      return new Response(JSON.stringify({ text, verses: [], translation: 'NRSV' }), {
        status: 200, headers: CORS,
      })
    } catch (err) {
      // Fall through to fallback on error
      console.error('[bible] api.bible error:', err.message)
    }
  }

  // ── Fallback: bible-api.com (WEB) ────────────────────────────────────────
  try {
    const data = await fetchFromBibleApiCom(ref)
    return new Response(JSON.stringify(data), { status: 200, headers: CORS })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502, headers: CORS,
    })
  }
}

export const config = { path: '/api/scripture' }
