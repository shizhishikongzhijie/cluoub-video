import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from 'zustand'

import type { PlayerInstance } from '../../core/types'
import { type ActiveDanmu, allocateTrack, type DanmuItem, estimateWidth } from './engine'
import styles from './styles.module.scss'

const TRACK_HEIGHT = 28 // 每条弹道高度（px）
const SCROLL_DURATION = 8000 // 滚动弹幕穿越舞台时长（ms）
const FIXED_DURATION = 4000 // 顶部/底部固定弹幕停留时长（ms）
const FONT_SIZE = 20

export const DanmuLayer = ({ player, data }: { player: PlayerInstance; data: DanmuItem[] }) => {
    const isVisible = useStore(player.store, (s) => s.isDanmuVisible)
    const currentTime = useStore(player.store, (s) => s.currentTime)
    const isPlaying = useStore(player.store, (s) => s.isPlaying)

    const stageRef = useRef<HTMLDivElement>(null)
    const [active, setActive] = useState<ActiveDanmu[]>([])
    const [stageWidth, setStageWidth] = useState(0)

    // 已发射的弹幕游标（按时间升序），避免重复发射
    const cursorRef = useRef(0)
    const idRef = useRef(0)

    // 按时间排序的弹幕源
    const sorted = useMemo(() => [...data].sort((a, b) => a.time - b.time), [data])

    // currentTime 回退（seek 向前跳）时重置游标
    const lastTimeRef = useRef(0)
    useEffect(() => {
        if (currentTime < lastTimeRef.current - 0.3) {
            // 发生了后退 seek，重新定位游标
            cursorRef.current = sorted.findIndex((d) => d.time >= currentTime)
            if (cursorRef.current < 0) cursorRef.current = sorted.length
            setActive([])
        }
        lastTimeRef.current = currentTime
    }, [currentTime, sorted])

    // 根据 currentTime 发射到点的弹幕
    useEffect(() => {
        if (!isVisible) return
        const stage = stageRef.current
        if (!stage) return

        const stageWidth = stage.clientWidth
        const trackCount = Math.max(1, Math.floor(stage.clientHeight / TRACK_HEIGHT))
        const now = performance.now()
        const emitted: ActiveDanmu[] = []
        setStageWidth(stageWidth)

        while (cursorRef.current < sorted.length && sorted[cursorRef.current].time <= currentTime) {
            const item = sorted[cursorRef.current]
            cursorRef.current++

            const width = estimateWidth(item.text, FONT_SIZE)
            const mode = item.mode ?? 'scroll'
            let track = 0
            if (mode === 'scroll') {
                track = allocateTrack(
                    [...active, ...emitted],
                    { trackCount, stageWidth, duration: SCROLL_DURATION, now },
                    width
                )
                if (track < 0) continue // 无安全弹道，丢弃以防重叠
            } else {
                // 顶部/底部：简单轮流取靠边弹道
                const used = [...active, ...emitted].filter((d) => d.mode === mode).map((d) => d.track)
                track = 0
                while (used.includes(track) && track < trackCount) track++
                if (track >= trackCount) continue
            }

            emitted.push({ ...item, mode, id: idRef.current++, track, enterAt: now, width })
        }

        if (emitted.length) setActive((prev) => [...prev, ...emitted])
    }, [currentTime, isVisible, sorted, active])

    // 周期清理已离开舞台的弹幕
    useEffect(() => {
        if (!isPlaying) return
        const timer = setInterval(() => {
            const now = performance.now()
            setActive((prev) =>
                prev.filter((d) => {
                    const life = d.mode === 'scroll' ? SCROLL_DURATION : FIXED_DURATION
                    return now - d.enterAt < life
                })
            )
        }, 1000)
        return () => clearInterval(timer)
    }, [isPlaying])

    if (!isVisible) return null

    return (
        <div ref={stageRef} className={styles.danmuStage}>
            {active.map((d) => {
                const top = d.mode === 'bottom' ? undefined : d.track * TRACK_HEIGHT
                const bottom = d.mode === 'bottom' ? d.track * TRACK_HEIGHT : undefined
                const className =
                    d.mode === 'scroll' ? `${styles.danmu} ${styles.scroll}` : `${styles.danmu} ${styles.fixed}`
                const style: React.CSSProperties = {
                    top,
                    bottom,
                    color: d.color || '#fff',
                    fontSize: FONT_SIZE,
                    // 滚动动画时长 / 暂停时冻结动画
                    animationDuration: d.mode === 'scroll' ? `${SCROLL_DURATION}ms` : `${FIXED_DURATION}ms`,
                    animationPlayState: isPlaying ? 'running' : 'paused',
                    // 滚动起点 = 舞台宽度（让动画行程与碰撞检测的 stageWidth 一致）
                    ...(d.mode === 'scroll' && stageWidth
                        ? ({ '--stage-w': `${stageWidth}px` } as React.CSSProperties)
                        : {})
                }
                return (
                    <span key={d.id} className={className} style={style}>
                        {d.text}
                    </span>
                )
            })}
        </div>
    )
}
