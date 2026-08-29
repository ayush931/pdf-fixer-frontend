import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    allowedHosts: true,
    fs: {
      strict: false,
    },
    proxy: {
      '/api': {
        target: 'http://15.207.247.55:8000',
        changeOrigin: true,
      },
    },
  },
})
