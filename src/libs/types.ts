import type { PlayerInstance, PlayerOptions, PlayerPluginEntry } from './core/types'
import type { DanmuAPI } from './plugins/danmu/state'

export { VideoType } from './core/types'
export type { PersistConfig, PlayerSource, PlaylistItem, VideoSource } from './core/types'

export interface PlayerControlsConfig {
    play?: boolean
    volume?: boolean
    time?: boolean
    progress?: boolean
    fullscreen?: boolean
    settings?: boolean
    pip?: boolean
    danmu?: boolean
    quality?: boolean
    speed?: boolean
    screenMode?: boolean
    plugins?: Record<string, boolean>
}

export interface SpriteThumbnailConfig {
    type?: 'sprite'
    url: string
    cols: number
    rows: number
    interval: number
}

export interface VideoThumbnailConfig {
    type: 'video'
    source?: string
}

export type ThumbnailConfig = SpriteThumbnailConfig | VideoThumbnailConfig

export interface CluoubVideoProps extends PlayerOptions {
    width?: string | number
    height?: string | number
    aspectRatio?: string
    themeColor?: string
    controls?: boolean | PlayerControlsConfig
    thumbnail?: ThumbnailConfig
    plugins?: PlayerPluginEntry[]
}

/** 0.1 根入口兼容 Props；将在 cluoub-web 切换 0.3 API 后移除。 */
export interface LegacyCluoubVideoProps extends CluoubVideoProps {
    danmuList?: unknown[]
    defaultShow?: boolean
    showDanmuBar?: boolean
    danmuColor?: string
    danmuMode?: 'scroll' | 'top' | 'bottom'
    tracks?: unknown[]
    capture?: Record<string, unknown>
    dataPrefix?: string
}

export interface VideoRef {
    play: () => void
    pause: () => void
    togglePlay: () => void
    seek: (time: number) => void
    setVolume: (volume: number) => void
    toggleMute: () => void
    toggleFullscreen: () => void
    setPlaybackRate: (rate: number) => void
    togglePip: () => Promise<void>
    setScreenMode: (mode: 'normal' | 'wide' | 'small') => void
    toggleScreenMode: () => void
    playIndex: (index: number) => void
    next: () => void
    prev: () => void
    selectQuality: (key: string) => void
    captureFrame: (options?: { type?: string; quality?: number }) => string | null
    captureFrames: (options?: { count?: number; intervalMs?: number; type?: string }) => Promise<string[]>
    captureComposite: (options?: { type?: string; quality?: number }) => Promise<string | null>
    getVideoElement: () => HTMLVideoElement | null
    getPlayer: () => PlayerInstance | null
    getDanmu: () => DanmuAPI | undefined
}
