import {Captions} from 'lucide-react'
import {useState} from 'react'

import type {SubtitleTrack} from '@/libs'

import type {PlayerInstance} from '../../core/types'
import {SubtitleMenu} from './SubtitleMenu'

// 按钮组件 (把 Popover 逻辑放在这里)
export const SubtitleMenuBtn = ({ player, tracks }: { player: PlayerInstance; tracks: SubtitleTrack[] }) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Captions onClick={() => setIsOpen(!isOpen)} />

            {isOpen && (
                <div style={{ position: 'absolute', bottom: '50px', right: '-100px' }}>
                    <SubtitleMenu player={player} tracks={tracks} onClose={() => setIsOpen(false)} />
                </div>
            )}

            {/* 点击外部关闭遮罩 */}
            {isOpen && <div style={{ position: 'fixed', inset: 0, zIndex: -1 }} onClick={() => setIsOpen(false)} />}
        </>
    )
}
