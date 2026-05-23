import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'

const TELEMETRY_PATH = path.resolve('public/telemetry.json')

// Vite dev plugin: intercepts POST /api/telemetry and appends to telemetry.json on disk
function telemetryPlugin() {
  return {
    name: 'telemetry-watcher',
    configureServer(server) {
      server.middlewares.use('/api/telemetry', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', () => {
          try {
            const event = JSON.parse(body)
            let store = { version: 1, events: [] }
            if (fs.existsSync(TELEMETRY_PATH)) {
              store = JSON.parse(fs.readFileSync(TELEMETRY_PATH, 'utf8'))
            }
            store.events.push(event)
            fs.writeFileSync(TELEMETRY_PATH, JSON.stringify(store, null, 2))
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch (e) {
            res.statusCode = 400; res.end(JSON.stringify({ error: String(e) }))
          }
        })
      })
    }
  }
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: './src/tests/setup.ts',
    testTimeout: 30000,
    include: ['src/tests/**/*.test.ts'],
  },
  server: {
    proxy: {
      // /api/telemetry is handled by telemetryPlugin above
      // All other /api/* routes proxy to the local backend
      '/api/(?!telemetry)': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: path => path,
      },
    },
  },
  plugins: [
    telemetryPlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Oráculo de Vidas Pasadas',
        short_name: 'Oráculo',
        description: 'Sanación espiritual a través de la resonancia ancestral.',
        theme_color: '#050505',
        background_color: '#050505',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
