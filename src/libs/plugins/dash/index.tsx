import type { PlayerInstance } from '../../core/types'
import { QualityMenu } from './QualityMenu'

export const dashPlugin = (player: PlayerInstance, dataPrefix: string = '') => {
    const { options } = player
    const { source } = options

    const initialSrc = typeof source === 'string' ? source : ''
    const isDashSrc = (s: string) => /\.mpd(\?|$)/i.test(s)

    let dash: any = null
    let isDestroyed = false
    let uiRegistered = false
    // 缓存画质切换处理器，重新加载源时复用
    let onQualityChange: ((q: string) => void) | null = null

    // 安全处理 dataPrefix
    const safeDataPrefix = dataPrefix.endsWith('/') ? dataPrefix : dataPrefix + '/'

    // 异步加载 dashjs 并初始化
    const loadAndInitDash = async (src: string) => {
        try {
            // 动态导入 dashjs
            const dashjsModule = await import('dashjs')
            if (isDestroyed) return

            const dashInstance = dashjsModule.default.MediaPlayer().create()
            dash = dashInstance

            // 初始化播放器
            dash.initialize(player.video, src, false)

            // 扩展 RequestModifier
            dash.extend(
                'RequestModifier',
                () => ({
                    modifyRequestHeader: (xhr: XMLHttpRequest) => xhr,
                    modifyRequestURL: (url: string) => {
                        if (url && !/^https?:\/\//.test(url) && !url.startsWith('/')) {
                            return safeDataPrefix + url
                        }
                        return url
                    }
                }),
                true
            )

            // manifest 加载后更新画质列表
            dash.on('manifestLoaded', () => {
                if (isDestroyed) return
                const qualities = dash.getBitrateInfoListFor('video').map((q: any) => ({
                    key: String(q.qualityIndex),
                    label: `${q.height}P`
                }))
                player.store.setState({ qualities })
            })

            // ABR / 手动切换实际生效时同步档位
            dash.on('qualityChangeRendered', (e: any) => {
                if (isDestroyed || e?.mediaType !== 'video') return
                const activeKey = String(e.newQuality)
                const { quality, qualities } = player.store.getState()
                const label = qualities.find((q) => q.key === activeKey)?.label ?? `${activeKey}`
                player.store.setState({ activeQuality: activeKey })
                player.options.onQualityChange?.({ mode: quality, activeKey, label })
            })

            // 监听画质切换。仅绑定一次，重新加载源时复用同一处理器
            if (!onQualityChange) {
                onQualityChange = (q: string) => {
                    if (!dash || isDestroyed) return
                    if (q === 'auto') {
                        dash.updateSettings({
                            streaming: { abr: { autoSwitchBitrate: { video: true } } }
                        })
                    } else {
                        dash.updateSettings({
                            streaming: { abr: { autoSwitchBitrate: { video: false } } }
                        })
                        dash.setQualityFor('video', parseInt(q, 10))
                    }
                }
                player.on('request-quality-change', onQualityChange)
            }
        } catch (error) {
            console.error('Failed to load dashjs or initialize DASH player:', error)
        }
    }

    // 加载某个 DASH 源
    const load = (src: string) => {
        if (!isDashSrc(src)) return
        // 首次接管 DASH 源时注册画质菜单（菜单自身订阅 store，qualities 为空时显示“自动”）
        if (!uiRegistered) {
            uiRegistered = true
            player.registerUI('quality-selector-dash', <QualityMenu player={player} />, 'control', {
                order: 5,
                position: 'right'
            })
        }
        // 切源前重置旧实例
        if (dash) {
            dash.reset()
            dash = null
        }
        loadAndInitDash(src)
    }

    // 释放当前 DASH 接管：reset 实例、注销画质菜单、清空画质 store。
    // 用于切到非 DASH 源（如 HLS/MP4）时让出控制权。
    const teardown = () => {
        if (dash) {
            dash.reset()
            dash = null
        }
        if (uiRegistered) {
            player.unregisterUI('quality-selector-dash')
            uiRegistered = false
        }
        player.store.setState({ qualities: [], activeQuality: 'auto' })
    }

    // 播放列表切源：DASH 源则接管加载，非 DASH 源则释放接管（跨协议互斥）
    const onSourceChange = (src: string) => {
        if (isDashSrc(src)) {
            load(src)
        } else {
            teardown()
        }
    }
    player.on('source-change', onSourceChange)

    // 初始源若为 DASH 则立即接管；否则仅保留 source-change 监听
    if (isDashSrc(initialSrc)) {
        load(initialSrc)
    }

    // 清理函数
    return () => {
        isDestroyed = true
        player.off('source-change', onSourceChange)
        if (onQualityChange) player.off('request-quality-change', onQualityChange)
        teardown()
        // 注意：无法取消 import()，但可通过 isDestroyed 标志避免后续操作
    }
}
