import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
  base: '/TeleGoWebApp/',
  plugins: [svgr(), react()],
  server: {
    https: {
      key: 'C:\\utils\\diasksu.github.io+2-key.pem',
      cert: 'C:\\utils\\diasksu.github.io+2.pem'
    },
    port: 443
  }
})
