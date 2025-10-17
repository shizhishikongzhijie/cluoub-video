// src/types/vite-env.d.ts

/// <reference types="vite/client" />

// 声明 .svg 文件可以通过 ?raw 导入，返回 string
declare module '*.svg?raw' {
    const content: string
    export default content
}

// （可选）如果你也想支持普通 .svg 导入（比如作为 URL）
declare module '*.svg' {
    const content: string // 这会是文件的 URL
    export default content
}