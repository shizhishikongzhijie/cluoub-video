import { describe, expect, it, vi } from 'vitest'

import { createPlayerStore } from '../../core/store'
import type { PlayerInstance } from '../../core/types'
import { createStreamingPlugin, type StreamingSourceEngine, type StreamingSourceHandler } from './createStreamingPlugin'

// 构造最小 fake player：真实 store + 真实事件总线 + 被 spy 的 registerUI/unregisterUI
const createFakePlayer = (source: string) => {
    const store = createPlayerStore()
    const listeners = new Map<string, Set<(...args: any[]) => void>>()
    const player = {
        video: { src: '' } as unknown as HTMLVideoElement,
        store,
        options: { source },
        registerUI: vi.fn(),
        unregisterUI: vi.fn(),
        on: (evt: string, fn: (...args: any[]) => void) => {
            if (!listeners.has(evt)) listeners.set(evt, new Set())
            listeners.get(evt)!.add(fn)
        },
        off: (evt: string, fn: (...args: any[]) => void) => {
            listeners.get(evt)?.delete(fn)
        },
        emit: (evt: string, ...args: any[]) => {
            listeners.get(evt)?.forEach((fn) => fn(...args))
        }
    } as unknown as PlayerInstance
    return player
}

const makeHandler = (overrides: Partial<StreamingSourceHandler> = {}) => {
    const engine: StreamingSourceEngine = { setQuality: vi.fn(), dispose: vi.fn() }
    const createEngine = vi.fn(async (): Promise<StreamingSourceEngine> => engine)
    const handler: StreamingSourceHandler = {
        isStreamSrc: (s) => s.includes('.mpd'),
        controlId: 'quality-selector-dash',
        createEngine,
        ...overrides
    }
    return { engine, createEngine, handler }
}

// 等待引擎异步创建完成（createEngine 的 .then 回调在微任务中执行）
const flushEngine = () => Promise.resolve()

describe('createStreamingPlugin', () => {
    it('初始为流媒体源时立即接管：注册画质菜单并创建引擎', () => {
        const player = createFakePlayer('stream.mpd')
        const { createEngine, handler } = makeHandler()
        createStreamingPlugin(player, handler)
        expect(player.registerUI).toHaveBeenCalledWith(
            'quality-selector-dash',
            expect.anything(),
            'control',
            expect.objectContaining({ controlKey: 'quality', position: 'right' })
        )
        expect(createEngine).toHaveBeenCalledWith('stream.mpd', player)
    })

    it('初始为非流媒体源时不接管，切到流媒体源时再接管', () => {
        const player = createFakePlayer('movie.mp4')
        const { createEngine, handler } = makeHandler()
        createStreamingPlugin(player, handler)
        expect(createEngine).not.toHaveBeenCalled()
        player.emit('source-change', 'stream.mpd')
        expect(createEngine).toHaveBeenCalledWith('stream.mpd', player)
    })

    it('切到非流媒体源时释放：重置引擎、注销画质菜单、清空画质 store', async () => {
        const player = createFakePlayer('stream.mpd')
        const { engine, handler } = makeHandler()
        createStreamingPlugin(player, handler)
        await flushEngine()
        player.store.setState({ qualities: [{ key: '0', label: '1080P' }], activeQuality: '0' })
        player.emit('source-change', 'movie.mp4')
        expect(engine.dispose).toHaveBeenCalled()
        expect(player.unregisterUI).toHaveBeenCalledWith('quality-selector-dash')
        expect(player.store.getState().qualities).toEqual([])
        expect(player.store.getState().activeQuality).toBe('auto')
    })

    it('切回流媒体源时重新注册画质菜单并创建新引擎', async () => {
        const player = createFakePlayer('stream.mpd')
        const { engine, createEngine, handler } = makeHandler()
        createStreamingPlugin(player, handler)
        await flushEngine()
        player.emit('source-change', 'movie.mp4')
        player.emit('source-change', 'stream2.mpd')
        expect(player.unregisterUI).toHaveBeenCalledWith('quality-selector-dash')
        expect(player.registerUI).toHaveBeenCalledTimes(2)
        expect(createEngine).toHaveBeenLastCalledWith('stream2.mpd', player)
        // 旧引擎被释放
        expect(engine.dispose).toHaveBeenCalled()
    })

    it('request-quality-change 转发给当前引擎', async () => {
        const player = createFakePlayer('stream.mpd')
        const { engine, handler } = makeHandler()
        createStreamingPlugin(player, handler)
        await flushEngine()
        player.emit('request-quality-change', 'auto')
        player.emit('request-quality-change', '2')
        expect(engine.setQuality).toHaveBeenNthCalledWith(1, 'auto')
        expect(engine.setQuality).toHaveBeenNthCalledWith(2, '2')
    })

    it('清理函数解绑事件并释放引擎', async () => {
        const player = createFakePlayer('stream.mpd')
        const { engine, createEngine, handler } = makeHandler()
        const cleanup = createStreamingPlugin(player, handler)
        await flushEngine()
        cleanup()
        expect(engine.dispose).toHaveBeenCalled()
        expect(player.unregisterUI).toHaveBeenCalledWith('quality-selector-dash')
        // 解绑后切源不再创建引擎
        player.emit('source-change', 'other.mpd')
        expect(createEngine).toHaveBeenCalledTimes(1)
    })

    it('destroyed 后异步完成的引擎立即被释放', async () => {
        const player = createFakePlayer('movie.mp4')
        let resolveCreate!: (e: StreamingSourceEngine) => void
        const createEngine = vi.fn(() => new Promise<StreamingSourceEngine>((resolve) => (resolveCreate = resolve)))
        const handler: StreamingSourceHandler = {
            isStreamSrc: (s) => s.includes('.mpd'),
            controlId: 'quality-selector-dash',
            createEngine
        }
        const cleanup = createStreamingPlugin(player, handler)
        player.emit('source-change', 'stream.mpd')
        cleanup()
        const engine = { setQuality: vi.fn(), dispose: vi.fn() }
        resolveCreate(engine)
        await flushEngine()
        expect(engine.dispose).toHaveBeenCalled()
    })

    it('nativeLoad 返回 true 时同步接管且不创建引擎', () => {
        const player = createFakePlayer('stream.m3u8')
        const nativeLoad = vi.fn((src: string) => {
            player.video.src = src
            return true
        })
        const { createEngine, handler } = makeHandler({ isStreamSrc: () => true, nativeLoad })
        createStreamingPlugin(player, handler)
        expect(nativeLoad).toHaveBeenCalledWith('stream.m3u8', player)
        expect(player.video.src).toBe('stream.m3u8')
        expect(createEngine).not.toHaveBeenCalled()
        expect(player.registerUI).toHaveBeenCalled()
    })
})
