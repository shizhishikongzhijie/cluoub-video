import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createPlayer } from '../../core/createPlayer'
import type { PlayerInstance } from '../../core/types'
import { danmuPlugin } from './index'

beforeEach(() => {
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve()) as typeof HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.pause = vi.fn() as typeof HTMLMediaElement.prototype.pause
    HTMLMediaElement.prototype.load = vi.fn() as typeof HTMLMediaElement.prototype.load
})

const players: PlayerInstance[] = []
afterEach(() => {
    players.splice(0).forEach((player) => player.destroy())
})

const makePlayer = (config: Parameters<typeof danmuPlugin.configure>[0] = {}) => {
    const player = createPlayer({ source: 'test.mp4', plugins: [danmuPlugin.configure(config)] })
    players.push(player)
    return player
}

describe('danmuPlugin 外部控制 API', () => {
    it('通过 plugins.get 暴露 API，并保留 player.danmu 兼容别名', () => {
        const player = makePlayer()
        const api = player.plugins.get(danmuPlugin)
        expect(api).toBeDefined()
        expect(player.danmu).toBe(api)
        player.destroy()
        expect(player.danmu).toBeUndefined()
    })

    it('send 通过事件总线发射 danmu-send', () => {
        const player = makePlayer()
        const handler = vi.fn()
        player.on('danmu-send', handler)
        player.plugins.get(danmuPlugin)?.send('你好', { mode: 'top', color: '#ff0000' })
        expect(handler).toHaveBeenCalledWith('你好', { mode: 'top', color: '#ff0000' })
    })

    it('API 更新弹幕状态，schema 应用默认值和显式配置', () => {
        const player = makePlayer({ defaultShow: false, danmuMode: 'top', danmuColor: '#00a1d6' })
        const api = player.plugins.get(danmuPlugin)!
        expect(api.store.getState()).toMatchObject({
            isVisible: false,
            mode: 'top',
            color: '#00a1d6'
        })
        api.toggleVisible()
        api.setMode('bottom')
        api.setColor('#ffd54a')
        expect(api.store.getState()).toMatchObject({
            isVisible: true,
            mode: 'bottom',
            color: '#ffd54a'
        })
    })

    it('showDanmuBar 控制 Slot，并拒绝未知配置字段', () => {
        const off = makePlayer()
        expect(off.slots.getSnapshot().some((slot) => slot.id === 'danmu-bar')).toBe(false)
        const on = makePlayer({ showDanmuBar: true })
        expect(on.slots.getSnapshot().some((slot) => slot.id === 'danmu-bar')).toBe(true)

        const onPluginError = vi.fn()
        const player = createPlayer({
            source: 'test.mp4',
            plugins: [danmuPlugin.configure({ unexpected: true } as never)],
            onPluginError
        })
        players.push(player)
        expect(onPluginError).toHaveBeenCalledWith(expect.objectContaining({ pluginId: 'danmu', phase: 'config' }))
        expect(player.plugins.has(danmuPlugin)).toBe(false)
    })
})
