import { MessageSquare, MessageSquareOff } from 'lucide-react'
import { useStore } from 'zustand'

import type { PlayerInstance } from '../../core/types'
import controlStyles from '../../styles/controls.module.scss'

/** 弹幕开关按钮 */
export const DanmuToggleBtn = ({ player }: { player: PlayerInstance }) => {
    const isVisible = useStore(player.store, (s) => s.isDanmuVisible)

    const toggle = () => player.store.setState({ isDanmuVisible: !isVisible })

    return (
        <button
            className={`${controlStyles.iconBtn} ${isVisible ? controlStyles.active : ''}`}
            onClick={toggle}
            aria-label={isVisible ? '关闭弹幕' : '开启弹幕'}
        >
            {isVisible ? <MessageSquare /> : <MessageSquareOff />}
        </button>
    )
}
