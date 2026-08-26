import type { StoreApi } from 'zustand/vanilla'

export const VideoType = {
    MP4: 'mp4',
    HLS: 'hls',
    DASH: 'dash'
} as const

export type VideoType = (typeof VideoType)[keyof typeof VideoType]

export interface VideoSource {
    src: string
    type?: VideoType
    /** 展示给用户的画质名称，例如 1080P；允许业务自定义档位。 */
    quality?: string
}

export type PlayerSource = string | VideoSource | VideoSource[]

export interface PlaylistItem {
    source: PlayerSource
    poster?: string
    title?: string
}

export interface PersistConfig {
    progress?: boolean
    volume?: boolean
    playbackRate?: boolean
}

export interface QualityChangeInfo {
    mode: string
    activeKey: string
    label: string
}

export type PluginErrorPhase = 'config' | 'setup' | 'update' | 'runtime' | 'render' | 'cleanup'

export class PluginError extends Error {
    readonly pluginId: string
    readonly phase: PluginErrorPhase
    readonly cause: unknown
    readonly recoverable: boolean

    constructor(pluginId: string, phase: PluginErrorPhase, cause: unknown, recoverable = true) {
        super(cause instanceof Error ? cause.message : String(cause))
        this.name = 'PluginError'
        this.pluginId = pluginId
        this.phase = phase
        this.cause = cause
        this.recoverable = recoverable
    }
}

export interface PlayerOptions {
    source: PlayerSource
    playlist?: PlaylistItem[]
    autoNext?: boolean
    poster?: string
    autoPlay?: boolean
    loop?: boolean
    muted?: boolean
    persist?: boolean | PersistConfig
    plugins?: PlayerPluginEntry[]
    onReady?: (player: PlayerInstance) => void
    onPlay?: () => void
    onPause?: () => void
    onEnded?: () => void
    onError?: (error: unknown) => void
    onPluginError?: (error: PluginError) => void
    onQualityChange?: (info: QualityChangeInfo) => void
    onPlaylistChange?: (info: { index: number; item: PlaylistItem }) => void
}

export type PlayerSlotName =
    | 'overlay'
    | 'controls.progress'
    | 'controls.leading'
    | 'controls.trailing'
    | 'controls.settings'
    | 'below'

export interface SlotContribution<TContent = unknown> {
    id: string
    slot: PlayerSlotName
    content: TContent
    order?: number
    zIndex?: number
    controlId?: string
    pluginId?: string
}

export interface SlotRegistry<TContent = unknown> {
    register: (contribution: SlotContribution<TContent>) => () => void
    unregister: (id: string) => void
    getSnapshot: () => readonly SlotContribution<TContent>[]
    subscribe: (listener: () => void) => () => void
    clear: () => void
}

export interface PluginConfigSchema<TConfig> {
    parse: (input: unknown) => TConfig
}

export interface PluginSetupResult<TApi = unknown> {
    api?: TApi
    cleanup?: () => void
}

export interface PluginSlotScope {
    register: (contribution: Omit<SlotContribution, 'pluginId'>) => () => void
}

export interface PluginContext {
    player: PlayerInstance
    signal: AbortSignal
    slots: PluginSlotScope
    on: <TArgs extends unknown[]>(event: string, handler: (...args: TArgs) => void) => () => void
    registerCaptureLayer: (id: string, getCanvas: () => HTMLCanvasElement | null) => () => void
    reportError: (cause: unknown, phase?: PluginErrorPhase, recoverable?: boolean) => void
}

export interface PlayerPlugin<TConfig = undefined, TApi = undefined> {
    readonly kind: 'cluoub-player-plugin'
    readonly id: string
    readonly schema?: PluginConfigSchema<TConfig>
    readonly setup: (
        context: PluginContext,
        config: TConfig
    ) => void | (() => void) | PluginSetupResult<TApi> | Promise<void | (() => void) | PluginSetupResult<TApi>>
    configure: (config: TConfig) => ConfiguredPlayerPlugin<TConfig, TApi>
}

export interface ConfiguredPlayerPlugin<TConfig = unknown, TApi = unknown> {
    readonly kind: 'cluoub-configured-plugin'
    readonly plugin: PlayerPlugin<TConfig, TApi>
    readonly config: TConfig
}

/** @deprecated 使用 definePlugin 创建具名、可校验的插件。 */
export type LegacyPlayerPlugin<TConfig = unknown> = (player: PlayerInstance, config?: TConfig) => void | (() => void)

