import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Nexora-Frontend/',
  server: {
    https: true,
    host: true
  }
})