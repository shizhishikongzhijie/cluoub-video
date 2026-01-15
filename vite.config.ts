// vite.config.ts
import react from '@vitejs/plugin-react'
import path, {resolve} from 'path'
import {visualizer} from 'rollup-plugin-visualizer'
import {defineConfig} from 'vite'
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
        lib: {
            entry: path.resolve(__dirname, 'src/libs/index.ts'),
            name: 'CluoubVideo',
            formats: ['es', 'cjs'],
            fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}.js`
        },
        rolldownOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime', 'lucide-react', 'dashjs'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    'react/jsx-runtime': 'reactJsxRuntime',
                    'lucide-react': 'LucideReact',
                    dashjs: 'dashjs'
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
