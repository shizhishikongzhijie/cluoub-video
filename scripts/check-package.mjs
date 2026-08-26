import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const missing = []

const visitExport = (value) => {
    if (typeof value === 'string') {
        if (!value.includes('*') && !existsSync(resolve(root, value))) missing.push(value)
        return
    }
    if (value && typeof value === 'object') Object.values(value).forEach(visitExport)
}

Object.values(packageJson.exports).forEach(visitExport)
if (missing.length) throw new Error(`Missing package exports:\n${missing.join('\n')}`)

const importPattern = /(?:from\s*|import\s*)[('\"](\.\.?\/[^'\"]+)['\")]/g
const collectGraph = (file, files = new Set()) => {
    if (files.has(file)) return files
    files.add(file)
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(importPattern)) {
        const target = resolve(dirname(file), match[1])
        if (existsSync(target)) collectGraph(target, files)
    }
    return files
}

const coreGraph = collectGraph(resolve(root, 'dist/core.mjs'))
for (const file of coreGraph) {
    const source = readFileSync(file, 'utf8')
    if (/from\s*['"](?:react|react-dom|lucide-react)|require\(['"](?:react|react-dom|lucide-react)/.test(source)) {
        throw new Error(`Headless core imports a visual runtime: ${file}`)
    }
}

const pluginIds = ['capture', 'danmu', 'dash', 'hls', 'subtitle']
for (const pluginId of pluginIds) {
    const graph = collectGraph(resolve(root, `dist/plugins/${pluginId}.mjs`))
    for (const otherId of pluginIds.filter((candidate) => candidate !== pluginId)) {
        if ([...graph].some((file) => new RegExp(`[\\/]${otherId}-[^\\/]+\\.js$`).test(file))) {
            throw new Error(`${pluginId} plugin pulls in ${otherId} plugin code`)
        }
    }
}

console.log(
    `Verified ${Object.keys(packageJson.exports).length} exports, a React-free core graph, and isolated plugin graphs.`
)
