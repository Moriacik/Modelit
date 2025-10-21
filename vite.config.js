import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 1000
    },
    hmr: {
      port: 5173,
      host: 'localhost'
    },
    proxy: {
      '/app/src/php': {
        target: 'http://vaii_backend',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/app\/src\/php/, '')
      }
    }
  }
})
