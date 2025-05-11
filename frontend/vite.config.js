import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
    },
  server: {
    proxy: {
      // when fetch("/api/...")
      // Vite redirect to "http://localhost:5000/api/..."
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        ws: false,
        timeout: 0,          // no idle‐timeout
        headers: {
          Connection: 'keep-alive'  // kkep alive tcp
        },
        configure(proxy) {
          proxy.on('proxyRes', (proxyRes, req) => {
            if (req.url && req.url.includes('/training/logs')) {
              proxyRes.headers['Cache-Control'] = 'no-cache'
              proxyRes.headers['X-Accel-Buffering'] = 'no'
            }
          })
        }
      },
    },
  }
})
