// vite.config.ts
import {defineConfig} from 'vite'
import {resolve} from 'path'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import {visualizer} from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      copyDtsFiles: true,
      exclude: ['**/*.test.*'],
      // 可选：指定输出目录
      outDir: 'dist',
    }),
    visualizer({
      filename: 'dist/stats.html'
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/libs/Video/index.tsx'),
      name: 'CluoubVideo',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`
    },
    rolldownOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'lucide-react', 'uuid'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'reactJsxRuntime',
          'lucide-react': 'LucideReact',
          uuid: 'uuid'
        }
      }
    }
  }
});