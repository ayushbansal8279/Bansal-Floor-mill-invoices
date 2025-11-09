import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react()
    // API plugin is excluded during build - Netlify Functions handle API in production
    // For local dev, the plugin is loaded dynamically by vite-plugin-api.js
  ],
  server: {
    port: 5173
  }
})

