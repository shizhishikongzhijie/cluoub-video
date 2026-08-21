import { DEFAULT_SUBTITLE_STYLES, type IPlayerPlugin } from '../../core/types'
import { SubtitleLayer } from './SubtitleLayer'
import { SubtitleMenuBtn } from './SubtitleMenuBtn'

export interface SubtitleTrack {
    id: string
    label: string
    src: string
    lang: string
    type: 'vtt' | 'srt' | 'ass'
}

export interface SubtitleConfig {
    tracks: SubtitleTrack[]
    defaultShow?: boolean
}

export const subtitlePlugin: IPlayerPlugin<SubtitleConfig> = (player) => {
    const { tracks = [], defaultShow = true } = player.options || {}

    // 1. 初始化状态
    player.store.setState({
        subtitleTrack: 0,
        isSubtitleVisible: defaultShow,
        subtitleStyles: DEFAULT_SUBTITLE_STYLES,
        subtitleOffset: 0
    })

    // 2. 注册 UI：字幕渲染层
    player.registerUI(
        'subtitle-layer',
        <SubtitleLayer player={player} tracks={tracks} />,
        'layer',
        { zIndex: 5 } // 在弹幕之下
    )

    // 3. 注册 UI：控制栏按钮 (带 Popover)
    player.registerUI('subtitle-btn', <SubtitleMenuBtn player={player} tracks={tracks} />, 'control', {
        order: 3,
        position: 'right'
    })

    return () => {
        player.unregisterUI('subtitle-layer')
        player.unregisterUI('subtitle-btn')
    }
}
