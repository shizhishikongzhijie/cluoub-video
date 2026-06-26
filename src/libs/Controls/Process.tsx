import React, { useCallback, useEffect, useRef, useState } from 'react'

import styles from '../styles/progress.module.scss'
import { formatTime } from '../utils/time'

interface ThumbnailConfig {
    url: string
    cols: number
    rows: number
    interval: number // 每张缩略图代表的秒数
}

interface ProgressProps {
    progress: number // 当前进度 0-100
    buffered?: number // 缓冲进度 0-100（最后一段末尾，向后兼容）
    bufferedRanges?: { start: number; end: number }[] // 多段缓冲区间
    duration: number // 总时长 (秒)

    // 雪碧图缩略图配置 (可选)
    thumbnail?: ThumbnailConfig

    onSeek: (time: number) => void
    onProgressChange?: (percent: number) => void // 拖拽时的回调
}

const Progress: React.FC<ProgressProps> = ({
    progress,
    buffered = 0,
    bufferedRanges,
    duration,
    thumbnail,
    onSeek,
    onProgressChange
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const isSeeking = useRef(false)
    const [localProgress, setLocalProgress] = useState(progress)
    const [hoverProgress, setHoverProgress] = useState(0)
    const [hoverTime, setHoverTime] = useState(0)
    const [isHovering, setIsHovering] = useState(false)

    // 单张缩略图尺寸（用于预览框与雪碧图偏移计算）
    const THUMB_W = 160
    const THUMB_H = 90

    // 根据 hoverTime 计算雪碧图背景定位
    const getThumbnailStyle = (): React.CSSProperties | undefined => {
        if (!thumbnail) return undefined
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
        },
        [calculate, onProgressChange]
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

            {/* 缩略图 Tooltip */}
            {(isHovering || isSeeking.current) && (
                <div className={styles.tooltip} style={{ left: `${hoverProgress}%` }}>
                    {thumbnail && <div className={styles.thumbnailBox} style={getThumbnailStyle()} />}
                    <div className={styles.timeLabel}>{formatTime(hoverTime)}</div>
                </div>
            )}
        </div>
    )
}

export default Progress
