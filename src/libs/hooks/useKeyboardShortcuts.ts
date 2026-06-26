import { useEffect } from 'react'

import type { PlayerInstance } from '../core/types'

/**
 * 播放器键盘快捷键。
 * 绑定在容器元素上（需 tabIndex 可聚焦），避免全局劫持页面按键。
 * - Space / K：播放/暂停
 * - ← / →：快退 / 快进 5s
 * - ↑ / ↓：音量 +/- 10%
 * - M：静音切换
 * - F：全屏切换
 */
export const useKeyboardShortcuts = (
    containerRef: React.RefObject<HTMLElement | null>,
    player: PlayerInstance | null
) => {
    useEffect(() => {
        const el = containerRef.current
        if (!el || !player) return

        const SEEK_STEP = 5
        const VOLUME_STEP = 0.1

        const handler = (e: KeyboardEvent) => {
            const { currentTime, duration, volume } = player.store.getState()

            switch (e.key) {
                case ' ':
                case 'k':
                case 'K':
                    e.preventDefault()
                    player.togglePlay()
                    break
                case 'ArrowLeft':
                    e.preventDefault()
                    player.seek(Math.max(0, currentTime - SEEK_STEP))
                    break
                case 'ArrowRight':
                    e.preventDefault()
                    player.seek(Math.min(duration || 0, currentTime + SEEK_STEP))
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    player.setVolume(Math.min(1, volume + VOLUME_STEP))
                    break
                case 'ArrowDown':
                    e.preventDefault()
                    player.setVolume(Math.max(0, volume - VOLUME_STEP))
                    break
                case 'm':
                case 'M':
                    e.preventDefault()
                    player.toggleMute()
                    break
                case 'f':
                case 'F':
                    e.preventDefault()
                    player.toggleFullscreen()
                    break
                default:
                    break
            }
        }

        el.addEventListener('keydown', handler)
        return () => el.removeEventListener('keydown', handler)
    }, [containerRef, player])
}
