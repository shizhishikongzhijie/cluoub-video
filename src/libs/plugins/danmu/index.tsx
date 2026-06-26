import type { IPlayerPlugin } from '../../core/types'
import { DanmuLayer } from './DanmuLayer'
import { DanmuToggleBtn } from './DanmuToggleBtn'
import type { DanmuItem } from './engine'

export type { DanmuItem } from './engine'

export interface DanmuConfig {
    danmuList?: DanmuItem[]
    defaultShow?: boolean
}

/**
 * 弹幕插件：在视频上叠加滚动/顶部/底部弹幕，支持碰撞检测分配弹道。
 * 通过 props.danmuList 提供弹幕数据，按 currentTime 时间轴发射。
 */
export const danmuPlugin: IPlayerPlugin<DanmuConfig> = (player) => {
    const danmuList: DanmuItem[] = player.options.danmuList ?? []
    const defaultShow = player.options.defaultShow ?? true

    player.store.setState({ isDanmuVisible: defaultShow })

    // 弹幕渲染层（在字幕之上）
    player.registerUI('danmu-layer', <DanmuLayer player={player} data={danmuList} />, 'layer', { zIndex: 8 })

    // 控制栏开关按钮（id 与 Controls 中 danmu 配置过滤约定一致）
    player.registerUI('danmu-btn', <DanmuToggleBtn player={player} />, 'control', {
        order: 2,
        position: 'right'
    })

    return () => {
        player.unregisterUI('danmu-layer')
        player.unregisterUI('danmu-btn')
    }
}
