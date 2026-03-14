/**
 * Netlify Function — Claude API proxy
 *
 * Forwards POST /api/claude → Anthropic Messages API.
 * The API key is stored as a Netlify environment variable (ANTHROPIC_KEY),
 * never exposed to the browser.
 *
 * Set it in: Netlify dashboard → Site settings → Environment variables
 *   Key:   ANTHROPIC_KEY
 *   Value: sk-ant-...
 */
export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.ANTHROPIC_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_KEY environment variable not set' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const body = await req.text()

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body,
  })

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
    },
  })
}

export const config = { path: '/api/claude' }
