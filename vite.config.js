import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      // ── Verbum API plugin — serves /api/verbum by spawning the Puppeteer scraper
      {
        name: 'verbum-api',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (!req.url?.startsWith('/api/verbum')) return next()

            const urlObj = new URL(req.url, 'http://localhost')
            const passage = urlObj.searchParams.get('passage')

            if (!passage) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'passage parameter required' }))
              return
            }

            const scraperPath = path.join(__dirname, 'scripts', 'verbumScraper.js')

            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            })

            let stdout = ''
            let timedOut = false

            const child = spawn('node', [scraperPath, passage], {
              timeout: 45000,
              cwd: __dirname,
            })

            // Timeout safety net
            const timer = setTimeout(() => {
              timedOut = true
              child.kill()
              res.end(JSON.stringify([]))
            }, 45000)

            child.stdout.on('data', (data) => { stdout += data.toString() })
            child.stderr.on('data', (data) => { process.stderr.write('[verbum] ' + data) })

            child.on('close', () => {
              if (timedOut) return
              clearTimeout(timer)
              try {
                JSON.parse(stdout)
                res.end(stdout)
              } catch {
                res.end(JSON.stringify([]))
              }
            })

            child.on('error', (err) => {
              if (timedOut) return
              clearTimeout(timer)
              process.stderr.write('[verbum] spawn error: ' + err.message + '\n')
              res.end(JSON.stringify([]))
            })
          })
        },
      },
    ],
    server: {
      proxy: {
        // Proxy /api/claude → Anthropic Messages API
        // We inject the API key here in the proxy so it's never bundled into the client
        '/api/claude': {
          target: 'https://api.anthropic.com',
          changeOrigin: true,
          rewrite: () => '/v1/messages',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('x-api-key', env.VITE_ANTHROPIC_KEY || '')
              proxyReq.setHeader('anthropic-version', '2023-06-01')
              proxyReq.setHeader('content-type', 'application/json')
              proxyReq.setHeader('anthropic-dangerous-direct-browser-access', 'true')
            })
          },
        },
        // Proxy /api/bible → api.scripture.api.bible (avoids CORS)
        '/api/bible': {
          target: 'https://api.scripture.api.bible',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/bible/, '/v1/bibles'),
        },
      },
    },
  }
})
