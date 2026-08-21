// vite.config.ts
import react from '@vitejs/plugin-react'
import path, { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

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
            outDir: 'dist'
        }),
        visualizer({
            filename: 'dist/stats.html'
        })
        // rawPlugin({
        //     fileRegex: /\.svg$/
        // })
    ],
    build: {
        emptyOutDir: true,
        sourcemap: true,
        // 库构建不复制 public/（演示视频等资产不应进入发布包）
        copyPublicDir: false,
        lib: {
            entry: path.resolve(__dirname, 'src/libs/index.ts'),
            name: 'CluoubVideo',
            formats: ['es', 'cjs'],
            fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`
        },
        rolldownOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime', 'lucide-react', 'dashjs', 'hls.js', 'libjass'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'react/jsx-runtime': 'reactJsxRuntime',
                    'lucide-react': 'LucideReact',
                    dashjs: 'dashjs',
                    'hls.js': 'Hls'
                }
            }
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '~': resolve(__dirname, 'src')
        }
    }
})
