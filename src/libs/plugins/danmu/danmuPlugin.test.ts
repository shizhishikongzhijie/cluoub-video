import { describe, expect, it, vi } from 'vitest'

import { createPlayerStore } from '../../core/store'
import type { PlayerInstance } from '../../core/types'
import type { CluoubVideoProps } from '../../types'
import { danmuPlugin } from './index'

type Listener = (...args: any[]) => void

const makeMockPlayer = (options: Partial<CluoubVideoProps> = {}) => {
    const store = createPlayerStore()
    const listeners = new Map<string, Set<Listener>>()
    return {
        store,
        options,
        video: {} as HTMLVideoElement,
        danmu: undefined,
        registerUI: vi.fn(),
        unregisterUI: vi.fn(),
        registerCaptureLayer: vi.fn(),
        unregisterCaptureLayer: vi.fn(),
        on: (event: string, fn: Listener) => {
            if (!listeners.has(event)) listeners.set(event, new Set())
            listeners.get(event)!.add(fn)
        },
        off: (event: string, fn: Listener) => listeners.get(event)?.delete(fn),
        emit: (event: string, ...args: any[]) => listeners.get(event)?.forEach((fn) => fn(...args))
    } as unknown as PlayerInstance
}

describe('danmuPlugin 外部控制 API', () => {
    it('安装后挂载 player.danmu，卸载时清空', () => {
        const player = makeMockPlayer()
        const cleanup = danmuPlugin(player)
        expect(player.danmu).toBeDefined()
        expect(typeof player.danmu?.send).toBe('function')
        cleanup?.()
        expect(player.danmu).toBeUndefined()
    })

    it('send 通过事件总线发射 danmu-send（含可选参数）', () => {
        const player = makeMockPlayer()
        const handler = vi.fn()
        player.on('danmu-send', handler)
        danmuPlugin(player)
        player.danmu?.send('你好', { mode: 'top', color: '#ff0000' })
        expect(handler).toHaveBeenCalledWith('你好', { mode: 'top', color: '#ff0000' })
    })

    it('setVisible / toggleVisible / setMode / setColor 更新 store', () => {
        const player = makeMockPlayer({ defaultShow: true })
        danmuPlugin(player)
        player.danmu?.setVisible(false)
        expect(player.store.getState().isDanmuVisible).toBe(false)
        player.danmu?.toggleVisible()
        expect(player.store.getState().isDanmuVisible).toBe(true)
        player.danmu?.setMode('bottom')
        expect(player.store.getState().danmuMode).toBe('bottom')
        player.danmu?.setColor('#ffd54a')
        expect(player.store.getState().danmuColor).toBe('#ffd54a')
    })

    it('默认值：visible 取 defaultShow，模式滚动、颜色白，可被配置覆盖', () => {
        const player = makeMockPlayer({ defaultShow: false, danmuMode: 'top', danmuColor: '#00a1d6' })
        danmuPlugin(player)
        const s = player.store.getState()
        expect(s.isDanmuVisible).toBe(false)
        expect(s.danmuMode).toBe('top')
        expect(s.danmuColor).toBe('#00a1d6')
    })

    it('showDanmuBar=true 时挂载弹幕操作栏，默认不挂载', () => {
        const off = makeMockPlayer()
        danmuPlugin(off)
        expect(off.registerUI).not.toHaveBeenCalledWith('danmu-bar', expect.anything(), 'layer', expect.anything())

        const on = makeMockPlayer({ showDanmuBar: true })
        danmuPlugin(on)
        expect(on.registerUI).toHaveBeenCalledWith('danmu-bar', expect.anything(), 'layer', { zIndex: 25 })
    })
})
