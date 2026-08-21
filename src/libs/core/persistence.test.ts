import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { savePersisted } from '../utils/storage'
import { createPersistence, resolvePersistConfig } from './persistence'
import { createPlayerStore } from './store'

// 最小 fake video：仅含持久化会接触的字段
const createFakeVideo = () =>
    ({
        volume: 1,
        muted: false,
        playbackRate: 1,
        duration: 100,
        currentTime: 0,
        addEventListener: vi.fn()
    }) as unknown as HTMLVideoElement

describe('resolvePersistConfig', () => {
    it('persist=true 开启全部', () => {
        expect(resolvePersistConfig(true)).toEqual({ progress: true, volume: true, playbackRate: true })
    })

    it('persist 对象原样透传', () => {
        expect(resolvePersistConfig({ volume: true })).toEqual({ volume: true })
    })

    it('false / undefined 返回 null', () => {
        expect(resolvePersistConfig(false)).toBeNull()
        expect(resolvePersistConfig(undefined)).toBeNull()
    })
})

describe('createPersistence', () => {
    const src = 'https://example.com/video.mp4'

    beforeEach(() => localStorage.clear())
    afterEach(() => localStorage.clear())

    it('未开启持久化时不恢复也不落盘', () => {
        const video = createFakeVideo()
        const store = createPlayerStore()
        savePersisted(src, { volume: 0.3, playbackRate: 2 })
        const p = createPersistence(video, store, null, () => src)
        expect(video.volume).toBe(1)
        expect(store.getState().volume).toBe(1)
        p.onTimeUpdate(0, 10)
        p.onRateChange(2)
        p.onVolumeChange(0.5, false)
        expect(store.getState().volume).toBe(1)
    })

    it('恢复音量与静音状态', () => {
        const video = createFakeVideo()
        const store = createPlayerStore()
        savePersisted(src, { volume: 0.3 })
        createPersistence(video, store, { volume: true }, () => src)
        expect(video.volume).toBe(0.3)
        expect(video.muted).toBe(false)
        expect(store.getState()).toMatchObject({ volume: 0.3, isMuted: false })
    })

    it('恢复的音量为 0 时静音', () => {
        const video = createFakeVideo()
        const store = createPlayerStore()
        savePersisted(src, { volume: 0 })
        createPersistence(video, store, { volume: true }, () => src)
        expect(video.volume).toBe(0)
        expect(video.muted).toBe(true)
        expect(store.getState()).toMatchObject({ volume: 0, isMuted: true })
    })

    it('恢复倍速', () => {
        const video = createFakeVideo()
        const store = createPlayerStore()
        savePersisted(src, { playbackRate: 2 })
        createPersistence(video, store, { playbackRate: true }, () => src)
        expect(video.playbackRate).toBe(2)
        expect(store.getState().playbackRate).toBe(2)
    })

    it('恢复进度：注册 loadedmetadata 一次性监听器用于续播', () => {
        const video = createFakeVideo()
        const store = createPlayerStore()
        savePersisted(src, { time: 42 })
        createPersistence(video, store, { progress: true }, () => src)
        expect(video.addEventListener).toHaveBeenCalledWith('loadedmetadata', expect.any(Function), { once: true })
    })

    it('onTimeUpdate 每 ~3s 落盘一次进度', () => {
        const video = createFakeVideo()
        const store = createPlayerStore()
        const p = createPersistence(video, store, { progress: true }, () => src)
        p.onTimeUpdate(1000, 10) // 不足 3s 不落盘
        expect(loadTime()).toBeUndefined()
        p.onTimeUpdate(2000, 11)
        expect(loadTime()).toBeUndefined()
        p.onTimeUpdate(5000, 12) // 距上次落盘超 3s 落盘
        expect(loadTime()).toBe(12)
        p.onTimeUpdate(6000, 13) // 不足 3s 不落盘
        expect(loadTime()).toBe(12)
        p.onTimeUpdate(9000, 14) // 距上次落盘 4s 落盘
        expect(loadTime()).toBe(14)

        function loadTime() {
            return JSON.parse(localStorage.getItem(`cluoub-video:${src}`)!)?.time
        }
    })

    it('onRateChange / onVolumeChange 落盘对应字段', () => {
        const video = createFakeVideo()
        const store = createPlayerStore()
        const p = createPersistence(video, store, { volume: true, playbackRate: true }, () => src)
        p.onRateChange(1.5)
        p.onVolumeChange(0.8, false)
        const saved = JSON.parse(localStorage.getItem(`cluoub-video:${src}`)!)
        expect(saved.playbackRate).toBe(1.5)
        expect(saved.volume).toBe(0.8)
    })

    it('静音时音量落盘为 0', () => {
        const video = createFakeVideo()
        const store = createPlayerStore()
        const p = createPersistence(video, store, { volume: true }, () => src)
        p.onVolumeChange(0.8, true)
        const saved = JSON.parse(localStorage.getItem(`cluoub-video:${src}`)!)
        expect(saved.volume).toBe(0)
    })
})
