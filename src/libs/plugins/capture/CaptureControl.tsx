import { Camera, Film } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'

import type { PlayerInstance } from '../../core/types'
import { captureContainerComposite } from '../../utils/captureContainer'
import { encodeGif, type GifFrame } from './gif'
import styles from './styles.module.scss'

export interface CaptureConfig {
    /** 是否启用截图按钮（默认 true） */
    screenshot?: boolean
    /** 是否启用 GIF 录制按钮（默认 true） */
    gif?: boolean
    /** GIF 帧率（默认 10） */
    gifFps?: number
    /** GIF 录制时长（秒，默认 3） */
    gifDuration?: number
    /** 下载文件名前缀（默认 cluoub-<时间戳>） */
    filename?: string
    /** GIF 编码完成回调（url 为临时 objectURL） */
    onGifReady?: (url: string) => void
}

const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
}

const fileBase = (config: CaptureConfig) => config.filename ?? `cluoub-${Date.now()}`

/** 定位播放器容器（video 在 ASS 模式下会被 libjass 包裹，需向祖先找挂载容器） */
const findContainer = (player: PlayerInstance): HTMLElement | null => {
    const video = player.video
    const container = video.parentElement?.closest('[class*="videoContainer"]')
    return (container as HTMLElement | null) ?? video.parentElement
}

export const CaptureControl = ({ player, config }: { player: PlayerInstance; config: CaptureConfig }) => {
    const isPlaying = useStore(player.store, (s) => s.isPlaying)
    const [isRecording, setIsRecording] = useState(false)
    const timerRef = useRef<number | null>(null)
    const framesRef = useRef<GifFrame[]>([])
    const busyRef = useRef(false)

    useEffect(
        () => () => {
            if (timerRef.current !== null) window.clearInterval(timerRef.current)
        },
        []
    )

    const onScreenshot = async () => {
        // 合成截图：视频帧 + 弹幕 canvas + 字幕文本（canvas 图层合成，工具栏不会入画）
        const url = await player.captureComposite({ type: 'image/png' })
        if (!url) return
        triggerDownload(url, `${fileBase(config)}.png`)
    }

    const stopRecording = () => {
        if (timerRef.current !== null) window.clearInterval(timerRef.current)
        timerRef.current = null
        setIsRecording(false)
        const frames = framesRef.current
        framesRef.current = []
        if (frames.length < 2) return
        try {
            const bytes = encodeGif(frames, config.gifFps ?? 10)
            const url = URL.createObjectURL(new Blob([bytes], { type: 'image/gif' }))
            triggerDownload(url, `${fileBase(config)}.gif`)
            window.setTimeout(() => URL.revokeObjectURL(url), 1000)
            config.onGifReady?.(url)
        } catch (e) {
            console.error('GIF encode failed', e)
        }
    }

    // 采集一帧合成画面（视频帧 + 弹幕 canvas + 字幕文本），串行防重叠
    const captureGifFrame = async () => {
        if (busyRef.current) return
        busyRef.current = true
        try {
            const container = findContainer(player)
            const canvas = captureContainerComposite(container, player.video, {
                captureLayers: [...player.captureLayers]
            })
            if (canvas) {
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                    framesRef.current.push({
                        data: new Uint8Array(imageData.data),
                        width: imageData.width,
                        height: imageData.height
                    })
                }
            }
        } catch (e) {
            // 跨域视频未授权时 canvas 会被污染，getImageData 抛 SecurityError，停止录制
            console.error('GIF frame capture failed (可能为跨域未授权)', e)
            stopRecording()
        } finally {
            busyRef.current = false
        }
    }

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording()
            return
        }
        const video = player.video
        if (!video.videoWidth || !video.videoHeight) return
        const fps = config.gifFps ?? 10
        const maxFrames = fps * (config.gifDuration ?? 3)
        framesRef.current = []
        setIsRecording(true)
        timerRef.current = window.setInterval(() => {
            if (framesRef.current.length >= maxFrames) {
                stopRecording()
                return
            }
            captureGifFrame()
        }, 1000 / fps)
    }

    return (
        <div className={styles.captureToolbar}>
            {config.screenshot !== false && (
                <button className={styles.toolbarBtn} onClick={onScreenshot} aria-label="截图" title="截图">
                    <Camera />
                </button>
            )}
            {config.gif !== false && (
                <button
                    className={`${styles.toolbarBtn} ${isRecording ? styles.recording : ''}`}
                    onClick={toggleRecording}
                    aria-label={isRecording ? '结束 GIF 录制' : '录制 GIF'}
                    title={isRecording ? '结束 GIF 录制' : '录制 GIF'}
                    disabled={!isPlaying}
                >
                    <Film />
                </button>
            )}
        </div>
    )
}
