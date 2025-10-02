import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/app/src/php': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
