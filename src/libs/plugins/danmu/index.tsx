import { optionalBoolean, optionalString, parseConfigObject } from '../../core/config'
import { definePlugin } from '../../core/plugin'
import { DanmuBar } from './DanmuBar'
import { DanmuLayer } from './DanmuLayer'
import { DanmuToggleBtn } from './DanmuToggleBtn'
import type { DanmuItem } from './engine'
import { createDanmuStore, type DanmuAPI } from './state'

export type { DanmuItem } from './engine'
export type { DanmuAPI, DanmuMode, DanmuState, SendDanmuOptions } from './state'

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
const parseDanmuList = (input: unknown): DanmuItem[] => {
    if (input === undefined) return []
    if (!Array.isArray(input)) throw new TypeError('danmuList must be an array')
    return input.map((value, index) => {
        const item = parseConfigObject(value, `danmuList[${index}]`, ['time', 'text', 'color', 'mode'])
        if (typeof item.time !== 'number' || !Number.isFinite(item.time)) {
            throw new TypeError(`danmuList[${index}].time must be a finite number`)
        }
        if (typeof item.text !== 'string') throw new TypeError(`danmuList[${index}].text must be a string`)
        if (item.color !== undefined && typeof item.color !== 'string') {
            throw new TypeError(`danmuList[${index}].color must be a string`)
        }
        if (item.mode !== undefined && !['scroll', 'top', 'bottom'].includes(String(item.mode))) {
            throw new TypeError(`danmuList[${index}].mode is invalid`)
        }
        return item as unknown as DanmuItem
    })
}

const parseDanmuConfig = (input: unknown): Required<DanmuConfig> => {
    const config = parseConfigObject(input, 'danmu', [
        'danmuList',
        'defaultShow',
        'showDanmuBar',
        'danmuColor',
        'danmuMode'
    ])
    const danmuMode = optionalString(config, 'danmuMode', 'scroll')
    if (!['scroll', 'top', 'bottom'].includes(danmuMode)) throw new TypeError('danmuMode is invalid')
    return {
        danmuList: parseDanmuList(config.danmuList),
        defaultShow: optionalBoolean(config, 'defaultShow', true),
        showDanmuBar: optionalBoolean(config, 'showDanmuBar', false),
        danmuColor: optionalString(config, 'danmuColor', '#ffffff'),
        danmuMode: danmuMode as Required<DanmuConfig>['danmuMode']
    }
}

export const danmuPlugin = definePlugin<DanmuConfig, DanmuAPI>({
    id: 'danmu',
    schema: { parse: parseDanmuConfig },
    setup: ({ player, slots }, config) => {
        const { danmuList, defaultShow, showDanmuBar, danmuColor, danmuMode } = config as Required<DanmuConfig>

        const store = createDanmuStore({ isVisible: defaultShow, mode: danmuMode, color: danmuColor })

        // 外部控制 API：send 走事件总线由 DanmuLayer 订阅消费（弹幕隐藏时 no-op）
        const api: DanmuAPI = {
            store,
            send: (text, options) => player.emit('danmu-send', text, options),
            setVisible: (isVisible) => store.setState({ isVisible }),
            toggleVisible: () => store.setState((state) => ({ isVisible: !state.isVisible })),
            setMode: (mode) => store.setState({ mode }),
            setColor: (color) => store.setState({ color })
        }
        player.danmu = api

        // 弹幕渲染层（在字幕之上）
        slots.register({
            id: 'danmu-layer',
            slot: 'overlay',
            content: <DanmuLayer player={player} data={danmuList} api={api} />,
            zIndex: 8
        })

        // B 站式弹幕操作栏（专门的弹幕操作区）
        if (showDanmuBar) {
            slots.register({
                id: 'danmu-bar',
                slot: 'overlay',
                content: <DanmuBar player={player} api={api} docked />,
                zIndex: 25
            })
        }

        // 控制栏开关按钮（controlKey 关联内置 controls 配置中的 danmu 开关）
        slots.register({
            id: 'danmu-btn',
            slot: 'controls.trailing',
            content: <DanmuToggleBtn api={api} />,
            order: 2,
            controlId: 'danmu'
        })

        return {
            api,
            cleanup: () => {
                if (player.danmu === api) player.danmu = undefined
            }
        }
    }
})
