import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveSource } from '../utils/source'
import { createPlayer } from './createPlayer'
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

describe('resolveSource', () => {
    it('解析字符串、对象和多源数组', () => {
        expect(resolveSource('video.mp4')).toBe('video.mp4')
        expect(resolveSource({ src: 'movie.mp4', type: 'mp4' })).toBe('movie.mp4')
        expect(resolveSource([{ src: '1080p.mp4' }, { src: '720p.mp4' }])).toBe('1080p.mp4')
        expect(resolveSource([])).toBe('')
    })
})

describe('createPlayer 生命周期', () => {
    it('挂载、onReady 和 destroy 都是幂等的', () => {
        const onReady = vi.fn()
        const player = makePlayer({ source: 'video.mp4', onReady })
        const container = document.createElement('div')
        player.mount(container)
        player.mount(container)
        expect(container.querySelectorAll('video')).toHaveLength(1)
        expect(onReady).toHaveBeenCalledOnce()
        player.destroy()
        player.destroy()
        expect(container.querySelector('video')).toBeNull()
    })

    it('MP4 多画质切换保留时间、播放状态、音量和倍速', () => {
        const onQualityChange = vi.fn()
        const player = makePlayer({
            source: [
                { src: '1080.mp4', quality: '1080P' },
                { src: '720.mp4', quality: '720P' }
            ],
            onQualityChange
        })
        Object.defineProperty(player.video, 'paused', { configurable: true, value: false })
        Object.defineProperty(player.video, 'duration', { configurable: true, value: 120 })
        player.video.currentTime = 37
        player.video.volume = 0.4
        player.video.playbackRate = 1.5

        player.selectQuality('1')
        expect(player.video.getAttribute('src')).toContain('720.mp4')
        expect(player.video.volume).toBe(0.4)
        expect(player.video.playbackRate).toBe(1.5)
        player.video.dispatchEvent(new Event('loadedmetadata'))
        expect(player.video.currentTime).toBe(37)
        expect(HTMLMediaElement.prototype.play).toHaveBeenCalled()
        expect(player.store.getState()).toMatchObject({ quality: '1', activeQuality: '1' })
        expect(onQualityChange).toHaveBeenCalledWith({ mode: '1', activeKey: '1', label: '720P' })
    })

    it('回调与 autoNext 使用 updateOptions 后的最新值', () => {
        const stalePlay = vi.fn()
        const currentPlay = vi.fn()
        const onPlaylistChange = vi.fn()
        const player = makePlayer({
            source: 'first.mp4',
            playlist: [{ source: 'first.mp4' }, { source: 'second.mp4' }],
            autoNext: false,
            onPlay: stalePlay,
            onPlaylistChange
        })
        player.updateOptions({ autoNext: true, onPlay: currentPlay })
        player.video.dispatchEvent(new Event('play'))
        player.video.dispatchEvent(new Event('ended'))
        expect(stalePlay).not.toHaveBeenCalled()
        expect(currentPlay).toHaveBeenCalledOnce()
        expect(player.video.getAttribute('src')).toContain('second.mp4')
        expect(onPlaylistChange).toHaveBeenCalledWith({ index: 1, item: { source: 'second.mp4' } })
    })

    it('同一首源的多画质配置更新会刷新档位而不重新 load', () => {
        const player = makePlayer({ source: [{ src: 'video.mp4', quality: '原画' }] })
        const before = (HTMLMediaElement.prototype.load as ReturnType<typeof vi.fn>).mock.calls.length
        player.updateSource([
            { src: 'video.mp4', quality: '1080P' },
            { src: '720.mp4', quality: '720P' }
        ])
        expect(player.store.getState().qualities.map((quality) => quality.label)).toEqual(['1080P', '720P'])
        expect(HTMLMediaElement.prototype.load).toHaveBeenCalledTimes(before)
    })
})
