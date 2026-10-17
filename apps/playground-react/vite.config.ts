import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      'react-pointing-cursor': fileURLToPath(
        new URL('../../packages/react/src/index.ts', import.meta.url),
      ),
      'js-pointing-cursor': fileURLToPath(
        new URL('../../packages/core/src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    port: 5174,
  },
  build: {
    outDir: fileURLToPath(
      new URL('../../playground-dist/react', import.meta.url),
    ),
    emptyOutDir: true,
  },
})
