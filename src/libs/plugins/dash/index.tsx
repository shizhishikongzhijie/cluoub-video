import dashjs from 'dashjs'

import type {PlayerInstance} from '../../core/types'

export const dashPlugin = (player: PlayerInstance, config: any) => {
    const { options } = player
    const { source } = options
    if (typeof source === 'string' && !source.endsWith('.mpd')) return

    const dash = dashjs.MediaPlayer().create()

    dash.initialize(player.video, source, false)

    // 更新画质列表到 Store
    dash.on('manifestLoaded', () => {
        const qualities = dash.getBitrateInfoListFor('video').map((q: any) => ({
            key: q.qualityIndex,
            label: `${q.height}P`
        }))
        player.store.setState({ qualities })
    })

    // 监听画质切换请求 (通过 EventBus)
    const onQualityChange = (q: string) => {
        if (q === 'auto') {
            dash.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: true } } } })
        } else {
            dash.setQualityFor('video', parseInt(q))
        }
    }

    player.on('request-quality-change', onQualityChange)
    player.registerUI('quality-selector', <div>画质选择</div>, 'control')
    // 返回清理函数
    return () => {
        player.off('request-quality-change', onQualityChange)
        dash.reset()
    }
}
