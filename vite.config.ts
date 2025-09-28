// vite.config.ts
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),

    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      // compilerOptions: {
      //   emitDeclarationOnly: true,
      // },
      copyDtsFiles: true,
      exclude: ['**/*.test.*'],
      // 可选：指定输出目录
      outDir: 'dist',
    }),
    // visualizer({
    //   filename: 'dist/stats.html', // ✅ 明确路径
    //   open: false, // 构建完后手动打开
    //   gzipSize: true,
    //   brotliSize: true,
    //   template: 'treemap', // 或 'sunburst', 'network'
    // }),
  ],
  build: {
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/libs/Video/index.ts'),
      name: 'CluoubVideo',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'uuid'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'reactJsxRuntime',
          'uuid': 'uuid'
        },
      },
    },
  }
});