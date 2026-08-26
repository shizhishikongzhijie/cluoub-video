import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from 'zustand'

import type { PlayerInstance } from '../../core/types'
import { type AssRendererHandle, createAssRenderer } from './assRenderer'
import type { SubtitleTrack } from './index'
import { fetchSubtitle, type SubtitleCue } from './parser'
import { type SubtitleAPI } from './state'
import styles from './styles.module.scss'

export const SubtitleLayer = ({
    player,
    tracks,
    api
}: {
    player: PlayerInstance
    tracks: SubtitleTrack[]
    api: SubtitleAPI
}) => {
    const currentTime = useStore(player.store, (state) => state.currentTime)
    const { isVisible, track, styles: subtitleStyles, offset } = useStore(api.store)
    const [cues, setCues] = useState<SubtitleCue[]>([])
    const assRendererRef = useRef<AssRendererHandle | null>(null)

    // 1. 加载并解析当前轨道；ASS 走 libjass 渲染器（懒加载，未安装 libjass 时回退为空）
    useEffect(() => {
        const selectedTrack = tracks[track]
        if (!selectedTrack) {
            setCues([])
            return
        }

        if (selectedTrack.type === 'ass') {
            setCues([])
            let cancelled = false
            createAssRenderer(player.video, selectedTrack.src)
                .then((renderer) => {
                    if (cancelled) {
                        renderer.dispose()
                        return
                    }
                    assRendererRef.current = renderer
                    // 初始化时若字幕处于隐藏状态，立即同步（避免异步就绪后字幕直接显示）
                    if (!api.store.getState().isVisible) renderer.pause()
                })
                .catch((e) => {
                    console.error('ASS 字幕渲染失败（需安装可选依赖 libjass）', e)
                })
            return () => {
                cancelled = true
                assRendererRef.current?.dispose()
                assRendererRef.current = null
            }
        }

        let cancelled = false
        fetchSubtitle(selectedTrack.src).then((parsed) => {
            if (!cancelled) setCues(parsed)
        })
        return () => {
            cancelled = true
        }
    }, [api, player, track, tracks])

    // 2. 字幕可见性开关同步到 ASS 渲染器（VTT/SRT 由下方 activeCue 天然控制）
    useEffect(() => {
        if (isVisible) {
            assRendererRef.current?.resume()
        } else {
            assRendererRef.current?.pause()
        }
    }, [isVisible])

    // 2.5 尺寸变化时通知 ASS 渲染器重新布局；不依赖默认 React UI 的屏幕模式状态。
    useEffect(() => {
        const resize = () => assRendererRef.current?.resize()
        if (typeof ResizeObserver === 'undefined') {
            window.addEventListener('resize', resize)
            return () => window.removeEventListener('resize', resize)
        }
        const observer = new ResizeObserver(resize)
        observer.observe(player.video)
        return () => observer.disconnect()
    }, [player])

    // 2. 查找当前应该显示的字幕（应用同步偏移）
    const activeCue = useMemo(() => {
        if (!isVisible) return null
        const t = currentTime - offset
        return cues.find((c) => t >= c.start && t <= c.end)
    }, [currentTime, cues, isVisible, offset])

    if (!activeCue) return null

    // 3. 应用样式
    const sub = subtitleStyles
    const cssVars = {
        '--sub-size': `${sub.fontSize}px`,
        '--sub-color': sub.color,
        '--sub-opacity': sub.opacity,
        '--sub-weight': sub.isBold ? 'bold' : 'normal',
        '--sub-shadow': sub.isOutline ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
    } as React.CSSProperties

    return (
        <div className={styles.subtitleLayer} style={cssVars}>
            <span className={styles.cue} data-cluoub-subtitle-cue>
                {activeCue.text}
            </span>
        </div>
    )
}
