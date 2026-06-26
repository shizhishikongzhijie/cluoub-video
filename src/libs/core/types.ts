import type { CluoubVideoProps } from '../types.ts'
import type { createPlayerStore } from './store.ts'

export type EventHandler = (...args: any[]) => void

export interface RegisterUIOptions {
    zIndex?: number
    position?: 'left' | 'right'
    order?: number
}

export interface PlayerInstance {
    video: HTMLVideoElement
    store: ReturnType<typeof createPlayerStore>
    options: CluoubVideoProps
    // control
    isControlsVisible: boolean
    setShowControls: (show: boolean) => void

    // API
    play: () => Promise<void>
    pause: () => void
    togglePlay: () => void
    seek: (time: number) => void
    setVolume: (vol: number) => void
    toggleMute: () => void
    toggleFullscreen: () => void
    setPlaybackRate: (rate: number) => void
    togglePip: () => Promise<void>
    toggleLoop: () => void
    /** 切换到播放列表指定索引 */
    playIndex: (index: number) => void
    /** 播放下一集（无下一集时无操作） */
    next: () => void
    /** 播放上一集（无上一集时无操作） */
    prev: () => void
    /** 截取当前帧，返回图片 dataURL（默认 image/png） */
    captureFrame: (options?: { type?: string; quality?: number }) => string | null
    /** 在指定时长内按帧率截取多帧（用于生成 GIF，编码由调用方完成） */
    captureFrames: (options?: { count?: number; intervalMs?: number; type?: string }) => Promise<string[]>
    mount: (container: HTMLElement) => void
    destroy: () => void

    // 插件系统
    registerUI: (id: string, component: React.ReactNode, type: 'layer' | 'control', opts?: RegisterUIOptions) => void
    unregisterUI: (id: string) => void
    on: (event: string, fn: EventHandler) => void // 简单的 EventBus 用于插件通信
    off: (event: string, fn: EventHandler) => void
    emit: (event: string, ...args: any[]) => void
}

export type IPlayerPlugin<T = any> = (player: PlayerInstance, config?: T) => void | (() => void)

export interface SubtitleStyles {
    fontSize: number
    color: string
    isOutline: boolean
    isBold: boolean
    opacity: number
}

export interface PlayerState {
    // 基础状态
    isPlaying: boolean
    isMuted: boolean
    volume: number
    currentTime: number
    duration: number
    buffered: number
    // 多段缓冲区间（百分比 0-100），用于进度条分段渲染
    bufferedRanges: { start: number; end: number }[]
    isWaiting: boolean // 缓冲中
    playbackRate: number
    isLoop: boolean

    // 画质相关
    quality: string
    // ABR 自动模式下实际生效的档位 key（手动模式与 quality 一致）
    activeQuality: string
    qualities: { key: string; label: string }[]

    // 字幕
    subtitleTrack: number
    isSubtitleVisible: boolean
    subtitleStyles?: SubtitleStyles

    // UI 状态
    isFullscreen: boolean
    isPip: boolean
    isControlsVisible: boolean
    isDanmuVisible: boolean

    // 播放列表
    playlistIndex: number
    playlistLength: number

    // 插件注册表 (UI Slots)
    uiRegistry: {
        layers: { id: string; component: React.ReactNode; zIndex?: number }[]
        controls: {
            id: string
            position?: 'left' | 'right'
            order?: number
            component: React.ReactNode
        }[]
    }
}
