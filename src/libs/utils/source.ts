import type { CluoubVideoProps } from '../types'

// 解析视频源，支持 string / VideoSource / VideoSource[]
export const resolveSource = (source: CluoubVideoProps['source']): string => {
    if (typeof source === 'string') return source
    if (Array.isArray(source)) return source[0]?.src ?? ''
    return source?.src ?? ''
}

// 流媒体源（m3u8/mpd）判定：切集时交由对应流媒体插件接管
export const isStreamingSource = (src: string): boolean => /\.(m3u8|mpd)(\?|$)/i.test(src)
