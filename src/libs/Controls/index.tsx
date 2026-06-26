import classNames from 'classnames'
import {
    Maximize,
    Pause,
    PictureInPicture2,
    Play,
    Repeat,
    Settings,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX
} from 'lucide-react'
import { useState } from 'react'
import { useStore } from 'zustand'

import type { PlayerInstance } from '../core/types'
import styles from '../styles/controls.module.scss'
import type { PlayerControlsConfig } from '../types'
import { formatTime } from '../utils/time'
import Progress from './Process'

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]

// 默认全部显示；controls=false 隐藏全部内置控件；传对象则按字段覆盖（未指定的默认显示）
const resolveControlsConfig = (controls: PlayerInstance['options']['controls']): Required<PlayerControlsConfig> => {
    const allOn: Required<PlayerControlsConfig> = {
        play: true,
        volume: true,
        time: true,
        progress: true,
        fullscreen: true,
        settings: true,
        pip: true,
        danmu: true,
        quality: true,
        speed: true
    }
    if (controls === false) {
        return Object.keys(allOn).reduce((acc, k) => ({ ...acc, [k]: false }), {} as Required<PlayerControlsConfig>)
    }
    if (controls && typeof controls === 'object') {
        return { ...allOn, ...controls }
    }
    return allOn
}

export const Controls = ({ player }: { player: PlayerInstance }) => {
    const {
        currentTime,
        duration,
        isPlaying,
        isMuted,
        volume,
        uiRegistry,
        playbackRate,
        isPip,
        buffered,
        bufferedRanges,
        isLoop,
        playlistIndex,
        playlistLength
    } = useStore(player.store)
    const {
        togglePlay,
        toggleMute,
        setVolume,
        toggleFullscreen,
        seek,
        setPlaybackRate,
        togglePip,
        toggleLoop,
        next,
        prev
    } = player

    const [isSpeedOpen, setIsSpeedOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // 解析控件可见性配置
    const cfg = resolveControlsConfig(player.options.controls)

    // 按位置筛选并排序插件注册的控制按钮
    // 插件组件自带交互元素（按钮/弹层），这里仅做容器，不再额外包 <button> 以免嵌套
    // 同时遵循 controls 配置：quality/danmu 关闭时隐藏对应插件控件
    const controlsByPosition = (position: 'left' | 'right') =>
        uiRegistry.controls
            .filter((control) => (control.position || 'right') === position)
            .filter((control) => {
                if (control.id === 'quality-selector-hls' || control.id === 'quality-selector-dash') return cfg.quality
                if (control.id === 'danmu-btn') return cfg.danmu
                return true
            })
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((control) => (
                <span key={control.id} className={styles.pluginSlot}>
                    {control.component}
                </span>
            ))

    return (
        <div className={styles.controlsContainer}>
            {/* 1. 进度条 (全宽) */}
            {cfg.progress && (
                <div className={styles.progressWrap}>
                    <Progress
                        progress={duration > 0 ? (currentTime / duration) * 100 : 0}
                        buffered={buffered}
                        bufferedRanges={bufferedRanges}
                        duration={duration}
                        thumbnail={player.options.thumbnail}
                        onSeek={seek}
                    />
                </div>
            )}

            {/* 2. 按钮行 */}
            <div className={styles.buttonsRow}>
                {/* 左侧：播放 + 时间 */}
                <div className={styles.leftGroup}>
                    {playlistLength > 1 && (
                        <button
                            className={styles.iconBtn}
                            onClick={prev}
                            disabled={playlistIndex <= 0}
                            aria-label="上一集"
                        >
                            <SkipBack fill="currentColor" />
                        </button>
                    )}

                    {cfg.play && (
                        <button
                            className={styles.iconBtn}
                            onClick={togglePlay}
                            aria-label={isPlaying ? '暂停' : '播放'}
                        >
                            {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                        </button>
                    )}

                    {playlistLength > 1 && (
                        <button
                            className={styles.iconBtn}
                            onClick={next}
                            disabled={playlistIndex >= playlistLength - 1}
                            aria-label="下一集"
                        >
                            <SkipForward fill="currentColor" />
                        </button>
                    )}

                    {cfg.time && (
                        <div className={styles.timeDisplay}>
                            <span>{formatTime(currentTime)}</span>
                            <span className={styles.separator}>/</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    )}

                    {controlsByPosition('left')}
                </div>

                {/* 右侧：音量 + 倍速 + 画中画 + 设置 + 全屏 */}
                <div className={styles.rightGroup}>
                    {/* 音量条 (Hover展开) */}
                    {cfg.volume && (
                        <div className={styles.volumeBox}>
                            <button
                                className={styles.iconBtn}
                                onClick={toggleMute}
                                aria-label={isMuted || volume === 0 ? '取消静音' : '静音'}
                            >
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
                                    aria-label="音量"
                                />
                            </div>
                        </div>
                    )}

                    {controlsByPosition('right')}

                    {/* 倍速菜单 */}
                    {cfg.speed && (
                        <div
                            className={styles.speedBox}
                            onMouseEnter={() => setIsSpeedOpen(true)}
                            onMouseLeave={() => setIsSpeedOpen(false)}
                        >
                            <button
                                className={styles.speedBtn}
                                aria-label="播放速度"
                                aria-haspopup="menu"
                                aria-expanded={isSpeedOpen}
                            >
                                {playbackRate}x
                            </button>
                            {isSpeedOpen && (
                                <div className={styles.speedMenu} role="menu">
                                    {SPEED_OPTIONS.map((rate) => (
                                        <button
                                            key={rate}
                                            role="menuitemradio"
                                            aria-checked={rate === playbackRate}
                                            className={classNames(styles.speedItem, {
                                                [styles.speedActive]: rate === playbackRate
                                            })}
                                            onClick={() => {
                                                setPlaybackRate(rate)
                                                setIsSpeedOpen(false)
                                            }}
                                        >
                                            {rate === 1 ? '正常' : `${rate}x`}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 画中画 */}
                    {cfg.pip && (
                        <button
                            className={classNames(styles.iconBtn, { [styles.active]: isPip })}
                            onClick={() => togglePip()}
                            aria-label="画中画"
                            aria-pressed={isPip}
                        >
                            <PictureInPicture2 />
                        </button>
                    )}

                    {/* 设置 */}
                    {cfg.settings && (
                        <div
                            className={styles.settingsBox}
                            onMouseEnter={() => setIsSettingsOpen(true)}
                            onMouseLeave={() => setIsSettingsOpen(false)}
                        >
                            <button
                                className={classNames(styles.iconBtn, { [styles.active]: isSettingsOpen })}
                                aria-label="设置"
                                aria-haspopup="menu"
                                aria-expanded={isSettingsOpen}
                            >
                                <Settings />
                            </button>
                            {isSettingsOpen && (
                                <div className={styles.settingsMenu} role="menu">
                                    <button
                                        role="menuitemcheckbox"
                                        aria-checked={isLoop}
                                        className={classNames(styles.settingsItem, {
                                            [styles.settingsActive]: isLoop
                                        })}
                                        onClick={toggleLoop}
                                    >
                                        <Repeat size={16} />
                                        <span>循环播放</span>
                                        <span className={styles.settingsState}>{isLoop ? '开' : '关'}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {cfg.fullscreen && (
                        <button className={styles.iconBtn} onClick={toggleFullscreen} aria-label="全屏">
                            <Maximize />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
