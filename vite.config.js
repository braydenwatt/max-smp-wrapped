import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://braydenwatt.github.io/max-smp-wrapped/ in production,
// but from root during local dev.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/max-smp-wrapped/' : '/',
  plugins: [react()],
  server: { host: true, port: 5173 },
}))
