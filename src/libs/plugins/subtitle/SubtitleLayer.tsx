import React, {useEffect, useMemo, useState} from 'react'
import {useStore} from 'zustand'

import {PlayerInstance} from '../../core/createPlayer'
import {SubtitleTrack} from './index'
import styles from './styles.module.scss'

// 简单的 VTT 解析器 (生产环境建议用 'webvtt-parser' 库)
const parseVTT = async (url: string) => {
    const text = await fetch(url).then((r) => r.text())
    const lines = text.split('\n')
    const cues: { start: number; end: number; text: string }[] = []

    let currentCue: any = null

    lines.forEach((line) => {
        if (line.includes('-->')) {
            const [start, end] = line.split('-->').map((t) => {
                const p = t.trim().split(':')
                // 00:00:05.000 -> seconds
                return parseFloat(p[0]) * 3600 + parseFloat(p[1]) * 60 + parseFloat(p[2])
            })
            currentCue = { start, end, text: '' }
        } else if (currentCue && line.trim()) {
            currentCue.text += line + '\n'
        } else if (!line.trim() && currentCue) {
            cues.push(currentCue)
            currentCue = null
        }
    })
    if (currentCue) cues.push(currentCue)

    return cues
}

export const SubtitleLayer = ({ player, tracks }: { player: PlayerInstance; tracks: SubtitleTrack[] }) => {
    const { isSubtitleVisible, subtitleTrack, subtitleStyles, currentTime } = useStore(player.store, (s) => s as any)
    const [cues, setCues] = useState<any[]>([])

    // 1. 加载并解析当前轨道
    useEffect(() => {
        const track = tracks[subtitleTrack]
        if (!track) return

        if (track.type === 'vtt' || track.type === 'srt') {
            parseVTT(track.src).then(setCues)
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
    const cssVars = {
        '--sub-size': `${subtitleStyles.fontSize}px`,
        '--sub-color': subtitleStyles.color,
        '--sub-opacity': subtitleStyles.opacity,
        '--sub-weight': subtitleStyles.isBold ? 'bold' : 'normal',
        '--sub-shadow': subtitleStyles.isOutline ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
    } as React.CSSProperties

    return (
        <div className={styles.subtitleLayer} style={cssVars}>
            <span className={styles.cue}>{activeCue.text}</span>
        </div>
    )
}
