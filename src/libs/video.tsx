import classNames from 'classnames'
import type { CSSProperties } from 'react'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { useStore } from 'zustand'

import { Controls } from './Controls'
import type { PlayerInstance } from './core/types' // 引入类型
// 引入类型
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { usePlayer } from './hooks/usePlayer'
import type { GestureFeedback } from './hooks/useTouchGestures'
import { useTouchGestures } from './hooks/useTouchGestures'
import { Layers } from './Layers'
import { getLegacyDanmuApi } from './plugins/danmu/state'
import {
    createPlayerViewStore,
    PlayerProvider,
    PlayerRoot,
    PlayerSlotContribution,
    usePlayerViewState,
    usePlayerViewStore,
    useSlotContributions
} from './react/context'
import controlsStyles from './styles/controls.module.scss'
import styles from './styles/player.module.scss'
import type { CluoubVideoProps, VideoRef } from './types'

// --- 子组件：PlayerUI (只有当 player 存在时才渲染) ---
const PlayerUI = ({
    player,
    feedback,
    controls,
    thumbnail
}: {
    player: PlayerInstance
    feedback: GestureFeedback | null
    controls: CluoubVideoProps['controls']
    thumbnail: CluoubVideoProps['thumbnail']
}) => {
    // 现在这里可以放心使用 useStore 了，因为 player 肯定不为 null
    const isPlaying = useStore(player.store, (s) => s.isPlaying)
    const isControlsVisible = usePlayerViewState((state) => state.controlsVisible)
    const viewStore = usePlayerViewStore()
    const isWaiting = useStore(player.store, (s) => s.isWaiting)
    const showControls = !isPlaying || isControlsVisible

    // 鼠标交互
    const handleMouseEnter = () => viewStore.setState({ controlsVisible: true })
    const handleMouseLeave = () => {
        if (isPlaying) viewStore.setState({ controlsVisible: false })
    }

    return (
        <div
            className={classNames(styles.playerRoot, {
                [styles.hideCursor]: isPlaying && !isControlsVisible
            })}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* 点击播放/暂停、双击全屏的交互热区（位于视频之上、控制栏之下） */}
            <div
                className={styles.clickCatcher}
                onClick={() => player.togglePlay()}
                onDoubleClick={() => player.toggleFullscreen()}
            />

            {/* 缓冲 Loading 指示 */}
            {isWaiting && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.spinner} />
                </div>
            )}

            {/* 手势反馈浮层 */}
            {feedback && (
                <div className={styles.gestureFeedback}>
                    <span>{feedback.text}</span>
                    {feedback.type === 'volume' && feedback.progress != null && (
                        <div className={styles.gestureBar}>
                            <div className={styles.gestureBarFill} style={{ width: `${feedback.progress * 100}%` }} />
                        </div>
                    )}
                </div>
            )}

            {/* 插件层 (弹幕等) */}
            <Layers />

            {/* 控制栏层 */}
            <div className={classNames(controlsStyles.controlsLayer, { [controlsStyles.visible]: showControls })}>
                <Controls player={player} controls={controls} thumbnail={thumbnail} />
            </div>
        </div>
    )
}

const DefaultBelowSlots = () => {
    const contributions = useSlotContributions('below')
    if (!contributions.length) return null
    return (
        <div className={styles.belowSlots}>
            {contributions.map((contribution) => (
                <PlayerSlotContribution key={contribution.id} contribution={contribution} />
            ))}
        </div>
    )
}

// --- 主组件 ---
export const CluoubVideo = forwardRef<VideoRef, CluoubVideoProps>((props, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [viewStore] = useState(createPlayerViewStore)

    // 1. 初始化 Headless Core；DOM 挂载由 PlayerRoot 负责。
    const player = usePlayer(props)

    // 2. 默认视图状态属于 React 层，不进入 Headless Core 的媒体状态。
    const screenMode = useStore(viewStore, (state) => state.screenMode)

    // 2. 键盘快捷键（绑定在容器上，需容器可聚焦）
    useKeyboardShortcuts(containerRef, player)

    // 2.5 移动端触摸手势
    const { feedback } = useTouchGestures(containerRef, player)

    // 3. 暴露命令式 API
    useImperativeHandle(
        ref,
        () => ({
            play: () => player?.play(),
            pause: () => player?.pause(),
            togglePlay: () => player?.togglePlay(),
            seek: (time: number) => player?.seek(time),
            setVolume: (vol: number) => player?.setVolume(vol),
            toggleMute: () => player?.toggleMute(),
            toggleFullscreen: () => player?.toggleFullscreen(),
            setPlaybackRate: (rate: number) => player?.setPlaybackRate(rate),
            togglePip: () => player?.togglePip() ?? Promise.resolve(),
            setScreenMode: (screenMode) => viewStore.setState({ screenMode }),
            toggleScreenMode: () =>
                viewStore.setState((state) => ({
                    screenMode:
                        state.screenMode === 'normal' ? 'wide' : state.screenMode === 'wide' ? 'small' : 'normal'
                })),
            playIndex: (index: number) => player?.playIndex(index),
            next: () => player?.next(),
            prev: () => player?.prev(),
            selectQuality: (key: string) => player?.selectQuality(key),
            captureFrame: (options?: { type?: string; quality?: number }) => player?.captureFrame(options) ?? null,
            captureFrames: (options?: { count?: number; intervalMs?: number; type?: string }) =>
                player?.captureFrames(options) ?? Promise.resolve([]),
            captureComposite: (options?: { type?: string; quality?: number }) =>
                player?.captureComposite(options) ?? Promise.resolve(null),
            getVideoElement: () => player?.video ?? null,
            getPlayer: () => player,
            getDanmu: () => (player ? getLegacyDanmuApi(player) : undefined)
        }),
        [player, viewStore]
    )

    // 4. 将尺寸/比例等 props 应用到容器
    const { width, height, aspectRatio, themeColor } = props
    const containerStyle: CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        // aspectRatio 支持 '16:9' 写法，转换为 CSS 的 '16 / 9'
        aspectRatio: aspectRatio ? aspectRatio.replace(':', ' / ') : undefined,
        ...(themeColor ? ({ '--cluoub-accent': themeColor, '--theme-color': themeColor } as CSSProperties) : {})
    }

    if (!player) {
        return (
            <div className={styles.videoContainer} style={containerStyle} aria-busy="true">
                <div className={styles.skeleton}>Loading...</div>
            </div>
        )
    }

    return (
        <PlayerProvider player={player} viewStore={viewStore}>
            <>
                <PlayerRoot
                    ref={containerRef}
                    className={classNames(styles.videoContainer, {
                        [styles.screenWide]: screenMode === 'wide',
                        [styles.screenSmall]: screenMode === 'small'
                    })}
                    style={containerStyle}
                    tabIndex={0}
                >
                    <PlayerUI
                        player={player}
                        feedback={feedback}
                        controls={props.controls}
                        thumbnail={props.thumbnail}
                    />
                </PlayerRoot>
                <DefaultBelowSlots />
            </>
        </PlayerProvider>
    )
})

CluoubVideo.displayName = 'CluoubVideo'
