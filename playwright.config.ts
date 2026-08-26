import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    retries: 0,
    reporter: 'list',
    use: {
        baseURL: 'http://127.0.0.1:4173/cluoub-video/',
        channel: process.env.CI ? undefined : 'chrome',
        headless: true,
        trace: 'retain-on-failure'
    },
    webServer: {
        command: 'pnpm exec vite --config vite.demo.config.ts --host 127.0.0.1 --port 4173',
        url: 'http://127.0.0.1:4173/cluoub-video/',
        reuseExistingServer: true,
        timeout: 120000
    }
})
