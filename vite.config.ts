import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/DEMP/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'DEMP — Fase 0',
        short_name: 'DEMP',
        display: 'standalone',
        start_url: '/',
        theme_color: '#0d3b66',
        background_color: '#f7f9fc'
      }
    })
  ],
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'] }
}))
