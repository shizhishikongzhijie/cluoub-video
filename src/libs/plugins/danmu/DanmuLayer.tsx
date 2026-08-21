import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useStore } from 'zustand'

import type { PlayerInstance, SendDanmuOptions } from '../../core/types'
import { type ActiveDanmu, allocateTrack, cursorForTime, type DanmuItem, estimateWidth } from './engine'
import { drawDanmu, FIXED_DURATION, FONT_FAMILY, FONT_SIZE, SCROLL_DURATION, TRACK_HEIGHT } from './render'
import styles from './styles.module.scss'

/**
 * 虚拟时钟：累计「播放中」的流逝时间。
 * 暂停/恢复时冻结/续走，保证弹幕位置（基于 enterAt 的相对时间）不随真实时间漂移。
 */
interface VirtualClock {
    acc: number
    last: number
    running: boolean
}

export const DanmuLayer = ({ player, data }: { player: PlayerInstance; data: DanmuItem[] }) => {
    const isVisible = useStore(player.store, (s) => s.isDanmuVisible)
    const isPlaying = useStore(player.store, (s) => s.isPlaying)
    const currentTime = useStore(player.store, (s) => s.currentTime)

    const stageRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
    const activeRef = useRef<ActiveDanmu[]>([])
    const cursorRef = useRef(0)
    const idRef = useRef(0)
    const lastTimeRef = useRef(0)
    const clockRef = useRef<VirtualClock>({ acc: 0, last: 0, running: false })
    const sizeRef = useRef({ w: 0, h: 0 })
    const dprRef = useRef(1)

    const sorted = useMemo(() => [...data].sort((a, b) => a.time - b.time), [data])

    // 虚拟时钟前进：随 isPlaying 启停累计播放时间
    useEffect(() => {
        const clock = clockRef.current
        const now = performance.now()
        if (isPlaying) {
            clock.last = now
            clock.running = true
        } else {
            if (clock.running) clock.acc += now - clock.last
            clock.running = false
        }
    }, [isPlaying])

    /** 当前虚拟时间戳（暂停时冻结） */
    const vtNow = useCallback(
        () =>
            clockRef.current.running
                ? clockRef.current.acc + performance.now() - clockRef.current.last
                : clockRef.current.acc,
        []
    )

    // 注册捕获层：合成截图时按容器坐标叠加本 canvas（隐藏时注销）
    useEffect(() => {
        if (!isVisible) return
        player.registerCaptureLayer('danmu', () => canvasRef.current)
        return () => player.unregisterCaptureLayer('danmu')
    }, [isVisible, player])

    // canvas 尺寸与分辨率：跟随舞台（70% 高度区域），按 devicePixelRatio 高清渲染
    useEffect(() => {
        if (!isVisible) return
        const stage = stageRef.current
        const canvas = canvasRef.current
        if (!stage || !canvas) return
        const measure = () => {
            const w = stage.clientWidth
            const h = stage.clientHeight
            if (!w || !h) return
            const dpr = Math.min(2, window.devicePixelRatio || 1)
            dprRef.current = dpr
            canvas.width = Math.round(w * dpr)
            canvas.height = Math.round(h * dpr)
            sizeRef.current = { w, h }
            const ctx = canvas.getContext('2d')
            ctxRef.current = ctx
            if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
        measure()
        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(measure)
            ro.observe(stage)
            return () => ro.disconnect()
        }
        return undefined
    }, [isVisible])

    /** 弹幕文本宽度：优先用 canvas measureText，无 2d ctx（如 jsdom）时回退估算 */
    const measureWidth = useCallback((text: string) => {
        const ctx = ctxRef.current
        if (ctx) {
            ctx.font = `600 ${FONT_SIZE}px ${FONT_FAMILY}`
            return Math.ceil(ctx.measureText(text).width)
        }
        return estimateWidth(text, FONT_SIZE)
    }, [])

    // 根据 currentTime 发射到点的弹幕；seek 回退时重置游标与活动列表
    useEffect(() => {
        if (!isVisible) return
        const stage = stageRef.current
        if (!stage) return

        const stageWidth = stage.clientWidth
        const trackCount = Math.max(1, Math.floor(stage.clientHeight / TRACK_HEIGHT))

        if (currentTime < lastTimeRef.current - 0.3) {
            // 发生了后退 seek，重新定位游标（前跳由 video seeking 事件处理）
            cursorRef.current = cursorForTime(sorted, currentTime)
            activeRef.current = []
        }
        lastTimeRef.current = currentTime

        const active = activeRef.current
        const now = vtNow()
        const emitted: ActiveDanmu[] = []
        while (cursorRef.current < sorted.length && sorted[cursorRef.current].time <= currentTime) {
            const item = sorted[cursorRef.current]
            cursorRef.current++

            const width = measureWidth(item.text)
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

        if (emitted.length) activeRef.current = [...active, ...emitted]
    }, [currentTime, isVisible, measureWidth, sorted, vtNow])

    // 进度条拖动 / seek：监听 video 的 seeking 事件，清空活动弹幕并从新位置重新发射
    // （前跳/后跳都处理：跳过期弹幕，后续只发射 time >= 新进度的弹幕）
    useEffect(() => {
        const v = player.video
        if (!v || typeof v.addEventListener !== 'function') return
        const onSeeking = () => {
            const t = player.store.getState().currentTime
            activeRef.current = []
            cursorRef.current = cursorForTime(sorted, t)
            lastTimeRef.current = t
        }
        v.addEventListener('seeking', onSeeking)
        return () => v.removeEventListener('seeking', onSeeking)
    }, [player, sorted])

    // 外部发送：订阅 player 事件总线上的 danmu-send（player.danmu.send → emit），
    // 与时间轴弹幕走同一套碰撞分配逻辑。弹幕隐藏时本层卸载，订阅失效 → no-op。
    useEffect(() => {
        if (!isVisible) return
        const stage = stageRef.current
        if (!stage) return

        const handler = (text: string, options?: SendDanmuOptions) => {
            const trimmed = text.trim()
            if (!trimmed) return

            const stageWidth = stage.clientWidth
            const trackCount = Math.max(1, Math.floor(stage.clientHeight / TRACK_HEIGHT))
            const mode = options?.mode ?? player.store.getState().danmuMode ?? 'scroll'
            const width = measureWidth(trimmed)
            const now = vtNow()

            let track = 0
            if (mode === 'scroll') {
                track = allocateTrack(
                    activeRef.current,
                    { trackCount, stageWidth, duration: SCROLL_DURATION, now },
                    width
                )
                if (track < 0) return // 无安全弹道，丢弃
            } else {
                // 顶部/底部：与时间轴弹幕一致，轮流取靠边空闲弹道
                const used = activeRef.current.filter((d) => d.mode === mode).map((d) => d.track)
                track = 0
                while (used.includes(track) && track < trackCount) track++
                if (track >= trackCount) return
            }

            activeRef.current = [
                ...activeRef.current,
                {
                    id: idRef.current++,
                    time: player.store.getState().currentTime,
                    text: trimmed,
                    color: options?.color ?? player.store.getState().danmuColor,
                    mode,
                    track,
                    enterAt: now,
                    width
                }
            ]
        }

        player.on('danmu-send', handler)
        return () => player.off('danmu-send', handler)
    }, [isVisible, measureWidth, player, vtNow])

    // 渲染循环：绘制活动弹幕；播放暂停时由虚拟时钟冻结位置（暂停不漂移）
    useEffect(() => {
        if (!isVisible) return
        if (typeof requestAnimationFrame !== 'function') return
        let raf = 0
        const render = () => {
            const { w, h } = sizeRef.current
            const ctx = ctxRef.current
            if (ctx && w && h) {
                const active = activeRef.current
                if (active.length) {
                    const now = vtNow()
                    activeRef.current = active.filter(
                        (d) => now - d.enterAt < (d.mode === 'scroll' ? SCROLL_DURATION : FIXED_DURATION)
                    )
                    ctx.clearRect(0, 0, w, h)
                    for (const d of activeRef.current) drawDanmu(ctx, d, w, h, now)
                } else {
                    ctx.clearRect(0, 0, w, h)
                }
            }
            raf = requestAnimationFrame(render)
        }
        raf = requestAnimationFrame(render)
        return () => cancelAnimationFrame(raf)
    }, [isVisible, vtNow])

    if (!isVisible) return null

    return (
        <div ref={stageRef} className={styles.danmuStage}>
            <canvas ref={canvasRef} data-capture-layer="danmu" />
        </div>
    )
}
