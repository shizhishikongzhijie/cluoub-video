import { optionalString, parseConfigObject } from '../../core/config'
import { definePlugin } from '../../core/plugin'
import { createStreamingPlugin, type StreamingSourceEngine } from '../streaming/createStreamingPlugin'

export interface DashConfig {
    dataPrefix?: string
}

const parseDashConfig = (input: unknown): Required<DashConfig> => {
    const config = parseConfigObject(input, 'dash', ['dataPrefix'])
    return { dataPrefix: optionalString(config, 'dataPrefix', '') }
}

/** DASH 播放与画质控制插件。dashjs 保持为可选 peer dependency。 */
export const dashPlugin = definePlugin<DashConfig>({
    id: 'dash',
    schema: { parse: parseDashConfig },
    setup: (context, config) => {
        const dataPrefix = (config as Required<DashConfig>).dataPrefix
        const safeDataPrefix = dataPrefix && !dataPrefix.endsWith('/') ? `${dataPrefix}/` : dataPrefix

        return createStreamingPlugin(context, {
            isStreamSrc: (src) => /\.mpd(\?|$)/i.test(src),
            createEngine: async (src, player, signal): Promise<StreamingSourceEngine> => {
                const dashjsModule = await import('dashjs')
                if (signal.aborted) throw new DOMException('DASH setup aborted', 'AbortError')
                const dash = dashjsModule.default.MediaPlayer().create()
                dash.initialize(player.video, src, false)

                dash.extend(
                    'RequestModifier',
                    () => ({
                        modifyRequestHeader: (xhr: XMLHttpRequest) => xhr,
                        modifyRequestURL: (url: string) => {
                            if (safeDataPrefix && url && !/^https?:\/\//.test(url) && !url.startsWith('/')) {
                                return safeDataPrefix + url
                            }
                            return url
                        }
                    }),
                    true
                )

                dash.on('manifestLoaded', () => {
                    if (signal.aborted) return
                    const qualities = dash
                        .getBitrateInfoListFor('video')
                        .map((quality: { qualityIndex: number; height: number }) => ({
                            key: String(quality.qualityIndex),
                            label: `${quality.height}P`
                        }))
                    player.store.setState({ qualities })
                })

                dash.on('qualityChangeRendered', (event: { mediaType?: string; newQuality?: number }) => {
                    if (signal.aborted || event.mediaType !== 'video' || event.newQuality === undefined) return
                    const activeKey = String(event.newQuality)
                    const { quality, qualities } = player.store.getState()
                    const label = qualities.find((item) => item.key === activeKey)?.label ?? activeKey
                    player.store.setState({ activeQuality: activeKey })
                    player.options.onQualityChange?.({ mode: quality, activeKey, label })
                })

                return {
                    setQuality: (quality) => {
                        const auto = quality === 'auto'
                        dash.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: auto } } } })
                        if (!auto) dash.setQualityFor('video', Number.parseInt(quality, 10))
                    },
                    dispose: () => dash.reset()
                }
            }
        })
    }
})
