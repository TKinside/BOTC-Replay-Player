import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

/**
 * Static hosting:
 * - Cloudflare Pages / root domain: leave BASE_PATH unset → `/`
 * - GitHub project Pages: `BASE_PATH=/BOTC-Replay-Player/` (set in workflow)
 */
const base = process.env.BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
