import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vitePluginApi from './vite-plugin-api.js'

export default defineConfig({
  plugins: [react(), vitePluginApi()],
  server: {
    port: 5173
  }
})

