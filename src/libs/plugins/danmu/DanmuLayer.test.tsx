import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createPlayerStore } from '../../core/store'
import type { PlayerInstance } from '../../core/types'
import { DanmuLayer } from './DanmuLayer'

const createPlayer = () => {
    const store = createPlayerStore()
    const register = vi.fn()
    const unregister = vi.fn()
    const listeners = new Map<string, ((...args: any[]) => void)[]>()
    const on = vi.fn((event: string, fn: (...args: any[]) => void) => {
        const list = listeners.get(event) ?? []
        list.push(fn)
        listeners.set(event, list)
    })
    const off = vi.fn((event: string, fn: (...args: any[]) => void) => {
        listeners.set(
            event,
            (listeners.get(event) ?? []).filter((f) => f !== fn)
        )
    })
    const emit = vi.fn((event: string, ...args: any[]) => {
        ;(listeners.get(event) ?? []).forEach((fn) => fn(...args))
    })
    // 模拟 video 元素：仅用于事件订阅（seeking）
    const videoListeners = new Map<string, ((...args: any[]) => void)[]>()
    const video = {
        addEventListener: vi.fn((type: string, fn: (...args: any[]) => void) => {
            const list = videoListeners.get(type) ?? []
            list.push(fn)
            videoListeners.set(type, list)
        }),
        removeEventListener: vi.fn((type: string, fn: (...args: any[]) => void) => {
            videoListeners.set(
                type,
                (videoListeners.get(type) ?? []).filter((f) => f !== fn)
            )
        })
    } as unknown as HTMLVideoElement
    const fireSeeking = () => (videoListeners.get('seeking') ?? []).forEach((fn) => fn())
    const player = {
        store,
        video,
        registerCaptureLayer: register,
        unregisterCaptureLayer: unregister,
        on,
        off,
        emit
    } as unknown as PlayerInstance
    return { player, register, unregister, on, off, fireSeeking }
}

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

describe('DanmuLayer canvas 渲染', () => {
    it('可见时渲染 <canvas data-capture-layer> 并注册为捕获层', () => {
        const { player, register } = createPlayer()
        render(<DanmuLayer player={player} data={[{ time: 0, text: 'hi' }]} />)
        expect(document.querySelector('canvas[data-capture-layer="danmu"]')).not.toBeNull()
        expect(register).toHaveBeenCalledWith('danmu', expect.any(Function))
    })

    it('隐藏时卸载 canvas 并注销捕获层', () => {
        const { player, register, unregister } = createPlayer()
        render(<DanmuLayer player={player} data={[{ time: 0, text: 'hi' }]} />)
        expect(register).toHaveBeenCalledWith('danmu', expect.any(Function))
        act(() => {
            player.store.setState({ isDanmuVisible: false })
        })
        expect(document.querySelector('canvas[data-capture-layer="danmu"]')).toBeNull()
        expect(unregister).toHaveBeenCalledWith('danmu')
    })

    it('发射弹幕不抛错（jsdom 无 2d ctx，回退估算宽度）', () => {
        const { player } = createPlayer()
        render(<DanmuLayer player={player} data={[{ time: 0, text: '你好' }]} />)
        act(() => {
            player.store.setState({ currentTime: 10 })
        })
        expect(document.querySelector('canvas[data-capture-layer="danmu"]')).not.toBeNull()
    })

    it('订阅 danmu-send 接收外部发送的弹幕且不抛错', () => {
        const { player, on } = createPlayer()
        render(<DanmuLayer player={player} data={[]} />)
        expect(on).toHaveBeenCalledWith('danmu-send', expect.any(Function))
        act(() => {
            player.emit('danmu-send', '外部弹幕', { mode: 'top', color: '#ff0000' })
            player.emit('danmu-send', '   ')
        })
        expect(document.querySelector('canvas[data-capture-layer="danmu"]')).not.toBeNull()
    })

    it('隐藏时卸载 danmu-send 订阅（发送 no-op）', () => {
        const { player, on, off } = createPlayer()
        render(<DanmuLayer player={player} data={[]} />)
        expect(on).toHaveBeenCalledWith('danmu-send', expect.any(Function))
        act(() => {
            player.store.setState({ isDanmuVisible: false })
        })
        expect(off).toHaveBeenCalledWith('danmu-send', expect.any(Function))
    })

    it('监听 video seeking（进度条拖动）并清空重定位，不抛错', () => {
        const { player, fireSeeking } = createPlayer()
        render(<DanmuLayer player={player} data={[{ time: 5, text: '未来弹幕' }]} />)
        expect(player.video.addEventListener).toHaveBeenCalledWith('seeking', expect.any(Function))
        act(() => {
            player.store.setState({ currentTime: 1 })
            fireSeeking()
        })
        expect(document.querySelector('canvas[data-capture-layer="danmu"]')).not.toBeNull()
    })

    it('卸载时移除 seeking 监听', () => {
        const { player } = createPlayer()
        const { unmount } = render(<DanmuLayer player={player} data={[]} />)
        unmount()
        expect(player.video.removeEventListener).toHaveBeenCalledWith('seeking', expect.any(Function))
    })
})
