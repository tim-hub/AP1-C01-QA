import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/ap1-c01-qa/', // GitHub Pages project site path (match repo name)
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@AP1-C01': path.resolve(__dirname, './AP1-C01'),
    },
  },
})
