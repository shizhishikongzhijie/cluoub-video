import { forwardRef, useMemo } from 'react'

import type { PlayerPlugin, PlayerPluginEntry } from './core/types'
import type { CaptureConfig } from './plugins/capture/CaptureControl'
import type { DanmuItem } from './plugins/danmu'
import type { SubtitleTrack } from './plugins/subtitle'
import type { CluoubVideoProps, LegacyCluoubVideoProps, VideoRef } from './types'
import { CluoubVideo as StrictCluoubVideo } from './video'

type LegacyPluginProps = Pick<
    LegacyCluoubVideoProps,
    'capture' | 'danmuColor' | 'danmuList' | 'danmuMode' | 'dataPrefix' | 'defaultShow' | 'showDanmuBar' | 'tracks'
>

const configureLegacyEntry = (entry: PlayerPluginEntry, props: LegacyPluginProps): PlayerPluginEntry => {
    if (typeof entry !== 'object' || entry.kind !== 'cluoub-player-plugin') return entry
    const plugin = entry as PlayerPlugin<unknown, unknown>
    let config: unknown
    switch (entry.id) {
        case 'danmu':
            config = {
                danmuList: props.danmuList as DanmuItem[] | undefined,
                defaultShow: props.defaultShow,
                showDanmuBar: props.showDanmuBar,
                danmuColor: props.danmuColor,
                danmuMode: props.danmuMode
            }
            break
        case 'subtitle':
            config = {
                tracks: (props.tracks as SubtitleTrack[] | undefined) ?? [],
                defaultShow: props.defaultShow
            }
            break
        case 'capture':
            config = (props.capture as CaptureConfig | undefined) ?? {}
            break
        case 'dash':
            config = { dataPrefix: props.dataPrefix }
            break
        case 'hls':
            config = {}
            break
        default:
            return entry
    }
    return plugin.configure(config)
}

/**
 * @deprecated 0.3 beta 根入口兼容组件。新代码请从 `/react` 导入，并使用 plugin.configure。
 */
export const CluoubVideo = forwardRef<VideoRef, LegacyCluoubVideoProps>((props, ref) => {
    const { capture, danmuColor, danmuList, danmuMode, dataPrefix, defaultShow, plugins, showDanmuBar, tracks } = props
    const strictProps = { ...props } as CluoubVideoProps & Record<string, unknown>
    for (const key of [
        'danmuList',
        'defaultShow',
        'showDanmuBar',
        'danmuColor',
        'danmuMode',
        'tracks',
        'capture',
        'dataPrefix'
    ]) {
        delete strictProps[key]
    }
    const configuredPlugins = useMemo(
        () =>
            plugins?.map((entry) =>
                configureLegacyEntry(entry, {
                    capture,
                    danmuColor,
                    danmuList,
                    danmuMode,
                    dataPrefix,
                    defaultShow,
                    showDanmuBar,
                    tracks
                })
            ),
        [capture, danmuColor, danmuList, danmuMode, dataPrefix, defaultShow, plugins, showDanmuBar, tracks]
    )
    return <StrictCluoubVideo {...strictProps} ref={ref} plugins={configuredPlugins} />
})

CluoubVideo.displayName = 'CluoubVideoCompatibilityFacade'
