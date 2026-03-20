/**
 * bibleApi.js — fetch full scripture text via our Netlify proxy
 *
 * bible-api.com dropped CORS headers, so we proxy through a Netlify
 * serverless function at /api/scripture (netlify/functions/bible.js).
 * The function fetches server-side (no CORS restriction) and returns JSON.
 *
 * Usage:
 *   import { fetchAllReadings } from '../lib/bibleApi'
 *   const populated = await fetchAllReadings(readings)  // adds .text to each
 */

// Relative path → works on Netlify (/api/scripture) and local Netlify Dev
const PROXY_URL = '/api/scripture'

// Cache so we don't re-fetch the same passage during a session
const cache = new Map()

/**
 * Normalize a lectionary reference for bible-api.com's URL format.
 *
 * Handles:
 *  - en/em dashes → hyphens
 *  - verse-suffix letters: "13a" → "13"
 *  - semicolons → commas: "Is 43:16-17; 21" → "Is 43:16-17,21"
 *  - spaces around commas removed: "Acts 2:14, 22-33" → "Acts 2:14,22-33"
 *  - cross-chapter non-contiguous collapsed:
 *      "Hebrews 4:14-16,5:7-9" → "Hebrews 4:14-5:9"
 */
function normalizeRef(reference) {
  let ref = reference

  // 1. When multiple cycle options separated by " / " (e.g. "Matt 26:14 (A) / Mark 14:1 (B) / ..."),
  //    take only the first option.
  ref = ref.split(/\s*\/\s*/)[0]

  // 2. Strip parenthetical alternates: "(or Mark 16:1-7 at Vigil)", "(Mass at Midnight)", "(A)", etc.
  ref = ref.replace(/\s*\([^)]*\)/g, '')

  // 3. Strip square-bracket notes: "[or short form]"
  ref = ref.replace(/\s*\[[^\]]*\]/g, '')

  // 4. Strip bare " or ..." alternatives without parens: "Luke 1:26-38 or Luke 1:39-47"
  ref = ref.split(/ or /i)[0]

  // 5. Convert en-dash / em-dash to hyphen, then collapse any surrounding spaces.
  //    Handles "John 18:1 – 19:42" → "John 18:1-19:42"
  ref = ref
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\s+-\s+/g, '-')   // " - " → "-"

  // 6. Strip trailing lowercase letter from verse numbers: "13a" → "13"
  ref = ref.replace(/(?<=\d)[a-z](?=[,;\s\-]|$)/g, '')

  // 7. Semicolons → commas; tighten spaces around commas
  ref = ref
    .replace(/;/g, ',')
    .replace(/\s*,\s*/g, ',')
    .trim()

  // 8. Collapse cross-chapter non-contiguous refs to a span.
  //    e.g. "Hebrews 4:14-16,5:7-9" → "Hebrews 4:14-5:9"
  const crossChapter = ref.match(/^(.*?)(\d+):(\d+)(?:-\d+)?,(\d+):(\d+)(?:-(\d+))?/)
  if (crossChapter) {
    const [, bookPart, firstChap, firstVerse, lastChap,, lastVerse] = crossChapter
    const endVerse = lastVerse || crossChapter[5]
    ref = `${bookPart}${firstChap}:${firstVerse}-${lastChap}:${endVerse}`
  }

  return ref
}

/**
 * fetchPassage — fetch a single scripture passage by reference string.
 * Returns plain text, or '' on failure.
 */
export async function fetchPassage(reference) {
  const ref = normalizeRef(reference)
  if (!ref) return ''

  if (cache.has(ref)) return cache.get(ref)

  try {
    // Send the normalized ref as a query param to our proxy function
    const url = `${PROXY_URL}?ref=${encodeURIComponent(ref)}`
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`[bibleApi] HTTP ${res.status} for "${ref}"`)
      return ''
    }
    const data = await res.json()

    // Build text from verses array; fall back to top-level data.text if needed
    let text = ''
    if (data.verses?.length) {
      text = data.verses
        .map(v => v.text.replace(/\n+$/, ''))
        .join('\n')
        .trim()
    } else if (data.text?.trim()) {
      text = data.text.trim()
    } else if (data.error) {
      console.warn('[bibleApi] API error for', ref, ':', data.error)
    }

    cache.set(ref, text)
    return text
  } catch (err) {
    console.warn('[bibleApi] fetch failed:', err.message)
    return ''
  }
}

/**
 * fetchAllReadings — fetch text for all readings in parallel.
 * Returns a new array with .text populated on each.
 */
export async function fetchAllReadings(readings) {
  const results = await Promise.all(
    readings.map(async (reading) => {
      const text = await fetchPassage(reading.reference)
      return { ...reading, text, translation: 'NRSV' }
    })
  )
  return results
}
