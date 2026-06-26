import { useEffect, useRef, useState } from 'react'

import type { PlayerInstance } from '../core/types'

export interface GestureFeedback {
    type: 'seek' | 'volume'
    text: string
    // volume 进度 0-1，用于绘制进度提示；seek 不使用
    progress?: number
}

const HORIZONTAL_THRESHOLD = 10 // 判定为横向拖动的最小位移(px)
const VERTICAL_THRESHOLD = 10 // 判定为纵向拖动的最小位移(px)
const SEEK_PER_PX = 0.15 // 每像素横向位移对应的秒数
const VOLUME_PER_PX = 1 / 200 // 每像素纵向位移对应的音量变化
const DOUBLE_TAP_DELAY = 300 // 双击判定窗口(ms)
const DOUBLE_TAP_SEEK = 10 // 双击两侧快进/退秒数

type Direction = 'none' | 'horizontal' | 'vertical'

/**
 * 移动端触摸手势。
 * - 横向滑动：拖动进度（松手后 seek）
 * - 纵向滑动：调整音量
 * - 双击屏幕左/右侧：快退 / 快进 10s
 *
 * 返回 feedback 供 UI 层渲染浮层提示。
 */
export const useTouchGestures = (containerRef: React.RefObject<HTMLElement | null>, player: PlayerInstance | null) => {
    const [feedback, setFeedback] = useState<GestureFeedback | null>(null)
    // 用 ref 持有定时器与手势上下文，避免重渲染
    const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 })

    useEffect(() => {
        const el = containerRef.current
        if (!el || !player) return

        let startX = 0
        let startY = 0
        let startTime = 0 // 手势开始时的播放时间
        let startVolume = 1
        let direction: Direction = 'none'
        let pendingSeek: number | null = null
        let isGesture = false // 是否已进入滑动手势（用于区分点击）

        const showFeedback = (fb: GestureFeedback) => {
            setFeedback(fb)
            if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
            feedbackTimer.current = setTimeout(() => setFeedback(null), 600)
        }

        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length !== 1) return
            const t = e.touches[0]
            startX = t.clientX
            startY = t.clientY
            direction = 'none'
            pendingSeek = null
            isGesture = false
            const s = player.store.getState()
            startTime = s.currentTime
            startVolume = s.isMuted ? 0 : s.volume
        }

        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length !== 1) return
            const t = e.touches[0]
            const dx = t.clientX - startX
            const dy = t.clientY - startY

            // 首次确定主方向
            if (direction === 'none') {
                if (Math.abs(dx) > HORIZONTAL_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
                    direction = 'horizontal'
                    isGesture = true
                } else if (Math.abs(dy) > VERTICAL_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
                    direction = 'vertical'
                    isGesture = true
                } else {
                    return
                }
            }

            e.preventDefault()
            const { duration } = player.store.getState()

            if (direction === 'horizontal') {
                const target = Math.max(0, Math.min(duration || 0, startTime + dx * SEEK_PER_PX))
                pendingSeek = target
                const delta = target - startTime
                const sign = delta >= 0 ? '+' : '-'
                showFeedback({ type: 'seek', text: `${sign}${Math.abs(Math.round(delta))}s` })
            } else if (direction === 'vertical') {
                // 上滑增大音量（dy 为负）
                const next = Math.max(0, Math.min(1, startVolume - dy * VOLUME_PER_PX))
                player.setVolume(next)
                showFeedback({ type: 'volume', text: `音量 ${Math.round(next * 100)}%`, progress: next })
            }
        }

        const onTouchEnd = () => {
            if (direction === 'horizontal' && pendingSeek != null) {
                player.seek(pendingSeek)
            }

            // 双击检测（仅当未进入滑动手势时）
            if (!isGesture) {
                const now = Date.now()
                const last = lastTapRef.current
                const rect = el.getBoundingClientRect()
                const isLeft = startX - rect.left < rect.width / 2
                if (now - last.time < DOUBLE_TAP_DELAY) {
                    const { currentTime, duration } = player.store.getState()
                    if (isLeft) {
                        const target = Math.max(0, currentTime - DOUBLE_TAP_SEEK)
                        player.seek(target)
                        showFeedback({ type: 'seek', text: `-${DOUBLE_TAP_SEEK}s` })
                    } else {
                        const target = Math.min(duration || 0, currentTime + DOUBLE_TAP_SEEK)
                        player.seek(target)
                        showFeedback({ type: 'seek', text: `+${DOUBLE_TAP_SEEK}s` })
                    }
                    lastTapRef.current = { time: 0, x: 0 }
                } else {
                    lastTapRef.current = { time: now, x: startX }
                }
            }

            direction = 'none'
            pendingSeek = null
        }

        // passive:false 以便 horizontal/vertical 手势可 preventDefault 阻止页面滚动
        el.addEventListener('touchstart', onTouchStart, { passive: true })
        el.addEventListener('touchmove', onTouchMove, { passive: false })
        el.addEventListener('touchend', onTouchEnd)

        return () => {
            el.removeEventListener('touchstart', onTouchStart)
            el.removeEventListener('touchmove', onTouchMove)
            el.removeEventListener('touchend', onTouchEnd)
            if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
        }
    }, [containerRef, player])

    return { feedback }
}
