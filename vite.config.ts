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
            entryRoot: 'src/libs',
            insertTypesEntry: false,
            rollupTypes: false,
            copyDtsFiles: true,
            exclude: ['**/*.test.*'],
            // 可选：指定输出目录
            outDir: 'dist'
        }),
        visualizer({
            // 保持分析报告在发布目录之外，避免 pnpm pack 把开发产物带入 npm 包。
            filename: 'bundle-stats.html'
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
            entry: {
                index: path.resolve(__dirname, 'src/libs/index.ts'),
                core: path.resolve(__dirname, 'src/libs/core/index.ts'),
                react: path.resolve(__dirname, 'src/libs/react/index.ts'),
                'plugins/capture': path.resolve(__dirname, 'src/libs/plugins/capture/index.tsx'),
                'plugins/danmu': path.resolve(__dirname, 'src/libs/plugins/danmu/index.tsx'),
                'plugins/dash': path.resolve(__dirname, 'src/libs/plugins/dash/index.tsx'),
                'plugins/hls': path.resolve(__dirname, 'src/libs/plugins/hls/index.tsx'),
                'plugins/subtitle': path.resolve(__dirname, 'src/libs/plugins/subtitle/index.tsx')
            },
            name: 'CluoubVideo',
            formats: ['es', 'cjs'],
            fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'cjs'}`,
            cssFileName: 'cluoub-video'
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
