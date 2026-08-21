import type { IPlayerPlugin, PlayerInstance } from './core/types.ts'

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
    screenMode?: boolean // 宽屏/小窗模式
}

/** 雪碧图缩略图：单张图片按 cols×rows 网格切分，interval 秒一张 */
export interface SpriteThumbnailConfig {
    /** 缩略图模式：默认 sprite，可省略（向后兼容旧配置） */
    type?: 'sprite'
    url: string
    cols: number
    rows: number
    interval: number // 每张图代表的时间间隔
}

/** 视频抽帧缩略图：悬停进度条时从视频源直接截取对应画面 */
export interface VideoThumbnailConfig {
    type: 'video'
    /** 抽帧使用的视频源；缺省时自动使用当前播放源 */
    source?: string
}

export type ThumbnailConfig = SpriteThumbnailConfig | VideoThumbnailConfig

export interface PlaylistItem {
    /** 该集的视频源 */
    source: string | VideoSource | VideoSource[]
    /** 该集封面 */
    poster?: string
    /** 该集标题（用于回调/UI） */
    title?: string
}

export interface CluoubVideoProps {
    // --- 数据源 ---
    source: string | VideoSource | VideoSource[] // 支持多画质
    poster?: string // 封面图

    // --- 播放列表 / 连播 ---
    playlist?: PlaylistItem[]
    /** 单集播放结束后自动播放下一集，默认 false */
    autoNext?: boolean

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
    /**
     * 本地持久化：记忆音量/倍速并在播放到一半时记录断点，下次自动续播。
     * true 开启全部；可用对象细分；按视频源 URL 作为 key 存储于 localStorage。
     */
    persist?: boolean | { progress?: boolean; volume?: boolean; playbackRate?: boolean }

    // --- 插件系统 ---
    plugins?: IPlayerPlugin[]

    // --- 缩略图 ---
    thumbnail?: ThumbnailConfig
    // --- 事件回调 ---
    onReady?: (player: PlayerInstance) => void
    onPlay?: () => void
    onPause?: () => void
    onEnded?: () => void
    onError?: (err: unknown) => void
    /** 画质切换回调：mode 为用户选择的档位（auto/具体 key），activeKey 为当前实际生效的档位 */
    onQualityChange?: (info: { mode: string; activeKey: string; label: string }) => void
    /** 播放列表切换回调 */
    onPlaylistChange?: (info: { index: number; item: PlaylistItem }) => void

    // 允许插件读取自定义配置项（如 subtitle 插件的 tracks）

    [key: string]: any
}

export interface VideoRef {
    play: () => void
    pause: () => void
    togglePlay: () => void
    seek: (time: number) => void
    setVolume: (vol: number) => void
    toggleMute: () => void
    toggleFullscreen: () => void
    setPlaybackRate: (rate: number) => void
    togglePip: () => Promise<void>
    /** 设置屏幕模式（normal/wide/small） */
    setScreenMode: (mode: 'normal' | 'wide' | 'small') => void
    /** 屏幕模式单按钮循环切换 */
    toggleScreenMode: () => void
    /** 播放列表：跳到指定索引 */
    playIndex: (index: number) => void
    /** 播放列表：下一集 */
    next: () => void
    /** 播放列表：上一集 */
    prev: () => void
    /** 截取当前帧，返回图片 dataURL */
    captureFrame: (options?: { type?: string; quality?: number }) => string | null
    /** 按帧率截取多帧（用于 GIF） */
    captureFrames: (options?: { count?: number; intervalMs?: number; type?: string }) => Promise<string[]>
    /** 合成截图：视频帧 + 弹幕 canvas + 字幕文本一起导出（异步） */
    captureComposite: (options?: { type?: string; quality?: number }) => Promise<string | null>
    /** 底层 HTMLVideoElement，用于高级用法 */
    getVideoElement: () => HTMLVideoElement | null
    /** 完整播放器实例，用于访问 store 等 */
    getPlayer: () => PlayerInstance | null
}
