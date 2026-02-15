import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'gzip' })  // ← Fixed: moved inside plugins array
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://campusly-backend-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})