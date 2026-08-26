import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
    base: '/cluoub-video/',
    plugins: [react()],
    build: {
        outDir: 'demo-dist',
        emptyOutDir: true
    }
})
