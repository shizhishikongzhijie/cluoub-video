import classNames from 'classnames'
import {
    Maximize,
    Minimize,
    Pause,
    PictureInPicture2,
    Play,
    RectangleHorizontal,
    RectangleVertical,
    Repeat,
    Settings,
    SkipBack,
    SkipForward,
    Square,
    Volume2,
    VolumeX
} from 'lucide-react'
import { useState } from 'react'
import { useStore } from 'zustand'

import type { PlayerInstance } from '../core/types'
import { QualityMenu } from '../plugins/quality/QualityMenu'
import { PlayerSlotContribution, usePlayerViewState, usePlayerViewStore, useSlotContributions } from '../react/context'
import styles from '../styles/controls.module.scss'
import type { PlayerControlsConfig } from '../types'
import { isStreamingSource, resolveSource } from '../utils/source'
import { formatTime } from '../utils/time'
import Progress from './Process'

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]

// 默认全部显示；controls=false 隐藏全部内置控件；传对象则按字段覆盖（未指定的默认显示）
const resolveControlsConfig = (controls: boolean | PlayerControlsConfig | undefined) => {
    const allOn: Required<Omit<PlayerControlsConfig, 'plugins'>> & { plugins: Record<string, boolean> } = {
        play: true,
        volume: true,
        time: true,
        progress: true,
        fullscreen: true,
        settings: true,
        pip: true,
        danmu: true,
        quality: true,
        speed: true,
        screenMode: true,
        plugins: {}
    }
    if (controls === false) {
        return {
            ...allOn,
            play: false,
            volume: false,
            time: false,
            progress: false,
            fullscreen: false,
            settings: false,
            pip: false,
            danmu: false,
            quality: false,
            speed: false,
            screenMode: false
        }
    }
    if (controls && typeof controls === 'object') {
        return { ...allOn, ...controls }
    }
    return allOn
}

export const Controls = ({
    player,
    controls,
    thumbnail
}: {
    player: PlayerInstance
    controls?: boolean | PlayerControlsConfig
    thumbnail?: import('../types').ThumbnailConfig
}) => {
    const {
        currentTime,
        duration,
        isPlaying,
        isMuted,
        volume,
        playbackRate,
        isPip,
        isFullscreen,
        buffered,
        bufferedRanges,
        isLoop,
        playlistIndex,
        playlistLength,
        qualities
    } = useStore(player.store)
    const screenMode = usePlayerViewState((state) => state.screenMode)
    const viewStore = usePlayerViewStore()
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

    const currentSrc = player.video?.currentSrc || resolveSource(player.options.source)

    const [isSpeedOpen, setIsSpeedOpen] = useState(false)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    const toggleScreenMode = () =>
        viewStore.setState((state) => ({
            screenMode: state.screenMode === 'normal' ? 'wide' : state.screenMode === 'wide' ? 'small' : 'normal'
        }))

    const leadingControls = useSlotContributions('controls.leading')
    const progressControls = useSlotContributions('controls.progress')
    const settingsControls = useSlotContributions('controls.settings')
    const trailingControls = useSlotContributions('controls.trailing')

    // 解析控件可见性配置
    const cfg = resolveControlsConfig(controls)

    // 按位置筛选并排序插件注册的控制按钮
    // 插件组件自带交互元素（按钮/弹层），这里仅做容器，不再额外包 <button> 以免嵌套
    // 同时遵循 controls 配置：quality/danmu 关闭时隐藏对应 controlKey 的插件控件
    const renderPluginControls = (contributions: typeof leadingControls) =>
        contributions
            .filter((control) => {
                if (control.controlId === 'quality') return cfg.quality
                if (control.controlId === 'danmu') return cfg.danmu
                return control.controlId ? cfg.plugins[control.controlId] !== false : true
            })
            .map((control) => (
                <span key={control.id} className={styles.pluginSlot}>
                    <PlayerSlotContribution contribution={control} />
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
                        thumbnail={thumbnail}
                        source={currentSrc}
                        onSeek={seek}
                    />
                    {progressControls.map((contribution) => (
                        <span key={contribution.id} className={styles.progressPluginSlot}>
                            <PlayerSlotContribution contribution={contribution} />
                        </span>
                    ))}
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

                    {renderPluginControls(leadingControls)}
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

                    {renderPluginControls(trailingControls)}

                    {cfg.quality && qualities.length > 0 && (
                        <QualityMenu player={player} allowAuto={isStreamingSource(currentSrc)} />
                    )}

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
                                    {settingsControls.map((contribution) => (
                                        <div key={contribution.id} className={styles.settingsPluginSlot}>
                                            <PlayerSlotContribution contribution={contribution} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {cfg.screenMode && (
                        <button
                            className={classNames(styles.iconBtn, { [styles.active]: screenMode !== 'normal' })}
                            onClick={toggleScreenMode}
                            aria-label={
                                screenMode === 'wide' ? '切换小窗' : screenMode === 'small' ? '恢复常规' : '切换宽屏'
                            }
                        >
                            {screenMode === 'wide' ? (
                                <RectangleVertical />
                            ) : screenMode === 'small' ? (
                                <Square />
                            ) : (
                                <RectangleHorizontal />
                            )}
                        </button>
                    )}

                    {cfg.fullscreen && (
                        <button
                            className={styles.iconBtn}
                            onClick={toggleFullscreen}
                            aria-label={isFullscreen ? '退出全屏' : '全屏'}
                        >
                            {isFullscreen ? <Minimize /> : <Maximize />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
