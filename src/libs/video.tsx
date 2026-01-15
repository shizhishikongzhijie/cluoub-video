import classNames from 'classnames'
import {useRef} from 'react'
import {useStore} from 'zustand'

import {Controls} from './Controls'
import type {PlayerInstance} from './core/types' // 引入类型
// 引入类型
import {usePlayer} from './hooks/usePlayer'
import {Layers} from './Layers'
import controlsStyles from './styles/controls.module.scss'
import styles from './styles/player.module.scss'
import type {CluoubVideoProps} from './types'

// --- 子组件：PlayerUI (只有当 player 存在时才渲染) ---
const PlayerUI = ({ player, config }: { player: PlayerInstance; config: any }) => {
    // 现在这里可以放心使用 useStore 了，因为 player 肯定不为 null
    const isPlaying = useStore(player.store, (s) => s.isPlaying)
    const isControlsVisible = useStore(player.store, (s) => s.isControlsVisible)
    const isFullscreen = useStore(player.store, (s) => s.isFullscreen)
    const showControls = !isPlaying || isControlsVisible

    // 鼠标交互
    const handleMouseEnter = () => player.setShowControls(true)
    const handleMouseLeave = () => {
        if (isPlaying) player.setShowControls(false)
    }

    return (
        <div
            className={classNames(styles.playerRoot, {
                [styles.fullscreen]: isFullscreen,
                [styles.hideCursor]: isPlaying && !isControlsVisible
            })}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* 插件层 (弹幕等) */}
            <Layers player={player} />

            {/* 控制栏层 */}
            <div className={classNames(controlsStyles.controlsLayer, { [controlsStyles.visible]: showControls })}>
                <Controls player={player} config={config} />
            </div>
        </div>
    )
}

// --- 主组件 ---
export const CluoubVideo = (props: CluoubVideoProps) => {
    const containerRef = useRef<HTMLDivElement>(null)

    // 1. 初始化 Player
    const player = usePlayer(containerRef, props)

    return (
        // 这个 div 是挂载点，必须始终存在
        <div ref={containerRef} className={styles.videoContainer}>
            {/* 2. 条件渲染：只有 player 初始化完成后，才渲染 UI */}
            {player ? <PlayerUI player={player} config={props} /> : <div className={styles.skeleton}>Loading...</div>}
        </div>
    )
}
