import type { PlayerInstance } from '../../core/types'
import { createStreamingPlugin, noopEngine, type StreamingSourceEngine } from '../streaming/createStreamingPlugin'

/**
 * DASH 插件：动态导入 dashjs 播放 mpd，支持 dataPrefix 前缀补充相对 URL。
 * dashjs 作为 peerDependency，由使用方安装；构建时被外部化。
 */
export const dashPlugin = (player: PlayerInstance, dataPrefix: string = '') => {
    // 安全处理 dataPrefix
    const safeDataPrefix = dataPrefix.endsWith('/') ? dataPrefix : dataPrefix + '/'

    return createStreamingPlugin(player, {
        isStreamSrc: (s) => /\.mpd(\?|$)/i.test(s),
        controlId: 'quality-selector-dash',
        createEngine: async (src, player): Promise<StreamingSourceEngine> => {
            try {
                const dashjsModule = await import('dashjs')
                const dash = dashjsModule.default.MediaPlayer().create()
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
                    const qualities = dash.getBitrateInfoListFor('video').map((q: any) => ({
                        key: String(q.qualityIndex),
                        label: `${q.height}P`
                    }))
                    player.store.setState({ qualities })
                })

                // ABR / 手动切换实际生效时同步档位
                dash.on('qualityChangeRendered', (e: any) => {
                    if (e?.mediaType !== 'video') return
                    const activeKey = String(e.newQuality)
                    const { quality, qualities } = player.store.getState()
                    const label = qualities.find((q) => q.key === activeKey)?.label ?? `${activeKey}`
                    player.store.setState({ activeQuality: activeKey })
                    player.options.onQualityChange?.({ mode: quality, activeKey, label })
                })

                return {
                    setQuality: (q: string) => {
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
                    },
                    dispose: () => dash.reset()
                }
            } catch (error) {
                console.error('Failed to load dashjs or initialize DASH player:', error)
                return noopEngine
            }
        }
    })
}
