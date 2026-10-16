import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      'vue-cursor': fileURLToPath(new URL('../src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: fileURLToPath(new URL('../playground-dist', import.meta.url)),
    emptyOutDir: true,
  },
})
