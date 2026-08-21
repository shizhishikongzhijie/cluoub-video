import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from 'zustand'

import { DEFAULT_SUBTITLE_STYLES, type PlayerInstance } from '../../core/types'
import { type AssRendererHandle, createAssRenderer } from './assRenderer'
import type { SubtitleTrack } from './index'
import { fetchSubtitle, type SubtitleCue } from './parser'
import styles from './styles.module.scss'

export const SubtitleLayer = ({ player, tracks }: { player: PlayerInstance; tracks: SubtitleTrack[] }) => {
    const { isSubtitleVisible, subtitleTrack, subtitleStyles, subtitleOffset, currentTime, screenMode } = useStore(
        player.store
    )
    const [cues, setCues] = useState<SubtitleCue[]>([])
    const assRendererRef = useRef<AssRendererHandle | null>(null)

    // 1. 加载并解析当前轨道；ASS 走 libjass 渲染器（懒加载，未安装 libjass 时回退为空）
    useEffect(() => {
        const track = tracks[subtitleTrack]
        if (!track) {
            setCues([])
            return
        }

        if (track.type === 'ass') {
            setCues([])
            let cancelled = false
            createAssRenderer(player.video, track.src)
                .then((renderer) => {
                    if (cancelled) {
                        renderer.dispose()
                        return
                    }
                    assRendererRef.current = renderer
                    // 初始化时若字幕处于隐藏状态，立即同步（避免异步就绪后字幕直接显示）
                    if (!player.store.getState().isSubtitleVisible) renderer.pause()
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
        fetchSubtitle(track.src).then((parsed) => {
            if (!cancelled) setCues(parsed)
        })
        return () => {
            cancelled = true
        }
    }, [subtitleTrack, tracks, player])

    // 2. 字幕可见性开关同步到 ASS 渲染器（VTT/SRT 由下方 activeCue 天然控制）
    useEffect(() => {
        if (isSubtitleVisible) {
            assRendererRef.current?.resume()
        } else {
            assRendererRef.current?.pause()
        }
    }, [isSubtitleVisible])

    // 2.5 容器尺寸变化（全屏/屏幕模式/窗口缩放）时通知 ASS 渲染器重新布局
    useEffect(() => {
        assRendererRef.current?.resize()
    }, [screenMode])

    // 2. 查找当前应该显示的字幕（应用同步偏移）
    const activeCue = useMemo(() => {
        if (!isSubtitleVisible) return null
        const t = currentTime - subtitleOffset
        return cues.find((c) => t >= c.start && t <= c.end)
    }, [currentTime, cues, isSubtitleVisible, subtitleOffset])

    // 2.75 当前字幕文本写入 store，供合成截图在 canvas 上绘制（VTT/SRT；ASS 走 DOM 渲染不参与）
    useEffect(() => {
        const text = activeCue?.text ?? ''
        if (player.store.getState().activeSubtitleText !== text) {
            player.store.setState({ activeSubtitleText: text })
        }
    }, [activeCue, player])

    if (!activeCue) return null

    // 3. 应用样式
    const sub = subtitleStyles ?? DEFAULT_SUBTITLE_STYLES
    const cssVars = {
        '--sub-size': `${sub.fontSize}px`,
        '--sub-color': sub.color,
        '--sub-opacity': sub.opacity,
        '--sub-weight': sub.isBold ? 'bold' : 'normal',
        '--sub-shadow': sub.isOutline ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
    } as React.CSSProperties

    return (
        <div className={styles.subtitleLayer} style={cssVars}>
            <span className={styles.cue}>{activeCue.text}</span>
        </div>
    )
}
