import type { PlayerInstance } from '../../core/types'
import { QualityMenu } from '../dash/QualityMenu'

/**
 * HLS 插件：动态导入 hls.js 播放 m3u8。
 * hls.js 作为 peerDependency，由使用方安装；构建时被外部化。
 * 浏览器原生支持 HLS（如 Safari）时直接交给 video，不加载 hls.js。
 */
export const hlsPlugin = (player: PlayerInstance) => {
    const { source } = player.options

    const initialSrc = typeof source === 'string' ? source : ''
    const isHlsSrc = (s: string) => /\.m3u8(\?|$)/i.test(s)

    // 是否需要 hls.js（原生支持时直接用 video.src）
    const nativeHls = player.video.canPlayType('application/vnd.apple.mpegurl')

    let hls: any = null
    let isDestroyed = false
    let uiRegistered = false
    // 缓存画质切换处理器，重新加载源时复用
    let onQualityChange: ((q: string) => void) | null = null

    const loadAndInitHls = async (src: string) => {
        try {
            const HlsModule = await import('hls.js')
            if (isDestroyed) return

            const Hls = HlsModule.default
            // 环境不支持 MSE
            if (!Hls.isSupported()) {
                console.error('HLS is not supported in this environment')
                return
            }

            hls = new Hls()
            hls.loadSource(src)
            hls.attachMedia(player.video)

            // 同步当前实际生效档位到 store 并触发回调
            const syncActive = (levelIndex: number) => {
                const activeKey = levelIndex < 0 ? 'auto' : String(levelIndex)
                const { quality, qualities } = player.store.getState()
                const label =
                    levelIndex < 0 ? '自动' : (qualities.find((q) => q.key === activeKey)?.label ?? `${activeKey}`)
                player.store.setState({ activeQuality: activeKey })
                player.options.onQualityChange?.({ mode: quality, activeKey, label })
            }

            // manifest 解析后填充画质列表
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (isDestroyed) return
                const qualities = hls.levels.map((level: any, index: number) => ({
                    key: String(index),
                    label: `${level.height}P`
                }))
                player.store.setState({ qualities })
            })

            // ABR / 手动切换实际生效时同步档位（hls.js 自动模式下会动态切换）
            hls.on(Hls.Events.LEVEL_SWITCHED, (_e: any, data: any) => {
                if (isDestroyed) return
                syncActive(data?.level ?? hls.currentLevel)
            })

            // 监听画质切换：-1 表示自动 (ABR)。仅绑定一次，重新加载源时复用同一处理器
            if (!onQualityChange) {
                onQualityChange = (q: string) => {
                    if (!hls || isDestroyed) return
                    hls.currentLevel = q === 'auto' ? -1 : parseInt(q, 10)
                }
                player.on('request-quality-change', onQualityChange)
            }
        } catch (error) {
            console.error('Failed to load hls.js or initialize HLS player:', error)
        }
    }

    // 加载某个 HLS 源（区分原生支持与 hls.js）
    const load = (src: string) => {
        if (!isHlsSrc(src)) return
        // 首次接管 HLS 源时注册画质菜单（与 dash 复用同一组件，订阅 store）
        if (!uiRegistered) {
            uiRegistered = true
            player.registerUI('quality-selector-hls', <QualityMenu player={player} />, 'control', {
                order: 5,
                position: 'right'
            })
        }
        if (nativeHls) {
            player.video.src = src
            return
        }
        // 切源前销毁旧实例
        if (hls) {
            hls.destroy()
            hls = null
        }
        loadAndInitHls(src)
    }

    // 释放当前 HLS 接管：销毁实例、注销画质菜单、清空画质 store。
    // 用于切到非 HLS 源（如 DASH/MP4）时让出控制权。
    const teardown = () => {
        if (hls) {
            hls.destroy()
            hls = null
        }
        if (uiRegistered) {
            player.unregisterUI('quality-selector-hls')
            uiRegistered = false
        }
        player.store.setState({ qualities: [], activeQuality: 'auto' })
    }

    // 播放列表切源：HLS 源则接管加载，非 HLS 源则释放接管（跨协议互斥）
    const onSourceChange = (src: string) => {
        if (isHlsSrc(src)) {
            load(src)
        } else {
            teardown()
        }
    }
    player.on('source-change', onSourceChange)

    // 初始源若为 HLS 则立即接管；否则仅保留 source-change 监听
    if (isHlsSrc(initialSrc)) {
        load(initialSrc)
    }

    return () => {
        isDestroyed = true
        player.off('source-change', onSourceChange)
        if (onQualityChange) player.off('request-quality-change', onQualityChange)
        teardown()
    }
}
