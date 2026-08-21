import type { PlayerInstance } from '../../core/types'
import { QualityMenu } from '../quality/QualityMenu'

/** 引擎句柄：协议插件提供画质切换与释放能力 */
export interface StreamingSourceEngine {
    setQuality: (key: string) => void
    dispose: () => void
}

/** 协议差异点：由 DASH / HLS 插件各自实现 */
export interface StreamingSourceHandler {
    isStreamSrc: (src: string) => boolean
    /** 画质菜单在控制栏注册的控件 id */
    controlId: string
    /** 可选的同步接管（如浏览器原生 HLS）；返回 true 表示已接管，无需创建引擎 */
    nativeLoad?: (src: string, player: PlayerInstance) => boolean
    /** 创建并接入引擎实例；内部负责协议事件接线（画质列表、生效档位同步） */
    createEngine: (src: string, player: PlayerInstance) => Promise<StreamingSourceEngine>
}

const noopEngine: StreamingSourceEngine = { setQuality: () => {}, dispose: () => {} }

/**
 * 流媒体（DASH/HLS）插件共用脚手架：
 * - 首次接管时注册画质菜单 UI；
 * - 绑定一次 request-quality-change 事件并转交当前引擎；
 * - 播放列表切源时按协议接管 / 让出控制权；
 * - 插件清理时解绑事件并释放引擎。
 */
export const createStreamingPlugin = (player: PlayerInstance, handler: StreamingSourceHandler): (() => void) => {
    const { source } = player.options
    const initialSrc = typeof source === 'string' ? source : ''
    const { isStreamSrc, controlId, createEngine } = handler

    let engine: StreamingSourceEngine | null = null
    let isDestroyed = false
    let uiRegistered = false

    const load = (src: string) => {
        if (!isStreamSrc(src)) return
        // 首次接管时注册画质菜单（菜单自身订阅 store，qualities 为空时显示“自动”）
        if (!uiRegistered) {
            uiRegistered = true
            player.registerUI(controlId, <QualityMenu player={player} />, 'control', {
                order: 5,
                position: 'right',
                controlKey: 'quality'
            })
        }
        // 原生支持的流媒体（如 Safari 原生 HLS）直接交给 video，不创建引擎
        if (handler.nativeLoad?.(src, player)) return
        // 切源前释放旧实例
        engine?.dispose()
        engine = null
        createEngine(src, player).then((next) => {
            if (isDestroyed) next.dispose()
            else engine = next
        })
    }

    // 释放当前接管：重置实例、注销画质菜单、清空画质 store。
    // 用于切到非本协议源（如 MP4/其它协议）时让出控制权。
    const teardown = () => {
        engine?.dispose()
        engine = null
        if (uiRegistered) {
            player.unregisterUI(controlId)
            uiRegistered = false
        }
        player.store.setState({ qualities: [], activeQuality: 'auto' })
    }

    // 播放列表切源：本协议源则接管加载，否则释放接管（跨协议互斥）
    const onSourceChange = (src: string) => {
        if (isStreamSrc(src)) load(src)
        else teardown()
    }
    player.on('source-change', onSourceChange)

    // 画质切换事件仅绑定一次，重新加载源时复用同一处理器（作用于当前引擎）
    const onQualityChange = (q: string) => engine?.setQuality(q)
    player.on('request-quality-change', onQualityChange)

    // 初始源若为本协议则立即接管；否则仅保留 source-change 监听
    if (isStreamSrc(initialSrc)) load(initialSrc)

    return () => {
        isDestroyed = true
        player.off('source-change', onSourceChange)
        player.off('request-quality-change', onQualityChange)
        teardown()
    }
}

export { noopEngine }
