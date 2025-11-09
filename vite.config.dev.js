import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vitePluginApi from './vite-plugin-api.js'

// Development config with API plugin
export default defineConfig({
  plugins: [react(), vitePluginApi()],
  server: {
    port: 5173
  }
})

