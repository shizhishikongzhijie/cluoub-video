import { MessageSquare, MessageSquareOff } from 'lucide-react'
import { useStore } from 'zustand'

import controlStyles from '../../styles/controls.module.scss'
import type { DanmuAPI } from './state'

/** 弹幕开关按钮 */
export const DanmuToggleBtn = ({ api }: { api: DanmuAPI }) => {
    const isVisible = useStore(api.store, (state) => state.isVisible)

    return (
        <button
            className={`${controlStyles.iconBtn} ${isVisible ? controlStyles.active : ''}`}
            onClick={api.toggleVisible}
            aria-label={isVisible ? '关闭弹幕' : '开启弹幕'}
        >
            {isVisible ? <MessageSquare /> : <MessageSquareOff />}
        </button>
    )
}
