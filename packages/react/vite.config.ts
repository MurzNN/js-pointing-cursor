import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'unplugin-dts/vite'
import cssInjectedByJs from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  plugins: [
    cssInjectedByJs(),
    dts({
      include: ['src'],
      outDirs: ['dist'],
      insertTypesEntry: true,
      bundleTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'ReactPointingCursor',
      fileName: (format) =>
        format === 'es'
          ? 'react-pointing-cursor.js'
          : 'react-pointing-cursor.cjs',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
