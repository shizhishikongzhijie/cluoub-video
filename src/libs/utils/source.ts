import type { PlayerSource, VideoSource } from '../core/types'

// 解析视频源，支持 string / VideoSource / VideoSource[]
export const resolveSource = (source: PlayerSource): string => {
    if (typeof source === 'string') return source
    if (Array.isArray(source)) return source[0]?.src ?? ''
    return source?.src ?? ''
}

export const resolveSources = (source: PlayerSource): VideoSource[] => {
    if (typeof source === 'string') return [{ src: source }]
    return Array.isArray(source) ? source : [source]
}

// 流媒体源（m3u8/mpd）判定：切集时交由对应流媒体插件接管
export const isStreamingSource = (src: string): boolean => /\.(m3u8|mpd)(\?|$)/i.test(src)
