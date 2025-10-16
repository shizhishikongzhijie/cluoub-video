import './ProgressControl.css'

import {Circle} from 'lucide-react'
import React, {useCallback, useEffect, useRef, useState} from 'react'

interface ProgressControlProps {
    progress: number
    duration: number
    showThumbnail: boolean
    thumbnailPosition: { x: number; time: number }
    thumbnailUrl?: string
    thumbnailWidth?: number
    thumbnailHeight?: number
    customIcons?: {
        progressThumbIcon?: React.ReactNode
    }
    onProgressChange: (progress: number, time: number) => void
    onSeek: (time: number) => void
    onShowThumbnail: (show: boolean, position?: { x: number; time: number }) => void
}

const ProgressControl: React.FC<ProgressControlProps> = ({
    progress,
    duration,
    showThumbnail,
    thumbnailPosition,
    thumbnailUrl,
    thumbnailWidth = 120,
    thumbnailHeight = 80,
    customIcons,
    onProgressChange,
    onSeek,
    onShowThumbnail
}) => {
    const progressContainerRef = useRef<HTMLDivElement>(null)
    const progressBufferRef = useRef<HTMLDivElement>(null)
    const progressThumbRef = useRef<HTMLDivElement>(null)
    const thumbnailRef = useRef<HTMLDivElement>(null)
    const isSeeking = useRef(false)
    const [localProgress, setLocalProgress] = useState(progress)

    // 格式化时间
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    }

    // 更新进度条buffer宽度
    const updateProgressBuffer = useCallback(() => {
        if (progressBufferRef.current) {
            progressBufferRef.current.style.width = `${localProgress}%`

            // 在拖拽过程中移除过渡效果，使操作更流畅
            if (isSeeking.current) {
                progressBufferRef.current.style.transition = 'none'
            } else {
                progressBufferRef.current.style.transition = 'width 0.1s'
            }
        }
    }, [localProgress])

    // 更新进度条thumb位置和显示状态
    const updateThumbPosition = useCallback(() => {
        if (progressThumbRef.current && progressContainerRef.current) {
            // 计算thumb应该在的位置（相对于进度条容器）
            const containerWidth = progressContainerRef.current.clientWidth
            const positionX = (containerWidth * localProgress) / 100

            // 应用transform，考虑thumb自身的宽度（-50%保持居中）
            progressThumbRef.current.style.transform = `translate(${positionX}px, -50%)`

            // 在拖拽过程中始终保持thumb显示
            if (isSeeking.current) {
                progressThumbRef.current.style.opacity = '1'
            }

            // 在拖拽过程中移除过渡效果，使操作更流畅
            if (isSeeking.current) {
                progressThumbRef.current.style.transition = 'none'
            } else {
                progressThumbRef.current.style.transition = 'transform 0.1s'
            }
        }
    }, [localProgress])

    // 更新缩略图位置
    const updateThumbnailPosition = useCallback(() => {
        if (thumbnailRef.current && showThumbnail) {
            // 使用transform来定位缩略图
            thumbnailRef.current.style.transform = `translate(${thumbnailPosition.x}px, -30px)`
        }
    }, [showThumbnail, thumbnailPosition.x])

    // 当localProgress变化时更新buffer宽度和thumb位置
    useEffect(() => {
        updateProgressBuffer()
        updateThumbPosition()
    }, [updateProgressBuffer, updateThumbPosition])

    // 当thumbnailPosition变化时更新缩略图位置
    useEffect(() => {
        updateThumbnailPosition()
    }, [updateThumbnailPosition])

    // 当外部progress变化且不在拖拽状态时，更新本地进度
    useEffect(() => {
        if (!isSeeking.current) {
            setLocalProgress(progress)
        }
    }, [progress])

    // 进度条控制移动
    const handleProgressMove = useCallback(
        (e: MouseEvent | TouchEvent) => {
            if (!isSeeking.current || !progressContainerRef.current || !duration) return

            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
            const rect = progressContainerRef.current.getBoundingClientRect()
            const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
            const newTime = position * duration

            // 更新本地进度状态
            setLocalProgress(position * 100)

            // 只更新UI，不实际跳转视频时间
            onProgressChange(position * 100, newTime)

            // 更新缩略图位置
            onShowThumbnail(true, {
                x: clientX - rect.left,
                time: newTime
            })
        },
        [duration, onProgressChange, onShowThumbnail]
    )

    // 进度条控制结束
    const handleProgressEnd = useCallback(() => {
        if (!isSeeking.current || !progressContainerRef.current || !duration) return

        isSeeking.current = false

        // 恢复thumb的默认显示状态（隐藏）
        if (progressThumbRef.current) {
            progressThumbRef.current.style.opacity = '0'
            progressThumbRef.current.style.transition = 'transform 0.1s, opacity 0.3s'
        }

        // 恢复过渡效果
        if (progressBufferRef.current) {
            progressBufferRef.current.style.transition = 'width 0.1s'
        }

        onShowThumbnail(false)

        // 执行实际的视频跳转
        const newTime = (localProgress / 100) * duration
        onSeek(newTime)
    }, [duration, localProgress, onSeek, onShowThumbnail])

    // 添加事件监听器处理拖拽
    useEffect(() => {
        // 只有在开始拖拽时才添加全局事件监听器
        if (!isSeeking.current) return

        const handleMouseMove = (e: MouseEvent | TouchEvent) => {
            handleProgressMove(e)
        }

        const handleMouseUp = () => {
            handleProgressEnd()
        }

        // 添加全局事件监听器，确保即使鼠标移出进度条区域也能正常工作
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('touchmove', handleMouseMove, { passive: false })
        document.addEventListener('mouseup', handleMouseUp)
        document.addEventListener('touchend', handleMouseUp)

        return () => {
            // 清理全局事件监听器
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('touchmove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.removeEventListener('touchend', handleMouseUp)
        }
    }, [isSeeking.current, handleProgressMove, handleProgressEnd]) // 依赖于拖拽状态

    // 进度条控制开始
    const handleProgressStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        isSeeking.current = true

        // 显示thumb并移除过渡效果以确保拖拽流畅
        if (progressThumbRef.current) {
            progressThumbRef.current.style.opacity = '1'
            progressThumbRef.current.style.transition = 'none'
        }

        // 移除buffer过渡效果
        if (progressBufferRef.current) {
            progressBufferRef.current.style.transition = 'none'
        }

        handleProgressMove(e as any)
    }

    // 处理进度条点击直接跳转
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressContainerRef.current || !duration) return

        const rect = progressContainerRef.current.getBoundingClientRect()
        const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        const newTime = position * duration

        onSeek(newTime)
        onProgressChange(position * 100, newTime)
    }

    // 处理进度条鼠标移动事件以显示缩略图和thumb
    const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isSeeking.current) return // 如果正在拖拽，则不处理鼠标移动

        if (!progressContainerRef.current || !duration) return

        const rect = progressContainerRef.current.getBoundingClientRect()
        const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        const time = position * duration

        // 显示thumb
        if (progressThumbRef.current) {
            progressThumbRef.current.style.opacity = '1'
            progressThumbRef.current.style.transition = 'transform 0.1s, opacity 0.3s'
        }

        onShowThumbnail(true, {
            x: e.clientX - rect.left,
            time
        })
    }

    // 处理进度条鼠标离开事件
    const handleProgressMouseLeave = () => {
        if (!isSeeking.current) {
            // 只有在非拖拽状态下才隐藏thumb和缩略图
            // 隐藏thumb
            if (progressThumbRef.current) {
                progressThumbRef.current.style.opacity = '0'
                progressThumbRef.current.style.transition = 'transform 0.1s, opacity 0.3s'
            }

            onShowThumbnail(false)
        }
    }

    return (
        <div
            className="progress-container"
            ref={progressContainerRef}
            onMouseMove={handleProgressMouseMove}
            onMouseLeave={handleProgressMouseLeave}
            onClick={handleProgressClick}
            onMouseDown={handleProgressStart}
            onTouchStart={handleProgressStart}
        >
            <div className="progress-buffer" ref={progressBufferRef} />
            <div className="progress-thumb" ref={progressThumbRef}>
                {customIcons?.progressThumbIcon || <Circle size={12} fill="white" />}
            </div>

            {/* 缩略图预览 */}
            {showThumbnail && thumbnailUrl && (
                <div className="thumbnail-preview" ref={thumbnailRef}>
                    <img src={thumbnailUrl} alt="Thumbnail" width={thumbnailWidth} height={thumbnailHeight} />
                    <div className="thumbnail-time">{formatTime(thumbnailPosition.time)}</div>
                </div>
            )}
        </div>
    )
}

export default ProgressControl
