import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  cacheDir: './.vite-cache',
  server: { port: 5190, strictPort: true, host: true },
})
