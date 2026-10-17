import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'unplugin-dts/vite'
import cssInjectedByJs from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  plugins: [
    vue(),
    cssInjectedByJs(),
    dts({
      processor: 'vue',
      include: ['src'],
      outDirs: ['dist'],
      insertTypesEntry: true,
      // Keep `js-pointing-cursor` imports in .d.ts (runtime core is bundled).
      bundleTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'VuePointingCursor',
      fileName: (format) =>
        format === 'es' ? 'vue-pointing-cursor.js' : 'vue-pointing-cursor.cjs',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // Bundle js-pointing-cursor so consumers only need vue-pointing-cursor + vue.
      external: ['vue'],
      output: {
        exports: 'named',
        globals: { vue: 'Vue' },
      },
    },
  },
})
