import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createPlayer } from './createPlayer'
import { definePlugin } from './plugin'
import type { PlayerInstance } from './types'

const players: PlayerInstance[] = []

beforeEach(() => {
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve()) as typeof HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.pause = vi.fn() as typeof HTMLMediaElement.prototype.pause
    HTMLMediaElement.prototype.load = vi.fn() as typeof HTMLMediaElement.prototype.load
})

afterEach(() => players.splice(0).forEach((player) => player.destroy()))

const makePlayer = (options: Parameters<typeof createPlayer>[0]) => {
    const player = createPlayer(options)
    players.push(player)
    return player
}

describe('plugin runtime', () => {
    it('安装顺序确定，销毁时逆序清理且 destroy 幂等', () => {
        const calls: string[] = []
        const first = definePlugin({ id: 'first', setup: () => () => calls.push('cleanup:first') })
        const second = definePlugin({ id: 'second', setup: () => () => calls.push('cleanup:second') })
        const player = makePlayer({ source: 'test.mp4', plugins: [first, second] })
        player.destroy()
        player.destroy()
        expect(calls).toEqual(['cleanup:second', 'cleanup:first'])
    })

    it('重复 ID 保留首项并报告结构化 config 错误', () => {
        const onPluginError = vi.fn()
        const first = definePlugin<undefined, string>({ id: 'same', setup: () => ({ api: 'first' }) })
        const secondSetup = vi.fn()
        const second = definePlugin({ id: 'same', setup: secondSetup })
        const player = makePlayer({ source: 'test.mp4', plugins: [first, second], onPluginError })
        expect(player.plugins.get(first)).toBe('first')
        expect(secondSetup).not.toHaveBeenCalled()
        expect(onPluginError).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'PluginError', pluginId: 'same', phase: 'config' })
        )
    })

    it('配置实例不变时不重装，配置变化时增量更新', () => {
        const setup = vi.fn((_config: { value: number }) => vi.fn())
        const plugin = definePlugin<{ value: number }>({ id: 'updatable', setup: (_context, config) => setup(config) })
        const initial = plugin.configure({ value: 1 })
        const player = makePlayer({ source: 'test.mp4', plugins: [initial] })
        player.plugins.set([initial])
        expect(setup).toHaveBeenCalledTimes(1)
        player.plugins.set([plugin.configure({ value: 2 })])
        expect(setup).toHaveBeenCalledTimes(2)
        expect(setup).toHaveBeenLastCalledWith({ value: 2 })
    })

    it('自动回收事件、Slot、捕获层，即使插件未手工注销', () => {
        const plugin = definePlugin({
            id: 'scoped',
            setup: (context) => {
                context.on('custom', vi.fn())
                context.slots.register({ id: 'scoped-slot', slot: 'overlay', content: null })
                context.registerCaptureLayer('scoped-canvas', () => null)
            }
        })
        const player = makePlayer({ source: 'test.mp4', plugins: [plugin] })
        expect(player.slots.getSnapshot()).toHaveLength(1)
        expect(player.captureLayers).toHaveLength(1)
        player.plugins.set([])
        expect(player.slots.getSnapshot()).toHaveLength(0)
        expect(player.captureLayers).toHaveLength(0)
    })

    it('runtime 错误只禁用当前插件，其他插件继续工作', () => {
        const onPluginError = vi.fn()
        const failed = definePlugin({
            id: 'failed',
            setup: (context) => {
                context.slots.register({ id: 'failed-slot', slot: 'overlay', content: null })
                context.reportError(new Error('boom'))
            }
        })
        const healthy = definePlugin<undefined, string>({ id: 'healthy', setup: () => ({ api: 'ok' }) })
        const player = makePlayer({ source: 'test.mp4', plugins: [failed, healthy], onPluginError })
        expect(player.plugins.has(failed)).toBe(false)
        expect(player.plugins.get(healthy)).toBe('ok')
        expect(player.slots.getSnapshot()).toEqual([])
        expect(onPluginError).toHaveBeenCalledWith(expect.objectContaining({ pluginId: 'failed', phase: 'runtime' }))
    })

    it('异步 setup 在卸载后完成时立即执行其 cleanup', async () => {
        let resolveSetup!: (result: { cleanup: () => void }) => void
        const cleanup = vi.fn()
        const plugin = definePlugin({
            id: 'async',
            setup: () => new Promise<{ cleanup: () => void }>((resolve) => (resolveSetup = resolve))
        })
        const player = makePlayer({ source: 'test.mp4', plugins: [plugin] })
        player.plugins.set([])
        resolveSetup({ cleanup })
        await Promise.resolve()
        expect(cleanup).toHaveBeenCalledOnce()
    })
})
