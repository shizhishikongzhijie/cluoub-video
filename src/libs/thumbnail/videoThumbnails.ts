// 视频抽帧缩略图：隐藏 video 元素 seek 到目标时间后绘制到 canvas，返回 dataURL
// 适合普通 mp4 等可随机 seek 的源；HLS/DASH 需改用雪碧图模式

export const VIDEO_THUMB_WIDTH = 160
export const VIDEO_THUMB_HEIGHT = 90

const SEEK_TIMEOUT = 5000 // seek 超时保护（毫秒）

export interface VideoThumbnailGrabber {
    /** 获取指定时间（秒）的缩略图 dataURL；失败/未就绪返回 null */
    getFrame: (time: number) => Promise<string | null>
    /** 释放隐藏 video 与缓存 */
    dispose: () => void
}

export interface VideoThumbnailGrabberDeps {
    video?: HTMLVideoElement
    canvas?: HTMLCanvasElement
}

export const createVideoThumbnailGrabber = (
    source: string,
    deps: VideoThumbnailGrabberDeps = {}
): VideoThumbnailGrabber => {
    const video = deps.video ?? document.createElement('video')
    const canvas = deps.canvas ?? document.createElement('canvas')
    canvas.width = VIDEO_THUMB_WIDTH
    canvas.height = VIDEO_THUMB_HEIGHT
    const ctx = canvas.getContext('2d')

    // 空源时退化为空实现，避免创建无意义元素
    if (!source) {
        return {
            getFrame: () => Promise.resolve(null),
            dispose: () => {}
        }
    }

    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.style.display = 'none'
    video.src = source

    const cache = new Map<number, string>()
    let disposed = false
    // 单个挂起请求：新请求会取消上一个（避免连续 seek 互相覆盖导致 seeked 不触发）
    let pending: { id: number; resolve: (url: string | null) => void; timer: number } | null = null
    let requestSeq = 0
    // 就绪状态：等待元数据加载完成后才允许 seek
    let ready = false
    let readyWaiters: (() => void)[] = []

    const settlePending = (url: string | null) => {
        if (!pending) return
        const p = pending
        pending = null
        window.clearTimeout(p.timer)
        p.resolve(url)
    }

    const onSeeked = () => {
        if (!pending) return
        try {
            // 元数据未加载 / 解码失败时无可用画面
            if (!video.videoWidth || !video.videoHeight) {
                settlePending(null)
                return
            }
            ctx!.drawImage(video, 0, 0, VIDEO_THUMB_WIDTH, VIDEO_THUMB_HEIGHT)
            const url = canvas.toDataURL('image/jpeg', 0.7)
            cache.set(pendingSeekKey, url)
            settlePending(url)
        } catch {
            // 跨域未授权时 canvas 被污染，toDataURL 抛 SecurityError
            settlePending(null)
        }
    }
    let pendingSeekKey = 0

    const onReadyEvent = () => {
        ready = true
        readyWaiters.forEach((fn) => fn())
        readyWaiters = []
    }
    const onErrorEvent = () => {
        // 源不可用：让等待中的请求以 null 结束
        ready = true
        readyWaiters.forEach((fn) => fn())
        readyWaiters = []
        settlePending(null)
    }

    video.addEventListener('seeked', onSeeked)
    video.addEventListener('loadedmetadata', onReadyEvent)
    video.addEventListener('error', onErrorEvent)

    const whenReady = (): Promise<void> =>
        ready ? Promise.resolve() : new Promise((resolve) => readyWaiters.push(resolve))

    const getFrame = (time: number): Promise<string | null> => {
        if (disposed || !ctx) return Promise.resolve(null)
        const key = Math.max(0, Math.floor(time))
        const cached = cache.get(key)
        if (cached) return Promise.resolve(cached)

        // 取消上一个未完成请求
        settlePending(null)

        // 元数据未就绪时等待后重试（已就绪则同步进入 seek 流程）
        if (!ready) return whenReady().then(() => getFrame(time))

        return new Promise<string | null>((resolve) => {
            if (disposed) {
                resolve(null)
                return
            }
            const id = ++requestSeq
            pendingSeekKey = key
            pending = {
                id,
                resolve,
                timer: window.setTimeout(() => {
                    if (pending?.id === id) {
                        pending = null
                        resolve(null)
                    }
                }, SEEK_TIMEOUT)
            }
            try {
                video.currentTime = key
            } catch {
                if (pending?.id === id) {
                    const { timer } = pending
                    pending = null
                    window.clearTimeout(timer)
                    resolve(null)
                }
            }
        })
    }

    return {
        getFrame,
        dispose: () => {
            disposed = true
            settlePending(null)
            video.removeEventListener('seeked', onSeeked)
            video.removeEventListener('loadedmetadata', onReadyEvent)
            video.removeEventListener('error', onErrorEvent)
            video.pause()
            video.removeAttribute('src')
            video.load()
            video.remove()
            cache.clear()
        }
    }
}
