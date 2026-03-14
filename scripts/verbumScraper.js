#!/usr/bin/env node
/**
 * verbumScraper.js — scrapes Logos Passage Guide + curates insights via Claude
 *
 * Usage:
 *   node scripts/verbumScraper.js "John 4:5-42"
 *
 * Outputs JSON array of InsightCard objects to stdout.
 * Errors go to stderr.
 */

import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import http from 'http'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const COOKIES_PATH = path.join(__dirname, '.logos-cookies.json')
const ENV_PATH = path.join(__dirname, '../.env')

// ── Load .env manually (no dotenv dependency needed) ─────────────────────────
function loadEnv() {
  const env = {}
  try {
    const raw = fs.readFileSync(ENV_PATH, 'utf8')
    for (const line of raw.split('\n')) {
      const match = line.match(/^([A-Z_]+)=(.+)$/)
      if (match) env[match[1]] = match[2].trim()
    }
  } catch { /* ignore */ }
  return env
}

// ── Random human-like delay ───────────────────────────────────────────────────
function delay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise(r => setTimeout(r, ms))
}

// ── Build Logos Passage Guide URL ────────────────────────────────────────────
function buildLogosUrl(passage) {
  // Convert "John 4:5-42" → "John+4%3A5%E2%80%9342" (Logos uses en-dash in URL)
  const encoded = encodeURIComponent(passage.replace(/-/, '–'))
  // Build rawReference: "John 4:5-42" → "bible.64.4.5-64.4.42"
  // We'll let Logos resolve it — just pass reference and let the page handle it
  return `https://app.verbum.com/guides/passage?reference=${encoded}`
}

// ── Call Claude via the Vite dev proxy (same route Step 7 uses) ──────────────
// Routes through localhost:5173/api/claude → Vite injects the API key server-side.
// This avoids any direct API key / billing workspace issues.
function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const req = http.request({
      hostname: 'localhost',
      port: 5173,
      path: '/api/claude',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed?.type === 'error') {
            reject(new Error('Claude API error: ' + (parsed?.error?.message || JSON.stringify(parsed))))
            return
          }
          resolve(parsed?.content?.[0]?.text || '')
        } catch (e) {
          reject(new Error('Claude parse error: ' + data.slice(0, 200)))
        }
      })
    })

    req.on('error', (err) => reject(new Error('Proxy call failed — is npm run dev running? ' + err.message)))
    req.write(body)
    req.end()
  })
}

// ── Parse raw Logos page text into InsightCards ───────────────────────────────
function parseLogosContent(text, pageUrl, passage) {
  const verbumUrl = pageUrl || `https://app.verbum.com/guides/passage?reference=${encodeURIComponent(passage)}`
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const insights = []

  // Known patristic authors
  const patristicNames = ['Augustine', 'Chrysostom', 'Origen', 'Aquinas', 'Jerome', 'Ambrose',
    'Tertullian', 'Cyril', 'Gregory', 'Basil', 'John of Damascus', 'Irenaeus', 'Athanasius',
    'Bernard', 'Bonaventure', 'Thomas', 'Clement', 'Ignatius', 'Polycarp', 'Hippolytus']

  // Known commentary sources
  const commentarySources = ['Sacra Pagina', 'Anchor Bible', 'New Jerome', 'NJBC', 'NAB',
    'Navarre', 'Haydock', 'Cornelius', 'Matthew Henry', 'Barclay', 'Keener', 'Brown',
    'Moloney', 'Fitzmyer', 'Boring', 'Harrington', 'Senior', 'Stuhlmueller',
    'Word Biblical', 'Interpretation', 'Brazos', 'Catholic Commentary']

  // Greek/Hebrew Unicode ranges
  const hasGreekHebrew = (s) => /[\u0370-\u03FF\u0400-\u04FF\u05D0-\u05EA]/.test(s)

  let i = 0
  while (i < lines.length && insights.length < 12) {
    const line = lines[i]

    // Skip very short or nav-like lines
    if (line.length < 8 || line.length > 200) { i++; continue }

    // Detect patristic content
    const isPatristic = patristicNames.some(n => line.includes(n))
    // Detect commentary content
    const isCommentary = commentarySources.some(s => line.includes(s))
    // Detect word study (Greek/Hebrew present, or "word" + transliteration pattern)
    const isLanguage = hasGreekHebrew(line) ||
      /\b(means?|derived from|Greek|Hebrew|Aramaic|lexicon|root|verb|noun|aorist|participle)\b/i.test(line)
    // Detect structural observations
    const isStructural = /\b(structure|narrative|type.scene|chiasm|inclusio|frame|bracket|pattern|allusion|echo|background|context)\b/i.test(line)

    // Collect body: current line + up to 3 following lines for substance
    const bodyLines = [line]
    let j = i + 1
    while (j < lines.length && bodyLines.length < 4 && lines[j].length > 15) {
      bodyLines.push(lines[j])
      j++
    }
    const body = bodyLines.join(' ').slice(0, 600)

    // Need at least 60 chars of real content
    if (body.length < 60) { i++; continue }

    // Determine type and extract source
    let type = 'commentary'
    let source = 'Logos Passage Guide'
    let keyword = ''
    let keywordTranslit = ''

    if (isPatristic) {
      type = 'patristic'
      const found = patristicNames.find(n => body.includes(n))
      if (found) source = found
    } else if (isLanguage) {
      type = 'language'
      // Pull out Greek/Hebrew word if present
      const match = body.match(/[\u0370-\u03FF\u05D0-\u05EA][\u0370-\u03FF\u05D0-\u05EA\s]+/)
      if (match) keyword = match[0].trim()
      // Try to find transliteration (word in italics context or after em dash)
      const translitMatch = body.match(/[–—]\s*([a-z]+(?:\s[a-z]+)?)/i)
      if (translitMatch) keywordTranslit = translitMatch[1]
    } else if (isStructural) {
      type = 'structural'
    } else if (isCommentary) {
      const found = commentarySources.find(s => body.includes(s))
      if (found) source = found
    }

    // Build a headline from the first sentence / clause (max 8 words)
    const firstClause = line.split(/[.,:;–—]/)[0].trim()
    const headlineWords = firstClause.split(/\s+/).slice(0, 8)
    const headline = headlineWords.join(' ')

    if (headline.length < 5) { i++; continue }

    // Avoid near-duplicate headlines
    const isDupe = insights.some(ins =>
      ins.headline.toLowerCase().slice(0, 20) === headline.toLowerCase().slice(0, 20)
    )
    if (isDupe) { i++; continue }

    insights.push({ type, headline, keyword, keywordTranslit, body, source, verbumUrl })
    i = j  // skip lines we already consumed
  }

  return insights
}

