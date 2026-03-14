#!/usr/bin/env node
/**
 * verbumLogin.js — one-time Logos login cookie saver
 *
 * Run this ONCE to authenticate:
 *   node scripts/verbumLogin.js
 *
 * A browser window will open. Log into Logos normally.
 * Once you're on the Logos dashboard, cookies are saved automatically.
 * You won't need to run this again unless your session expires (~90 days).
 */

import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const COOKIES_PATH = path.join(__dirname, '.logos-cookies.json')
const LOGOS_URL = 'https://app.verbum.com'

;(async () => {
  console.log('🔐 Opening Logos login...')
  console.log('   Please log in with your Verbum/Logos account.')
  console.log('   The window will close automatically once you\'re in.\n')

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  })

  const page = await browser.newPage()

  // Set a realistic user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  )

  await page.goto(LOGOS_URL, { waitUntil: 'domcontentloaded' })

  console.log('⏳ Waiting for you to log in...')

  // Poll until we see the dashboard (auth cookies present)
  let attempts = 0
  const maxAttempts = 120 // 2 minutes

  while (attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 1000))
    attempts++

    const url = page.url()
    const cookies = await page.cookies()
    const hasAuthCookie = cookies.some(c =>
      c.name.includes('auth') ||
      c.name.includes('token') ||
      c.name.includes('session') ||
      c.name.includes('logos') ||
      c.name.includes('faithlife')
    )

    // Check if we're on the dashboard/main app (not login page)
    const isDashboard = url.includes('app.verbum.com') &&
      !url.includes('/login') &&
      !url.includes('/signin') &&
      !url.includes('/auth')

    if (isDashboard && cookies.length > 3) {
      console.log('\n✅ Logged in! Saving cookies...')
      fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2))
      console.log(`   Saved to: ${COOKIES_PATH}`)
      console.log('   You\'re all set — Verbum Scholar will now use real Logos data.\n')
      await browser.close()
      process.exit(0)
    }

    if (attempts % 10 === 0) {
      process.stdout.write('.')
    }
  }

  console.error('\n❌ Timed out waiting for login. Please try again.')
  await browser.close()
  process.exit(1)
})()
