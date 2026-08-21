import React, { useCallback, useEffect, useRef, useState } from 'react'

import styles from '../styles/progress.module.scss'
import { createVideoThumbnailGrabber, type VideoThumbnailGrabber } from '../thumbnail/videoThumbnails'
import type { ThumbnailConfig } from '../types'
import { formatTime } from '../utils/time'

interface ProgressProps {
    progress: number // 当前进度 0-100
    buffered?: number // 缓冲进度 0-100（最后一段末尾，向后兼容）
    bufferedRanges?: { start: number; end: number }[] // 多段缓冲区间
    duration: number // 总时长 (秒)

    // 缩略图配置 (可选)：sprite 雪碧图 / video 视频抽帧
    thumbnail?: ThumbnailConfig
    /** 当前播放源（video 抽帧模式使用，缺省回退到 thumbnail.source） */
    source?: string

    onSeek: (time: number) => void
    onProgressChange?: (percent: number) => void // 拖拽时的回调
}

// 视频抽帧的节流间隔（毫秒）：seek 网络开销大，避免悬停时高频请求
const VIDEO_THUMB_THROTTLE = 300

const Progress: React.FC<ProgressProps> = ({
    progress,
    buffered = 0,
    bufferedRanges,
    duration,
    thumbnail,
    source,
    onSeek,
    onProgressChange
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const isSeeking = useRef(false)
    const [localProgress, setLocalProgress] = useState(progress)
    const [hoverProgress, setHoverProgress] = useState(0)
    const [hoverTime, setHoverTime] = useState(0)
    const [isHovering, setIsHovering] = useState(false)

    // 视频抽帧模式状态
    const grabberRef = useRef<VideoThumbnailGrabber | null>(null)
    const lastThumbReqRef = useRef(0)
    const [videoThumbUrl, setVideoThumbUrl] = useState<string | null>(null)

    const isVideoThumb = thumbnail?.type === 'video'
    const videoThumbSource = thumbnail?.type === 'video' ? thumbnail.source : undefined

    // 单张缩略图尺寸（用于预览框与雪碧图偏移计算）
    const THUMB_W = 160
    const THUMB_H = 90

    // 根据 hoverTime 计算雪碧图背景定位
    const getThumbnailStyle = (): React.CSSProperties | undefined => {
        if (!thumbnail || thumbnail.type === 'video') return undefined
        const { url, cols, rows, interval } = thumbnail
        const total = cols * rows
        // 当前时间落在第几张
        const index = Math.min(total - 1, Math.max(0, Math.floor(hoverTime / interval)))
        const col = index % cols
        const row = Math.floor(index / cols)
        return {
            width: THUMB_W,
            height: THUMB_H,
            backgroundImage: `url(${url})`,
            backgroundSize: `${cols * THUMB_W}px ${rows * THUMB_H}px`,
            backgroundPosition: `-${col * THUMB_W}px -${row * THUMB_H}px`
        }
    }

    // 同步外部进度（非拖拽时）
    useEffect(() => {
        if (!isSeeking.current) setLocalProgress(progress)
    }, [progress])

    // 视频抽帧 grabber 生命周期：模式/源变化时重建
    useEffect(() => {
        if (!isVideoThumb) {
            grabberRef.current?.dispose()
            grabberRef.current = null
            setVideoThumbUrl(null)
            return
        }
        const src = videoThumbSource ?? source ?? ''
        if (!src) return
        grabberRef.current?.dispose()
        grabberRef.current = createVideoThumbnailGrabber(src)
        setVideoThumbUrl(null)
        return () => {
            grabberRef.current?.dispose()
            grabberRef.current = null
        }
    }, [isVideoThumb, videoThumbSource, source])

    // 节流请求视频抽帧
    const requestVideoThumb = useCallback((time: number) => {
        const grabber = grabberRef.current
        if (!grabber) return
        const now = Date.now()
        if (now - lastThumbReqRef.current < VIDEO_THUMB_THROTTLE) return
        lastThumbReqRef.current = now
        grabber.getFrame(time).then((url) => {
            // 仅当 grabber 未被重建时应用结果，避免串图
            if (grabberRef.current === grabber) setVideoThumbUrl(url)
        })
    }, [])

    // --- 核心计算 ---
    const calculate = useCallback(
        (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
            if (!containerRef.current) return { percent: 0, time: 0, x: 0 }

            const clientX = 'touches' in e ? e.touches[0].clientX : (e as any).clientX
            const rect = containerRef.current.getBoundingClientRect()
            const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
            const percent = (x / rect.width) * 100
            const time = (percent / 100) * duration

            return { percent, time, x }
        },
        [duration]
    )

    // 1. Mouse Move (Hover)
    const handleMouseMove = (e: React.MouseEvent) => {
        const { percent, time } = calculate(e)

        if (isSeeking.current) {
            setLocalProgress(percent)
            onProgressChange?.(percent)
        } else {
            setHoverProgress(percent)
            setHoverTime(time)
        }
        if (isVideoThumb) requestVideoThumb(time)
    }

    // 2. Mouse Down (Start Seek)
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        isSeeking.current = true
        const { percent } = calculate(e)
        setLocalProgress(percent)
        onProgressChange?.(percent)

        document.addEventListener('mousemove', handleGlobalMove)
        document.addEventListener('touchmove', handleGlobalMove)
        document.addEventListener('mouseup', handleGlobalUp)
        document.addEventListener('touchend', handleGlobalUp)
    }

    // 3. Global Move
    const handleGlobalMove = useCallback(
        (e: MouseEvent | TouchEvent) => {
            if (!isSeeking.current) return
            const { percent, time } = calculate(e)
            setLocalProgress(percent)
            onProgressChange?.(percent)
            // 拖拽时也要更新 hover time
            setHoverTime(time)
            setHoverProgress(percent)
            if (isVideoThumb) requestVideoThumb(time)
        },
        [calculate, onProgressChange, isVideoThumb, requestVideoThumb]
    )

    // 4. Global Up (End Seek)
    const handleGlobalUp = useCallback(
        (e: MouseEvent | TouchEvent) => {
            if (!isSeeking.current) return
            isSeeking.current = false

            const { time } = calculate(e)
            onSeek(time)

            document.removeEventListener('mousemove', handleGlobalMove)
            document.removeEventListener('touchmove', handleGlobalMove)
            document.removeEventListener('mouseup', handleGlobalUp)
            document.removeEventListener('touchend', handleGlobalUp)
        },
        [calculate, onSeek, handleGlobalMove]
    )

    // 键盘操作：左右方向键 ±5s，Home/End 跳转首尾
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (duration <= 0) return
        const current = (localProgress / 100) * duration
        let next: number | null = null
        switch (e.key) {
            case 'ArrowRight':
                next = Math.min(duration, current + 5)
                break
            case 'ArrowLeft':
                next = Math.max(0, current - 5)
                break
            case 'Home':
                next = 0
                break
            case 'End':
                next = duration
                break
            default:
                return
        }
        e.preventDefault()
        setLocalProgress((next / duration) * 100)
        onSeek(next)
    }

    const currentTime = (localProgress / 100) * duration

    // 缩略图浮窗视口内钳位：左边缘限制在容器内，并让三角箭头始终指向悬停位置
    const containerW = containerRef.current?.getBoundingClientRect().width ?? 0
    const hoverX = containerW > 0 ? (hoverProgress / 100) * containerW : 0
    // 浮窗宽度估算：有缩略图时按图片宽+内边距，否则按时间标签估算
    const tooltipHalf = (thumbnail ? THUMB_W + 14 : 60) / 2
    const clampedX =
        containerW > 0
            ? Math.min(Math.max(hoverX, tooltipHalf), Math.max(containerW - tooltipHalf, tooltipHalf))
            : hoverX
    const tooltipLeft = clampedX - tooltipHalf
    // 三角箭头：水平钳位在浮窗「底部平直区」内（避开圆角），避免箭头与圆角间出现缝隙
    const ARROW_HALF = 5 // 箭头半宽
    const CORNER_RADIUS = 8 // 浮窗圆角
    const tooltipW = thumbnail ? THUMB_W + 14 : 84 // 浮窗宽度估算
    const arrowSafeMin = CORNER_RADIUS + ARROW_HALF
    const tooltipArrowLeft = Math.min(
        Math.max(hoverX - tooltipLeft, arrowSafeMin),
        Math.max(tooltipW - arrowSafeMin, arrowSafeMin)
    )

    return (
        <div
            className={styles.container}
            ref={containerRef}
            role="slider"
            tabIndex={0}
            aria-label="进度条"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(currentTime)}
            aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
            onKeyDown={handleKeyDown}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
                setIsHovering(false)
                if (!isSeeking.current) setHoverProgress(0)
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
        >
            <div className={styles.track}>
                {/* 缓冲进度：有多段区间时分段渲染，否则回退到单段 */}
                {bufferedRanges && bufferedRanges.length > 0 ? (
                    bufferedRanges.map((r, i) => (
                        <div
                            key={i}
                            className={styles.buffered}
                            style={{ left: `${r.start}%`, width: `${Math.max(0, r.end - r.start)}%` }}
                        />
                    ))
                ) : (
                    <div className={styles.buffered} style={{ width: `${buffered}%` }} />
                )}

                {/* 幽灵进度 (Hover) */}
                <div
                    className={styles.hoverTrack}
                    style={{
                        width: `${hoverProgress}%`,
                        opacity: isHovering && !isSeeking.current ? 1 : 0
                    }}
                />

                {/* 当前播放进度 */}
                <div className={styles.played} style={{ width: `${localProgress}%` }}>
                    <div className={styles.thumb} />
                </div>
            </div>

            {/* 缩略图 Tooltip（浮窗位置与三角箭头均在视口内计算） */}
            {(isHovering || isSeeking.current) && (
                <div className={styles.tooltip} style={{ left: tooltipLeft }}>
                    {thumbnail &&
                        (isVideoThumb ? (
                            videoThumbUrl && <img className={styles.thumbnailImg} src={videoThumbUrl} alt="" />
                        ) : (
                            <div className={styles.thumbnailBox} style={getThumbnailStyle()} />
                        ))}
                    <div className={styles.timeLabel}>{formatTime(hoverTime)}</div>
                    <div className={styles.tooltipArrow} style={{ left: tooltipArrowLeft }} />
                </div>
            )}
        </div>
    )
}

export default Progress
