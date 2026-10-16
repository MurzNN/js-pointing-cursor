import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'unplugin-dts/vite'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      processor: 'vue',
      include: ['src'],
      outDirs: ['dist'],
      insertTypesEntry: true,
      bundleTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'VueCursor',
      fileName: 'vue-cursor',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        exports: 'named',
        globals: { vue: 'Vue' },
      },
    },
  },
})
