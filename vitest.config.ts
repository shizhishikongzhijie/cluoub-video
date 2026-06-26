import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

// 测试专用配置，独立于库构建配置（vite.config.ts），避免 dts/lib 设置干扰测试
export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.{test,spec}.{ts,tsx}']
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '~': resolve(__dirname, 'src')
        }
    }
})
