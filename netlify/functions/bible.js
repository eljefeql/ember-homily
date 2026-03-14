/**
 * bible.js — Netlify serverless function that proxies bible-api.com
 *
 * bible-api.com dropped their CORS headers, so browser fetches from our
 * Netlify domain are blocked. This function runs server-side, has no CORS
 * restriction, fetches the passage, and returns it to the client.
 *
 * Route (set via config below): /api/scripture?ref=John+9:1-41
 */
export default async (request) => {
  const url = new URL(request.url)
  const ref = url.searchParams.get('ref') || ''

  if (!ref.trim()) {
    return new Response(JSON.stringify({ error: 'ref parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // bible-api.com path format: spaces as +, colons unencoded
  const apiPath = ref.replace(/\s+/g, '+')
  const apiUrl = `https://bible-api.com/${apiPath}`

  try {
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Ember-Homily-App/1.0' },
    })
    const data = await res.json()

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400', // cache 24h — scripture doesn't change
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

export const config = { path: '/api/scripture' }
