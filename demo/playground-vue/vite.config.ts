import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      'vue-pointing-cursor': fileURLToPath(
        new URL('../../packages/vue/src/index.ts', import.meta.url),
      ),
      'js-pointing-cursor': fileURLToPath(
        new URL('../../packages/core/src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: fileURLToPath(new URL('../../playground-dist/vue', import.meta.url)),
    emptyOutDir: true,
  },
})
