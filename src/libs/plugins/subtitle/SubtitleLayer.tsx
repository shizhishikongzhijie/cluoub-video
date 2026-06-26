import React, { useEffect, useMemo, useState } from 'react'
import { useStore } from 'zustand'

import { PlayerInstance } from '../../core/types'
import { SubtitleTrack } from './index'
import { fetchSubtitle, type SubtitleCue } from './parser'
import styles from './styles.module.scss'

export const SubtitleLayer = ({ player, tracks }: { player: PlayerInstance; tracks: SubtitleTrack[] }) => {
    const { isSubtitleVisible, subtitleTrack, subtitleStyles, currentTime } = useStore(player.store)
    const [cues, setCues] = useState<SubtitleCue[]>([])

    // 1. 加载并解析当前轨道
    useEffect(() => {
        const track = tracks[subtitleTrack]
        if (!track) {
            setCues([])
            return
        }

        if (track.type === 'vtt' || track.type === 'srt') {
            let cancelled = false
            fetchSubtitle(track.src).then((parsed) => {
                if (!cancelled) setCues(parsed)
            })
            return () => {
                cancelled = true
            }
        }
        // TODO: Add ASS support via libjass
    }, [subtitleTrack, tracks])

    // 2. 查找当前应该显示的字幕
    const activeCue = useMemo(() => {
        if (!isSubtitleVisible) return null
        return cues.find((c) => currentTime >= c.start && currentTime <= c.end)
    }, [currentTime, cues, isSubtitleVisible])

    if (!activeCue) return null

    // 3. 应用样式
    const sub = subtitleStyles ?? {
        fontSize: 20,
        color: '#ffffff',
        opacity: 1,
        isBold: false,
        isOutline: true
    }
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
