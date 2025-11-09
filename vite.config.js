import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vitePluginApi from './vite-plugin-api.js'

export default defineConfig({
  plugins: [
    react(),
    // Only use API plugin in development (Netlify Functions handle API in production)
    ...(process.env.NODE_ENV !== 'production' ? [vitePluginApi()] : [])
  ],
  server: {
    port: 5173
  }
})

