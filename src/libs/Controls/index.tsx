import {Maximize, Pause, Play, Settings, Volume2, VolumeX} from 'lucide-react'
import {useStore} from 'zustand'

import type {PlayerInstance} from '../core/types'
import styles from '../styles/controls.module.scss'
import Progress from './Process'

export const Controls = ({ player, config }: { player: PlayerInstance; config: any }) => {
    const { currentTime, duration, isPlaying, isMuted, volume, uiRegistry } = useStore(player.store)
    const { togglePlay, toggleMute, setVolume, toggleFullscreen, seek } = player

    const formatTime = (time: number) => {
        if (!time || isNaN(time)) return '00:00'
        const min = Math.floor(time / 60)
        const sec = Math.floor(time % 60)
        return `${min}:${sec < 10 ? '0' : ''}${sec}`
    }
    console.log('Controls', uiRegistry)

    return (
        <div className={styles.controlsContainer}>
            {/* 1. 进度条 (全宽) */}
            <div className={styles.progressWrap}>
                <Progress
                    progress={(currentTime / duration) * 100}
                    duration={duration}
                    onSeek={seek}
                    // ... 缩略图 props
                />
            </div>

            {/* 2. 按钮行 */}
            <div className={styles.buttonsRow}>
                {/* 左侧：播放 + 时间 */}
                <div className={styles.leftGroup}>
                    <button className={styles.iconBtn} onClick={togglePlay}>
                        {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                    </button>

                    <div className={styles.timeDisplay}>
                        <span>{formatTime(currentTime)}</span>
                        <span className={styles.separator}>/</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* 右侧：音量 + 设置 + 全屏 */}
                <div className={styles.rightGroup}>
                    {uiRegistry.controls
                        .sort((a, b) => a.order - b.order)
                        .filter((control) => control.position === 'left')
                        .map((control) => (
                            <button key={control.id} className={styles.iconBtn}>
                                {control.component}
                            </button>
                        ))}
                    {/* 音量条 (Hover展开) */}
                    <div className={styles.volumeBox}>
                        <button className={styles.iconBtn} onClick={toggleMute}>
                            {isMuted || volume === 0 ? <VolumeX /> : <Volume2 />}
                        </button>
                        <div className={styles.volumeSlider}>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.1}
                                value={isMuted ? 0 : volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                    {uiRegistry.controls
                        .sort((a, b) => a.order - b.order)
                        .filter((control) => control.position === 'right')
                        .map((control) => (
                            <button key={control.id} className={styles.iconBtn}>
                                {control.component}
                            </button>
                        ))}

                    <button className={styles.iconBtn}>
                        <Settings />
                    </button>
                    <button className={styles.iconBtn} onClick={toggleFullscreen}>
                        <Maximize />
                    </button>
                </div>
            </div>
        </div>
    )
}
