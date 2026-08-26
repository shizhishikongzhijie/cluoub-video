import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createPlayer } from '../core/createPlayer'
import { definePlugin } from '../core/plugin'
import type { PlayerInstance } from '../core/types'
import { PlayerProvider, usePluginApi } from './context'

const players: PlayerInstance[] = []

beforeEach(() => {
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve()) as typeof HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.pause = vi.fn() as typeof HTMLMediaElement.prototype.pause
    HTMLMediaElement.prototype.load = vi.fn() as typeof HTMLMediaElement.prototype.load
})

afterEach(() => {
    cleanup()
    players.splice(0).forEach((player) => player.destroy())
})

describe('React player hooks', () => {
    it('usePluginApi 跟随插件增量安装和卸载刷新', () => {
        const plugin = definePlugin<undefined, string>({ id: 'react-api', setup: () => ({ api: 'ready' }) })
        const player = createPlayer({ source: 'test.mp4' })
        players.push(player)

        const Probe = () => <output>{usePluginApi(plugin) ?? 'missing'}</output>
        render(
            <PlayerProvider player={player}>
                <Probe />
            </PlayerProvider>
        )

        expect(screen.getByText('missing')).toBeDefined()
        act(() => player.plugins.set([plugin]))
        expect(screen.getByText('ready')).toBeDefined()
        act(() => player.plugins.set([]))
        expect(screen.getByText('missing')).toBeDefined()
    })
})
