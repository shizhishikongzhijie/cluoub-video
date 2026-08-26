import { parseConfigObject } from '../../core/config'
import { definePlugin } from '../../core/plugin'
import { createStreamingPlugin, type StreamingSourceEngine } from '../streaming/createStreamingPlugin'

export type HlsConfig = Record<never, never>

/** HLS 播放与画质控制插件。hls.js 保持为可选 peer dependency。 */
export const hlsPlugin = definePlugin<HlsConfig>({
    id: 'hls',
    schema: { parse: (input) => parseConfigObject(input, 'hls', []) },
    setup: (context) =>
        createStreamingPlugin(context, {
            isStreamSrc: (src) => /\.m3u8(\?|$)/i.test(src),
            nativeLoad: (src, player) => {
                if (!player.video.canPlayType('application/vnd.apple.mpegurl')) return false
                player.video.src = src
                player.video.load()
                return true
            },
            createEngine: async (src, player, signal): Promise<StreamingSourceEngine> => {
                const HlsModule = await import('hls.js')
                if (signal.aborted) throw new DOMException('HLS setup aborted', 'AbortError')
                const Hls = HlsModule.default
                if (!Hls.isSupported()) throw new Error('HLS is not supported in this environment')

                const hls = new Hls()
                hls.loadSource(src)
                hls.attachMedia(player.video)

                const syncActive = (levelIndex: number) => {
                    if (signal.aborted) return
                    const activeKey = levelIndex < 0 ? 'auto' : String(levelIndex)
                    const { quality, qualities } = player.store.getState()
                    const label =
                        levelIndex < 0 ? '自动' : (qualities.find((item) => item.key === activeKey)?.label ?? activeKey)
                    player.store.setState({ activeQuality: activeKey })
                    player.options.onQualityChange?.({ mode: quality, activeKey, label })
                }

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (signal.aborted) return
                    const qualities = hls.levels.map((level: { height: number }, index: number) => ({
                        key: String(index),
                        label: `${level.height}P`
                    }))
                    player.store.setState({ qualities })
                })
                hls.on(Hls.Events.LEVEL_SWITCHED, (_event: unknown, data: { level?: number }) => {
                    syncActive(data?.level ?? hls.currentLevel)
                })

                return {
                    setQuality: (quality) => {
                        hls.currentLevel = quality === 'auto' ? -1 : Number.parseInt(quality, 10)
                    },
                    dispose: () => hls.destroy()
                }
            }
        })
})