/** @deprecated 使用 PlayerPlugin。 */
export type IPlayerPlugin<TConfig = unknown> = LegacyPlayerPlugin<TConfig>

export interface PlayerPluginDefinition {
    readonly kind: 'cluoub-player-plugin'
    readonly id: string
}

interface ErasedConfiguredPlayerPlugin {
    readonly kind: 'cluoub-configured-plugin'
    readonly plugin: PlayerPluginDefinition
    readonly config: unknown
}

export type PlayerPluginEntry = PlayerPluginDefinition | ErasedConfiguredPlayerPlugin | LegacyPlayerPlugin<never>

export interface PluginManager {
    set: (entries?: readonly PlayerPluginEntry[]) => void
    get: <TConfig, TApi>(plugin: PlayerPlugin<TConfig, TApi>) => TApi | undefined
    has: (pluginOrId: PlayerPluginDefinition | string) => boolean
    subscribe: (listener: () => void) => () => void
    destroy: () => void
}

export interface RegisterUIOptions {
    zIndex?: number
    position?: 'left' | 'right'
    order?: number
    controlKey?: 'quality' | 'danmu'
}

/** @deprecated 仅用于 0.3 beta 的 player.danmu 兼容别名；新代码使用对应插件导出的 DanmuAPI。 */
export interface LegacyDanmuAPI {
    send: (text: string, options?: { mode?: 'scroll' | 'top' | 'bottom'; color?: string }) => void
    setVisible: (visible: boolean) => void
    toggleVisible: () => void
    setMode: (mode: 'scroll' | 'top' | 'bottom') => void
    setColor: (color: string) => void
}

export interface PlayerInstance {
    video: HTMLVideoElement
    store: StoreApi<PlayerState>
    readonly options: PlayerOptions
    slots: SlotRegistry
    plugins: PluginManager
    play: () => Promise<void>
    pause: () => void
    togglePlay: () => void
    seek: (time: number) => void
    setVolume: (volume: number) => void
    toggleMute: () => void
    toggleFullscreen: () => void
    setPlaybackRate: (rate: number) => void
    togglePip: () => Promise<void>
    toggleLoop: () => void
    playIndex: (index: number) => void
    next: () => void
    prev: () => void
    selectQuality: (key: string) => void
    captureFrame: (options?: { type?: string; quality?: number }) => string | null
    captureFrames: (options?: { count?: number; intervalMs?: number; type?: string }) => Promise<string[]>
    captureComposite: (options?: { type?: string; quality?: number }) => Promise<string | null>
    updateSource: (source: PlayerSource) => void
    updatePlaylist: (playlist: PlaylistItem[]) => void
    updateOptions: (options: Partial<Omit<PlayerOptions, 'source' | 'playlist' | 'plugins'>>) => void
    mount: (container: HTMLElement) => void
    destroy: () => void
    registerSlot: (contribution: SlotContribution) => () => void
    /** @deprecated 使用 registerSlot。 */
    registerUI: (id: string, component: unknown, type: 'layer' | 'control', options?: RegisterUIOptions) => void
    /** @deprecated 保存兼容性；新插件使用 registerSlot 返回的 disposer。 */
    unregisterUI: (id: string) => void
    on: <TArgs extends unknown[]>(event: string, handler: (...args: TArgs) => void) => void
    off: <TArgs extends unknown[]>(event: string, handler: (...args: TArgs) => void) => void
    emit: <TArgs extends unknown[]>(event: string, ...args: TArgs) => void
    captureLayers: { id: string; getCanvas: () => HTMLCanvasElement | null }[]
    registerCaptureLayer: (id: string, getCanvas: () => HTMLCanvasElement | null) => void
    unregisterCaptureLayer: (id: string) => void
    /** @deprecated 仅供 0.1 兼容入口使用。 */
    danmu?: LegacyDanmuAPI
}

export interface PlayerState {
    isPlaying: boolean
    isMuted: boolean
    volume: number
    currentTime: number
    duration: number
    buffered: number
    bufferedRanges: { start: number; end: number }[]
    isWaiting: boolean
    playbackRate: number
    isLoop: boolean
    quality: string
    activeQuality: string
    qualities: { key: string; label: string }[]
    isFullscreen: boolean
    isPip: boolean
    playlistIndex: number
    playlistLength: number
}
