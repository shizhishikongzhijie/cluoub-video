import { forwardRef, useMemo } from 'react'

import type { PlayerPluginEntry } from './core/types'
import { capturePlugin } from './plugins/capture'
import type { CaptureConfig } from './plugins/capture/CaptureControl'
import { type DanmuItem, danmuPlugin } from './plugins/danmu'
import { dashPlugin } from './plugins/dash'
import { hlsPlugin } from './plugins/hls'
import { subtitlePlugin, type SubtitleTrack } from './plugins/subtitle'
import type { CluoubVideoProps, LegacyCluoubVideoProps, VideoRef } from './types'
import { CluoubVideo as StrictCluoubVideo } from './video'

type LegacyPluginProps = Pick<
    LegacyCluoubVideoProps,
    'capture' | 'danmuColor' | 'danmuList' | 'danmuMode' | 'dataPrefix' | 'defaultShow' | 'showDanmuBar' | 'tracks'
>

const configureLegacyEntry = (entry: PlayerPluginEntry, props: LegacyPluginProps): PlayerPluginEntry => {
    if (typeof entry !== 'object' || entry.kind !== 'cluoub-player-plugin') return entry
    switch (entry.id) {
        case danmuPlugin.id:
            return danmuPlugin.configure({
                danmuList: props.danmuList as DanmuItem[] | undefined,
                defaultShow: props.defaultShow,
                showDanmuBar: props.showDanmuBar,
                danmuColor: props.danmuColor,
                danmuMode: props.danmuMode
            })
        case subtitlePlugin.id:
            return subtitlePlugin.configure({
                tracks: (props.tracks as SubtitleTrack[] | undefined) ?? [],
                defaultShow: props.defaultShow
            })
        case capturePlugin.id:
            return capturePlugin.configure((props.capture as CaptureConfig | undefined) ?? {})
        case dashPlugin.id:
            return dashPlugin.configure({ dataPrefix: props.dataPrefix })
        case hlsPlugin.id:
            return hlsPlugin.configure({})
        default:
            return entry
    }
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
