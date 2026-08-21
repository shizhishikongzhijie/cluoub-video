import { cleanup, render, screen } from '@testing-library/react'
import { useEffect, useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PlayerInstance } from '../core/types'
import type { CluoubVideoProps } from '../types'
import { usePlayer } from './usePlayer'

beforeEach(() => {
    // jsdom 未实现媒体播放，补桩避免 createPlayer 调用 video.play() 抛错
    HTMLMediaElement.prototype.play = vi.fn(() =>
        Promise.resolve()
    ) as unknown as typeof HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.pause = vi.fn() as unknown as typeof HTMLMediaElement.prototype.pause
    HTMLMediaElement.prototype.load = vi.fn() as unknown as typeof HTMLMediaElement.prototype.load
})
afterEach(cleanup)

let capturedPlayer: PlayerInstance | null = null

const Host = ({ props, onPlayer }: { props: CluoubVideoProps; onPlayer?: (p: PlayerInstance) => void }) => {
    const ref = useRef<HTMLDivElement>(null)
    const player = usePlayer(ref, props)
    useEffect(() => {
        if (player) onPlayer?.(player)
    }, [player, onPlayer])
    // 状态文案放在独立子元素中：视频元素被命令式追加到容器，若 host 直接持有文本节点，
    // 状态更新时 React 会通过 textContent 整段覆盖并清掉命令式追加的 <video>
    return (
        <div ref={ref} data-testid="host">
            <span data-testid="status">{player ? 'ready' : 'loading'}</span>
        </div>
    )
}

const renderHost = (props: CluoubVideoProps) => {
    const result = render(<Host props={props} onPlayer={(p) => (capturedPlayer = p)} />)
    return {
        rerender: (next: CluoubVideoProps) =>
            result.rerender(<Host props={next} onPlayer={(p) => (capturedPlayer = p)} />),
        unmount: result.unmount,
        container: result.container,
        videoEl: () => result.container.querySelector('video')!
    }
}

const loadCalls = () => (HTMLMediaElement.prototype.load as ReturnType<typeof vi.fn>).mock.calls.length

describe('usePlayer props 响应性', () => {
    it('挂载后创建播放器并挂载 video，source 变化时切换 src，源不变时不重新加载', () => {
        const { rerender, unmount, videoEl } = renderHost({ source: 'a.mp4' })
        expect(screen.getByTestId('status').textContent).toBe('ready')
        expect(videoEl().getAttribute('src')).toContain('a.mp4')

        const before = loadCalls()
        rerender({ source: 'a.mp4' })
        expect(loadCalls()).toBe(before) // 源未变，不重新加载

        rerender({ source: 'b.mp4' })
        expect(videoEl().getAttribute('src')).toContain('b.mp4')
        expect(loadCalls()).toBe(before + 1)
        unmount()
    })

    it('playlist 变化时加载新条目并触发 onPlaylistChange', () => {
        const onPlaylistChange = vi.fn()
        const playlistA = [{ source: 'p1.mp4' }]
        const { rerender, unmount, videoEl } = renderHost({ source: 'p1.mp4', playlist: playlistA, onPlaylistChange })
        expect(videoEl().getAttribute('src')).toContain('p1.mp4')

        const playlistB = [{ source: 'p2.mp4' }, { source: 'p3.mp4' }]
        rerender({ source: 'p1.mp4', playlist: playlistB, onPlaylistChange })
        expect(videoEl().getAttribute('src')).toContain('p2.mp4')
        expect(capturedPlayer!.store.getState().playlistLength).toBe(2)
        expect(onPlaylistChange).toHaveBeenLastCalledWith({ index: 0, item: playlistB[0] })
        unmount()
    })

    it('plugins 变化时先清理旧插件再安装新插件，onReady 不重复触发', () => {
        const onReady = vi.fn()
        const pluginA = vi.fn((player: PlayerInstance) => {
            player.registerUI('test-a', <span />, 'control')
            return () => player.unregisterUI('test-a')
        })
        const pluginB = vi.fn((player: PlayerInstance) => {
            player.registerUI('test-b', <span />, 'control')
            return () => player.unregisterUI('test-b')
        })

        const { rerender, unmount } = renderHost({ source: 'a.mp4', plugins: [pluginA], onReady })
        expect(onReady).toHaveBeenCalledTimes(1)
        const controlIds = () => capturedPlayer!.store.getState().uiRegistry.controls.map((c) => c.id)
        expect(controlIds()).toContain('test-a')

        rerender({ source: 'a.mp4', plugins: [pluginB], onReady })
        expect(controlIds()).not.toContain('test-a')
        expect(controlIds()).toContain('test-b')
        expect(onReady).toHaveBeenCalledTimes(1) // 不重建实例
        unmount()
    })

    it('toggleScreenMode 循环 normal → wide → small → normal', () => {
        const { unmount } = renderHost({ source: 'a.mp4' })
        expect(capturedPlayer!.store.getState().screenMode).toBe('normal')
        capturedPlayer!.toggleScreenMode()
        expect(capturedPlayer!.store.getState().screenMode).toBe('wide')
        capturedPlayer!.toggleScreenMode()
        expect(capturedPlayer!.store.getState().screenMode).toBe('small')
        capturedPlayer!.toggleScreenMode()
        expect(capturedPlayer!.store.getState().screenMode).toBe('normal')
        unmount()
    })

    it('muted/loop/autoPlay/poster 变化时同步到 video 与 store', () => {
        const { rerender, unmount, videoEl } = renderHost({ source: 'a.mp4' })
        expect(videoEl().muted).toBe(false)
        expect(videoEl().loop).toBe(false)

        rerender({ source: 'a.mp4', muted: true, loop: true, autoPlay: true, poster: 'cover.jpg' })
        expect(videoEl().muted).toBe(true)
        expect(videoEl().loop).toBe(true)
        expect(videoEl().autoplay).toBe(true)
        expect(videoEl().poster).toContain('cover.jpg')
        expect(capturedPlayer!.store.getState().isMuted).toBe(true)
        expect(capturedPlayer!.store.getState().isLoop).toBe(true)
        unmount()
    })
})