// ── Main scraper ──────────────────────────────────────────────────────────────
async function scrapePassageGuide(passage) {
  // Load cookies
  if (!fs.existsSync(COOKIES_PATH)) {
    throw new Error(
      'No Logos cookies found. Run: node scripts/verbumLogin.js\n' +
      'This opens a browser window where you log into Logos once.'
    )
  }
  const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf8'))

  stderr('🔍 Scraping Logos Passage Guide for: ' + passage)

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  })

  let rawData = {}

  try {
    const page = await browser.newPage()

    // Set realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    )

    // Inject saved cookies
    await page.setCookie(...cookies)

    // Human-like delay before navigation
    await delay(800, 2000)

    const url = buildLogosUrl(passage)
    stderr('   Navigating to: ' + url)

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    // Wait for passage guide content to appear
    try {
      await page.waitForSelector('h2, h3, [class*="section"], [class*="commentary"]', {
        timeout: 15000,
      })
    } catch {
      stderr('   Warning: content selector timeout, proceeding anyway...')
    }

    // Human-like pause after load
    await delay(1000, 2500)

    // Extract all text content from the page
    rawData = await page.evaluate(() => {
      // Get full page text, cleaned up
      const body = document.body.innerText || document.body.textContent || ''

      // Try to get specific sections
      const sections = {}

      // Get all headings and their following content
      const headings = document.querySelectorAll('h1, h2, h3, h4, strong')
      headings.forEach(h => {
        const text = h.textContent?.trim()
        if (text && text.length > 2 && text.length < 80) {
          // Get the next sibling content
          let content = ''
          let next = h.nextElementSibling
          let count = 0
          while (next && count < 3) {
            content += ' ' + (next.textContent || '').trim()
            next = next.nextElementSibling
            count++
          }
          if (content.trim()) {
            sections[text] = content.trim().slice(0, 500)
          }
        }
      })

      return {
        fullText: body.slice(0, 15000), // cap at 15k chars
        url: window.location.href,
        title: document.title,
      }
    })

    stderr('   Extracted ' + rawData.fullText?.length + ' chars of content')

  } finally {
    await browser.close()
  }

  // ── Parse Logos content directly — no Claude needed ─────────────────────────
  stderr('📖 Parsing Logos content...')

  const insights = parseLogosContent(rawData.fullText || '', rawData.url || '', passage)

  stderr(`   ✅ Got ${insights.length} insights`)
  return insights
}

function stderr(msg) {
  process.stderr.write(msg + '\n')
}

// ── Entry point ───────────────────────────────────────────────────────────────
const passage = process.argv[2]
if (!passage) {
  stderr('Usage: node scripts/verbumScraper.js "John 4:5-42"')
  process.exit(1)
}

scrapePassageGuide(passage)
  .then(insights => {
    // Output JSON to stdout (Vite middleware reads this)
    process.stdout.write(JSON.stringify(insights, null, 2))
    process.exit(0)
  })
  .catch(err => {
    stderr('❌ Error: ' + err.message)
    // Output empty array so the app degrades gracefully
    process.stdout.write('[]')
    process.exit(1)
  })
