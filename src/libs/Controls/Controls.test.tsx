import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createPlayerStore } from '../core/store'
import type { PlayerInstance } from '../core/types'
import { Controls } from './index'

// 构造一个最小可用的 mock player：真实 store + 被 spy 的方法
const createMockPlayer = (overrides?: Partial<PlayerInstance>): PlayerInstance => {
    const store = createPlayerStore()
    const player = {
        store,
        options: {},
        togglePlay: vi.fn(),
        toggleMute: vi.fn(),
        setVolume: vi.fn(),
        toggleFullscreen: vi.fn(),
        seek: vi.fn(),
        setPlaybackRate: vi.fn(),
        togglePip: vi.fn(),
        toggleLoop: vi.fn(),
        next: vi.fn(),
        prev: vi.fn(),
        ...overrides
    } as unknown as PlayerInstance
    return player
}

afterEach(cleanup)

describe('Controls 交互', () => {
    it('点击播放按钮触发 togglePlay', () => {
        const player = createMockPlayer()
        render(<Controls player={player} />)
        fireEvent.click(screen.getByLabelText('播放'))
        expect(player.togglePlay).toHaveBeenCalledOnce()
    })

    it('播放中时播放按钮 aria-label 为暂停', () => {
        const player = createMockPlayer()
        player.store.setState({ isPlaying: true })
        render(<Controls player={player} />)
        expect(screen.getByLabelText('暂停')).toBeDefined()
    })

    it('点击静音按钮触发 toggleMute', () => {
        const player = createMockPlayer()
        render(<Controls player={player} />)
        fireEvent.click(screen.getByLabelText('静音'))
        expect(player.toggleMute).toHaveBeenCalledOnce()
    })

    it('点击全屏按钮触发 toggleFullscreen', () => {
        const player = createMockPlayer()
        render(<Controls player={player} />)
        fireEvent.click(screen.getByLabelText('全屏'))
        expect(player.toggleFullscreen).toHaveBeenCalledOnce()
    })

    it('选择倍速触发 setPlaybackRate', () => {
        const player = createMockPlayer()
        render(<Controls player={player} />)
        // hover 展开倍速菜单
        fireEvent.mouseEnter(screen.getByLabelText('播放速度').parentElement!)
        fireEvent.click(screen.getByText('2x'))
        expect(player.setPlaybackRate).toHaveBeenCalledWith(2)
    })

    it('controls=false 时不渲染播放按钮', () => {
        const player = createMockPlayer({ options: { controls: false } } as Partial<PlayerInstance>)
        render(<Controls player={player} />)
        expect(screen.queryByLabelText('播放')).toBeNull()
    })

    describe('播放列表按钮', () => {
        it('playlistLength<=1 时不显示上一集/下一集', () => {
            const player = createMockPlayer()
            player.store.setState({ playlistLength: 1 })
            render(<Controls player={player} />)
            expect(screen.queryByLabelText('上一集')).toBeNull()
            expect(screen.queryByLabelText('下一集')).toBeNull()
        })

        it('多集时显示并能切集', () => {
            const player = createMockPlayer()
            player.store.setState({ playlistLength: 3, playlistIndex: 1 })
            render(<Controls player={player} />)
            fireEvent.click(screen.getByLabelText('下一集'))
            fireEvent.click(screen.getByLabelText('上一集'))
            expect(player.next).toHaveBeenCalledOnce()
            expect(player.prev).toHaveBeenCalledOnce()
        })

        it('首集禁用上一集，末集禁用下一集', () => {
            const player = createMockPlayer()
            player.store.setState({ playlistLength: 3, playlistIndex: 0 })
            render(<Controls player={player} />)
            expect((screen.getByLabelText('上一集') as HTMLButtonElement).disabled).toBe(true)
            expect((screen.getByLabelText('下一集') as HTMLButtonElement).disabled).toBe(false)
        })
    })
})
