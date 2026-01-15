import React, {useCallback, useEffect, useRef, useState} from 'react'

import styles from '../styles/progress.module.scss'

interface ProgressProps {
    progress: number // 当前进度 0-100
    buffered?: number // 缓冲进度 0-100
    duration: number // 总时长 (秒)

    // 缩略图配置 (可选)
    thumbnailUrl?: string
    thumbnailWidth?: number
    thumbnailHeight?: number
    // 如果是雪碧图，还需要 cols, rows, interval 等，这里简化处理

    onSeek: (time: number) => void
    onProgressChange?: (percent: number) => void // 拖拽时的回调
}

const Progress: React.FC<ProgressProps> = ({
    progress,
    buffered = 0,
    duration,
    thumbnailUrl,
    thumbnailWidth = 160,
    thumbnailHeight = 90,
    onSeek,
    onProgressChange
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const isSeeking = useRef(false)
    const [localProgress, setLocalProgress] = useState(progress)
    const [hoverProgress, setHoverProgress] = useState(0)
    const [hoverTime, setHoverTime] = useState(0)
    const [isHovering, setIsHovering] = useState(false)

    // 格式化时间 00:00
    const formatTime = (time: number) => {
        console.log('formatTime', time)
        if (!time || isNaN(time)) return '00:00'
        const min = Math.floor(time / 60)
        const sec = Math.floor(time % 60)
        return `${min}:${sec < 10 ? '0' : ''}${sec}`
    }

    // 同步外部进度（非拖拽时）
    useEffect(() => {
        if (!isSeeking.current) setLocalProgress(progress)
    }, [progress])

    // --- 核心计算 ---
    const calculate = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current) return { percent: 0, time: 0, x: 0 }

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as any).clientX
        const rect = containerRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
        const percent = (x / rect.width) * 100
        const time = (percent / 100) * duration

        return { percent, time, x }
    }

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
        const { percent, time } = calculate(e)
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
        [duration]
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
        [duration, onSeek]
    )

    return (
        <div
            className={styles.container}
            ref={containerRef}
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
                {/* 缓冲进度 */}
                <div className={styles.buffered} style={{ width: `${buffered}%` }} />

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
                    {thumbnailUrl && (
                        <div
                            className={styles.thumbnailBox}
                            style={{
                                width: thumbnailWidth,
                                height: thumbnailHeight,
                                backgroundImage: `url(${thumbnailUrl})`
                                // 真实场景这里需要计算 backgroundPosition (雪碧图)
                            }}
                        />
                    )}
                    <div className={styles.timeLabel}>{formatTime(hoverTime)}</div>
                </div>
            )}
        </div>
    )
}

export default Progress
