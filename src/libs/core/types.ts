import type {CluoubVideoProps} from '../types.ts'
import type {createPlayerStore} from './store.ts'

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
    mount: (container: HTMLElement) => void
    destroy: () => void

    // 插件系统
    registerUI: (id: string, component: React.ReactNode, type: 'layer' | 'control', opts?: any) => void
    on: (event: string, fn: Function) => void // 简单的 EventBus 用于插件通信
    off: (event: string, fn: Function) => void
}

export type IPlayerPlugin<T = any> = (player: PlayerInstance, config?: T) => void

export interface PlayerState {
    // 基础状态
    isPlaying: boolean
    isMuted: boolean
    volume: number
    currentTime: number
    duration: number
    buffered: number
    isWaiting: boolean // 缓冲中
    playbackRate: number

    // 画质相关
    quality: string
    qualities: { key: string; label: string }[]

    // 字幕
    subtitleTrack: number
    isSubtitleVisible: boolean

    // UI 状态
    isFullscreen: boolean
    isPip: boolean
    isControlsVisible: boolean

    // 插件注册表 (UI Slots)
    uiRegistry: {
        layers: { id: string; component: React.ReactNode; zIndex?: number }[]
        controls: {
            id: string
            position: 'left' | 'right'
            order: number
            component: React.ReactNode
        }[]
    }
}
