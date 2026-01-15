import type {IPlayerPlugin} from './core/types.ts' // 假设你的核心库路径
// 假设你的核心库路径

// 使用 const 对象替代 enum
export const VideoType = {
    MP4: 'mp4',
    HLS: 'hls',
    DASH: 'dash'
} as const

// 定义类型以便类型推断
export type VideoType = (typeof VideoType)[keyof typeof VideoType]

export interface VideoSource {
    src: string
    type?: VideoType
    quality?: '1080P' | '720P' | '480P'
}

export interface PlayerControlsConfig {
    play?: boolean
    volume?: boolean
    time?: boolean
    progress?: boolean
    fullscreen?: boolean
    settings?: boolean
    pip?: boolean
    danmu?: boolean // 弹幕开关
    quality?: boolean
    speed?: boolean
}

export interface CluoubVideoProps {
    // --- 数据源 ---
    source: string | VideoSource | VideoSource[] // 支持多画质
    poster?: string // 封面图

    // --- 样式配置 ---
    width?: string | number
    height?: string | number
    aspectRatio?: string // '16:9' | '21:9'
    themeColor?: string // 主题色，默认 #35ddd8

    // --- 功能配置 ---
    autoPlay?: boolean
    loop?: boolean
    muted?: boolean
    controls?: boolean | PlayerControlsConfig // true 显示全部，object 自定义

    // --- 插件系统 ---
    plugins?: IPlayerPlugin[]

    // --- 缩略图 (雪碧图) ---
    thumbnail?: {
        url: string
        cols: number
        rows: number
        interval: number // 每张图代表的时间间隔
    }
    // --- 事件回调 ---
    onReady?: (player: any) => void
    onPlay?: () => void
    onPause?: () => void
    onEnded?: () => void
    onError?: (err: any) => void

    [any: string]: any
}

export interface VideoRef {
    play: () => void
    pause: () => void
    seek: (time: number) => void
    setVolume: (vol: number) => void
    toggleFullscreen: () => void
    // ... 其他方法
}
