import type { CluoubVideoProps, PlaylistItem } from '../types'
import type { createPlayerStore } from './store.ts'

export type EventHandler = (...args: any[]) => void

export interface RegisterUIOptions {
    zIndex?: number
    position?: 'left' | 'right'
    order?: number
    /** 关联的内置控件配置键，核心控件栏据此按 controls 配置显示/隐藏 */
    controlKey?: 'quality' | 'danmu'
}

export interface PlayerInstance {
    video: HTMLVideoElement
    store: ReturnType<typeof createPlayerStore>
    options: CluoubVideoProps
    // control
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
    /** 设置屏幕模式（normal/wide/small） */
    setScreenMode: (mode: 'normal' | 'wide' | 'small') => void
    /** 屏幕模式单按钮循环切换：normal → wide → small → normal */
    toggleScreenMode: () => void
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
    /** 合成截图：视频帧 + 弹幕 canvas + 字幕文本一起导出（异步，跨域污染时返回 null） */
    captureComposite: (options?: { type?: string; quality?: number }) => Promise<string | null>
    /** 响应式更新：切换源（源不变时无操作） */
    updateSource: (source: CluoubVideoProps['source']) => void
    /** 响应式更新：更新播放列表（当前源与索引条目不一致才重载） */
    updatePlaylist: (playlist: PlaylistItem[]) => void
    /** 响应式更新：应用标量配置（autoPlay/loop/muted/poster，undefined 保持原值） */
    applyOptions: (options: Pick<CluoubVideoProps, 'autoPlay' | 'loop' | 'muted' | 'poster'>) => void
    mount: (container: HTMLElement) => void
    destroy: () => void

    // 插件系统
    registerUI: (id: string, component: React.ReactNode, type: 'layer' | 'control', opts?: RegisterUIOptions) => void
    unregisterUI: (id: string) => void
    on: (event: string, fn: EventHandler) => void // 简单的 EventBus 用于插件通信
    off: (event: string, fn: EventHandler) => void
    emit: (event: string, ...args: any[]) => void

    // 捕获层注册表：插件（如弹幕）把渲染在 <canvas> 上的图层注册进来，
    // 合成截图时按各 canvas 的容器内坐标逐层叠加（对齐屏幕布局，无 DOM 序列化）
    captureLayers: { id: string; getCanvas: () => HTMLCanvasElement | null }[]
    registerCaptureLayer: (id: string, getCanvas: () => HTMLCanvasElement | null) => void
    unregisterCaptureLayer: (id: string) => void

    // 弹幕外部控制 API：由弹幕插件挂载（未安装弹幕插件时为 undefined）。
    // 供接入自定义输入框/按钮，或程序化发送弹幕
    danmu?: DanmuAPI
}

/** 发送弹幕的可选参数 */
export interface SendDanmuOptions {
    /** 弹幕模式，缺省用当前 store.danmuMode */
    mode?: 'scroll' | 'top' | 'bottom'
    /** 弹幕颜色，缺省用当前 store.danmuColor */
    color?: string
}

/**
 * 弹幕外部控制 API（B 站式弹幕操作区/自定义控件的接入点）。
 * 由 danmuPlugin 安装时挂到 player.danmu，插件卸载时置空。
 */
export interface DanmuAPI {
    /** 发送一条弹幕（立即进入舞台；弹幕隐藏时为 no-op） */
    send: (text: string, options?: SendDanmuOptions) => void
    /** 显示/隐藏弹幕 */
    setVisible: (visible: boolean) => void
    /** 切换弹幕显示 */
    toggleVisible: () => void
    /** 设置默认发送模式（滚动/顶部/底部） */
    setMode: (mode: 'scroll' | 'top' | 'bottom') => void
    /** 设置默认发送颜色 */
    setColor: (color: string) => void
}

export type IPlayerPlugin<T = any> = (player: PlayerInstance, config?: T) => void | (() => void)

export interface SubtitleStyles {
    fontSize: number
    color: string
    isOutline: boolean
    isBold: boolean
    opacity: number
}

/** 字幕样式默认值（唯一事实来源） */
export const DEFAULT_SUBTITLE_STYLES: SubtitleStyles = {
    fontSize: 20,
    color: '#ffffff',
    isOutline: true,
    isBold: false,
    opacity: 1
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
    /** 字幕时间偏移（秒，正数延迟字幕显示，负数提前），用于音画同步微调 */
    subtitleOffset: number
    /** 当前应显示的字幕文本（VTT/SRT 由 SubtitleLayer 写入），供合成截图在 canvas 上绘制 */
    activeSubtitleText: string

    // UI 状态
    isFullscreen: boolean
    isPip: boolean
    isControlsVisible: boolean
    isDanmuVisible: boolean
    /** 发送弹幕的默认模式（滚动/顶部/底部） */
    danmuMode: 'scroll' | 'top' | 'bottom'
    /** 发送弹幕的默认颜色 */
    danmuColor: string
    /** 屏幕模式：normal 常规 / wide 宽屏（21:9）/ small 小窗 */
    screenMode: 'normal' | 'wide' | 'small'

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
            controlKey?: 'quality' | 'danmu'
            component: React.ReactNode
        }[]
    }
}
