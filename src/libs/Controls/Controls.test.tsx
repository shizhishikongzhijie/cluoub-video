import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
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
        toggleScreenMode: vi.fn(),
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

    it('全屏图标随状态切换：进入全屏后显示退出图标', () => {
        const player = createMockPlayer()
        render(<Controls player={player} />)
        expect(screen.getByLabelText('全屏')).toBeDefined()
        act(() => player.store.setState({ isFullscreen: true }))
        expect(screen.getByLabelText('退出全屏')).toBeDefined()
        expect(screen.queryByLabelText('全屏')).toBeNull()
    })

    it('屏幕模式按钮随状态循环并触发 toggleScreenMode', () => {
        const player = createMockPlayer()
        render(<Controls player={player} />)
        // 初始 normal：按钮提示切换宽屏
        fireEvent.click(screen.getByLabelText('切换宽屏'))
        expect(player.toggleScreenMode).toHaveBeenCalledOnce()

        // wide：提示切换小窗
        act(() => player.store.setState({ screenMode: 'wide' }))
        expect(screen.getByLabelText('切换小窗')).toBeDefined()

        // small：提示恢复常规（图标不再复用全屏的 Maximize）
        act(() => player.store.setState({ screenMode: 'small' }))
        expect(screen.getByLabelText('恢复常规')).toBeDefined()
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

    describe('插件控件按 controlKey 过滤', () => {
        it('controlKey=danmu 的控件在 danmu 关闭时隐藏', () => {
            const player = createMockPlayer({ options: { controls: { danmu: false } } } as Partial<PlayerInstance>)
            player.store.setState({
                uiRegistry: {
                    layers: [],
                    controls: [{ id: 'danmu-btn', controlKey: 'danmu', component: <span>弹幕开关</span> }]
                }
            })
            render(<Controls player={player} />)
            expect(screen.queryByText('弹幕开关')).toBeNull()
        })

        it('controlKey=quality 的控件在 quality 关闭时隐藏，无 controlKey 的控件始终显示', () => {
            const player = createMockPlayer({ options: { controls: { quality: false } } } as Partial<PlayerInstance>)
            player.store.setState({
                uiRegistry: {
                    layers: [],
                    controls: [
                        { id: 'quality-menu', controlKey: 'quality', component: <span>画质菜单</span> },
                        { id: 'custom-btn', component: <span>自定义按钮</span> }
                    ]
                }
            })
            render(<Controls player={player} />)
            expect(screen.queryByText('画质菜单')).toBeNull()
            expect(screen.getByText('自定义按钮')).toBeDefined()
        })

        it('controlKey=danmu 的控件在默认配置（全开）下显示', () => {
            const player = createMockPlayer()
            player.store.setState({
                uiRegistry: {
                    layers: [],
                    controls: [{ id: 'danmu-btn', controlKey: 'danmu', component: <span>弹幕开关</span> }]
                }
            })
            render(<Controls player={player} />)
            expect(screen.getByText('弹幕开关')).toBeDefined()
        })
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
