import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'unplugin-dts/vite'

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      outDirs: ['dist'],
      insertTypesEntry: true,
      bundleTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'JsPointingCursor',
      fileName: (format) =>
        format === 'es' ? 'js-pointing-cursor.js' : 'js-pointing-cursor.cjs',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
  },
})
