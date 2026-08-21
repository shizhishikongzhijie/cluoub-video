import type { DanmuAPI, IPlayerPlugin } from '../../core/types'
import { DanmuBar } from './DanmuBar'
import { DanmuLayer } from './DanmuLayer'
import { DanmuToggleBtn } from './DanmuToggleBtn'
import type { DanmuItem } from './engine'

export type { DanmuAPI, SendDanmuOptions } from '../../core/types'
export type { DanmuItem } from './engine'

export interface DanmuConfig {
    danmuList?: DanmuItem[]
    defaultShow?: boolean
    /** 是否在播放器底部自动挂载弹幕操作栏（输入框+发送+模式/颜色/开关），默认 false */
    showDanmuBar?: boolean
    /** 默认发送弹幕颜色 */
    danmuColor?: string
    /** 默认发送弹幕模式 */
    danmuMode?: 'scroll' | 'top' | 'bottom'
}

/**
 * 弹幕插件：在视频上叠加滚动/顶部/底部弹幕，支持碰撞检测分配弹道。
 * 通过 props.danmuList 提供弹幕数据，按 currentTime 时间轴发射。
 *
 * 外部控制：
 * - 安装后把 DanmuAPI 挂到 player.danmu，可程序化发送/开关/设置模式与颜色；
 * - showDanmuBar 时自动挂载 B 站式弹幕操作栏，也可外部渲染 <DanmuBar player={player} />。
 */
export const danmuPlugin: IPlayerPlugin<DanmuConfig> = (player) => {
    const danmuList: DanmuItem[] = player.options.danmuList ?? []
    const defaultShow = player.options.defaultShow ?? true
    const showDanmuBar = player.options.showDanmuBar ?? false

    player.store.setState({
        isDanmuVisible: defaultShow,
        danmuMode: player.options.danmuMode ?? 'scroll',
        danmuColor: player.options.danmuColor ?? '#ffffff'
    })

    // 外部控制 API：send 走事件总线由 DanmuLayer 订阅消费（弹幕隐藏时 no-op）
    const api: DanmuAPI = {
        send: (text, options) => player.emit('danmu-send', text, options),
        setVisible: (visible) => player.store.setState({ isDanmuVisible: visible }),
        toggleVisible: () => player.store.setState({ isDanmuVisible: !player.store.getState().isDanmuVisible }),
        setMode: (mode) => player.store.setState({ danmuMode: mode }),
        setColor: (color) => player.store.setState({ danmuColor: color })
    }
    player.danmu = api

    // 弹幕渲染层（在字幕之上）
    player.registerUI('danmu-layer', <DanmuLayer player={player} data={danmuList} />, 'layer', { zIndex: 8 })

    // B 站式弹幕操作栏（专门的弹幕操作区）
    if (showDanmuBar) {
        player.registerUI('danmu-bar', <DanmuBar player={player} docked />, 'layer', { zIndex: 25 })
    }

    // 控制栏开关按钮（controlKey 关联内置 controls 配置中的 danmu 开关）
    player.registerUI('danmu-btn', <DanmuToggleBtn player={player} />, 'control', {
        order: 2,
        position: 'right',
        controlKey: 'danmu'
    })

    return () => {
        player.danmu = undefined
        player.unregisterUI('danmu-layer')
        player.unregisterUI('danmu-bar')
        player.unregisterUI('danmu-btn')
    }
}
