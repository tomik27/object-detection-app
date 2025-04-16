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
      // Když v kódu zavoláte fetch("/api/...")
      // Vite ho přesměruje na "http://localhost:5000/api/..."
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        // Volitelně: pokud chcete, aby se '/api' odstranilo, použijte rewrite
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  }
})
