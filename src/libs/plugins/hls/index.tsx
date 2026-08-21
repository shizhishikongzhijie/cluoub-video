import type { PlayerInstance } from '../../core/types'
import { createStreamingPlugin, noopEngine, type StreamingSourceEngine } from '../streaming/createStreamingPlugin'

/**
 * HLS 插件：动态导入 hls.js 播放 m3u8。
 * hls.js 作为 peerDependency，由使用方安装；构建时被外部化。
 * 浏览器原生支持 HLS（如 Safari）时直接交给 video，不加载 hls.js。
 */
export const hlsPlugin = (player: PlayerInstance) => {
    // 是否需要 hls.js（原生支持时直接用 video.src）
    const nativeHls = player.video.canPlayType('application/vnd.apple.mpegurl')

    return createStreamingPlugin(player, {
        isStreamSrc: (s) => /\.m3u8(\?|$)/i.test(s),
        controlId: 'quality-selector-hls',
        nativeLoad: (src) => {
            if (!nativeHls) return false
            player.video.src = src
            return true
        },
        createEngine: async (src, player): Promise<StreamingSourceEngine> => {
            try {
                const HlsModule = await import('hls.js')
                const Hls = HlsModule.default
                // 环境不支持 MSE
                if (!Hls.isSupported()) {
                    console.error('HLS is not supported in this environment')
                    return noopEngine
                }

                const hls = new Hls()
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
                    const qualities = hls.levels.map((level: any, index: number) => ({
                        key: String(index),
                        label: `${level.height}P`
                    }))
                    player.store.setState({ qualities })
                })

                // ABR / 手动切换实际生效时同步档位（hls.js 自动模式下会动态切换）
                hls.on(Hls.Events.LEVEL_SWITCHED, (_e: any, data: any) => {
                    syncActive(data?.level ?? hls.currentLevel)
                })

                return {
                    setQuality: (q: string) => {
                        hls.currentLevel = q === 'auto' ? -1 : parseInt(q, 10)
                    },
                    dispose: () => hls.destroy()
                }
            } catch (error) {
                console.error('Failed to load hls.js or initialize HLS player:', error)
                return noopEngine
            }
        }
    })
}
