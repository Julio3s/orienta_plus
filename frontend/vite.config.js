import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const DEFAULT_ALLOWED_HOSTS = [
  '.ngrok-free.app',
  '.ngrok.app',
  '.ngrok-free.dev',
  '.ngrok.dev',
  '.ngrok.io',
]

const extraAllowedHosts = (process.env.VITE_ALLOWED_HOSTS || '')
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean)

const allowedHosts = [...new Set([...DEFAULT_ALLOWED_HOSTS, ...extraAllowedHosts])]

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts,
    hmr: {
      clientPort: 443,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts,
  },
  build: {
    outDir: 'dist',
  },
})
