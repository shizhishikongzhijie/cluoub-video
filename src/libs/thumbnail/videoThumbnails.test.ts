import { afterEach, describe, expect, it, vi } from 'vitest'

import { createVideoThumbnailGrabber, VIDEO_THUMB_HEIGHT, VIDEO_THUMB_WIDTH } from './videoThumbnails'

// 构造可注入的 fake video/canvas：jsdom 中 HTMLMediaElement 事件派发可用，
// canvas 2d 无实现需打桩，currentTime 赋值会抛错需覆写为可写属性
const setupHarness = () => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const drawImage = vi.fn()
    const toDataURL = vi.fn(() => 'data:image/jpeg;base64,ZmFrZQ==')
    const ctx = { drawImage, toDataURL }
    canvas.getContext = vi.fn(() => ctx) as unknown as HTMLCanvasElement['getContext']
    // jsdom 无 canvas 2d 实现，toDataURL 也会抛错，实例级覆写为 mock
    canvas.toDataURL = toDataURL as unknown as HTMLCanvasElement['toDataURL']

    // jsdom 中 videoWidth/videoHeight 为只读 getter，覆写以模拟已解码画面
    Object.defineProperty(video, 'videoWidth', { value: 1280, configurable: true })
    Object.defineProperty(video, 'videoHeight', { value: 720, configurable: true })
    let soughtTime = 0
    Object.defineProperty(video, 'currentTime', {
        get: () => soughtTime,
        set: (v: number) => {
            soughtTime = v
        },
        configurable: true
    })

    return { video, canvas, drawImage, toDataURL }
}

describe('createVideoThumbnailGrabber', () => {
    afterEach(() => {
        document.querySelectorAll('video').forEach((v) => v.remove())
    })

    it('空源退化为空实现，不创建视频元素', async () => {
        const grabber = createVideoThumbnailGrabber('')
        await expect(grabber.getFrame(10)).resolves.toBeNull()
        expect(document.querySelectorAll('video').length).toBe(0)
        grabber.dispose()
    })

    it('元数据就绪后 seek 到目标时间并返回 dataURL', async () => {
        const { video, canvas, drawImage } = setupHarness()
        const grabber = createVideoThumbnailGrabber('demo.mp4', { video, canvas })
        video.dispatchEvent(new Event('loadedmetadata'))

        const promise = grabber.getFrame(42)
        video.dispatchEvent(new Event('seeked'))
        await expect(promise).resolves.toBe('data:image/jpeg;base64,ZmFrZQ==')

        expect(video.src).toContain('demo.mp4')
        expect(video.muted).toBe(true)
        expect(drawImage).toHaveBeenCalledWith(video, 0, 0, VIDEO_THUMB_WIDTH, VIDEO_THUMB_HEIGHT)
        grabber.dispose()
    })

    it('相同时间命中缓存，不重复 seek', async () => {
        const { video, canvas, drawImage } = setupHarness()
        const grabber = createVideoThumbnailGrabber('demo.mp4', { video, canvas })
        video.dispatchEvent(new Event('loadedmetadata'))

        const first = grabber.getFrame(42)
        video.dispatchEvent(new Event('seeked'))
        await first

        const second = grabber.getFrame(42.9) // 向下取整命中同一缓存
        await expect(second).resolves.toBe('data:image/jpeg;base64,ZmFrZQ==')
        expect(drawImage).toHaveBeenCalledTimes(1)
        grabber.dispose()
    })

    it('并发请求会取消上一个（前一个 resolve null）', async () => {
        const { video, canvas, drawImage } = setupHarness()
        const grabber = createVideoThumbnailGrabber('demo.mp4', { video, canvas })
        video.dispatchEvent(new Event('loadedmetadata'))

        const first = grabber.getFrame(10)
        const second = grabber.getFrame(20)
        await expect(first).resolves.toBeNull()
        // 最后一次 seek 完成后，第二帧绘制一次
        video.dispatchEvent(new Event('seeked'))
        await expect(second).resolves.toBe('data:image/jpeg;base64,ZmFrZQ==')
        expect(drawImage).toHaveBeenCalledTimes(1)
        grabber.dispose()
    })

    it('seek 超时返回 null', async () => {
        vi.useFakeTimers()
        const { video, canvas } = setupHarness()
        const grabber = createVideoThumbnailGrabber('demo.mp4', { video, canvas })
        video.dispatchEvent(new Event('loadedmetadata'))

        const promise = grabber.getFrame(42)
        await vi.advanceTimersByTimeAsync(6000)
        await expect(promise).resolves.toBeNull()
        grabber.dispose()
        vi.useRealTimers()
    })

    it('dispose 后请求返回 null 且清理视频元素', async () => {
        const { video, canvas } = setupHarness()
        const grabber = createVideoThumbnailGrabber('demo.mp4', { video, canvas })
        grabber.dispose()
        await expect(grabber.getFrame(10)).resolves.toBeNull()
        expect(document.querySelectorAll('video').length).toBe(0)
    })
})
