import classNames from 'classnames'
import type { CSSProperties } from 'react'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { useStore } from 'zustand'

import { Controls } from './Controls'
import type { PlayerInstance } from './core/types' // 引入类型
// 引入类型
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { usePlayer } from './hooks/usePlayer'
import type { GestureFeedback } from './hooks/useTouchGestures'
import { useTouchGestures } from './hooks/useTouchGestures'
import { Layers } from './Layers'
import controlsStyles from './styles/controls.module.scss'
import styles from './styles/player.module.scss'
import type { CluoubVideoProps, VideoRef } from './types'

// --- 子组件：PlayerUI (只有当 player 存在时才渲染) ---
const PlayerUI = ({ player, feedback }: { player: PlayerInstance; feedback: GestureFeedback | null }) => {
    // 现在这里可以放心使用 useStore 了，因为 player 肯定不为 null
    const isPlaying = useStore(player.store, (s) => s.isPlaying)
    const isControlsVisible = useStore(player.store, (s) => s.isControlsVisible)
    const isWaiting = useStore(player.store, (s) => s.isWaiting)
    const showControls = !isPlaying || isControlsVisible

    // 鼠标交互
    const handleMouseEnter = () => player.setShowControls(true)
    const handleMouseLeave = () => {
        if (isPlaying) player.setShowControls(false)
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
            <Layers player={player} />

            {/* 控制栏层 */}
            <div className={classNames(controlsStyles.controlsLayer, { [controlsStyles.visible]: showControls })}>
                <Controls player={player} />
            </div>
        </div>
    )
}

// --- 主组件 ---
export const CluoubVideo = forwardRef<VideoRef, CluoubVideoProps>((props, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)

    // 1. 初始化 Player
    // forwardRef 会将 props 推断为 Omit<CluoubVideoProps, 'ref'>，因 CluoubVideoProps 含索引签名
    // 会丢失 source 的必填性，这里显式断言回完整类型
    const player = usePlayer(containerRef, props as CluoubVideoProps)

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
            playIndex: (index: number) => player?.playIndex(index),
            next: () => player?.next(),
            prev: () => player?.prev(),
            captureFrame: (options?: { type?: string; quality?: number }) => player?.captureFrame(options) ?? null,
            captureFrames: (options?: { count?: number; intervalMs?: number; type?: string }) =>
                player?.captureFrames(options) ?? Promise.resolve([]),
            getVideoElement: () => player?.video ?? null,
            getPlayer: () => player
        }),
        [player]
    )

    // 4. 将尺寸/比例等 props 应用到容器
    const { width, height, aspectRatio, themeColor } = props
    const containerStyle: CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        // aspectRatio 支持 '16:9' 写法，转换为 CSS 的 '16 / 9'
        aspectRatio: aspectRatio ? aspectRatio.replace(':', ' / ') : undefined,
        ...(themeColor ? ({ '--theme-color': themeColor } as CSSProperties) : {})
    }

    return (
        // 这个 div 是挂载点，必须始终存在；tabIndex 使其可聚焦以接收键盘事件
        <div ref={containerRef} className={styles.videoContainer} style={containerStyle} tabIndex={0}>
            {/* 5. 条件渲染：只有 player 初始化完成后，才渲染 UI */}
            {player ? (
                <PlayerUI player={player} feedback={feedback} />
            ) : (
                <div className={styles.skeleton}>Loading...</div>
            )}
        </div>
    )
})

CluoubVideo.displayName = 'CluoubVideo'
