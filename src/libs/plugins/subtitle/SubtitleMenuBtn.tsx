import { Captions } from 'lucide-react'
import { useState } from 'react'

import type { PlayerInstance } from '../../core/types'
import controlStyles from '../../styles/controls.module.scss'
import type { SubtitleTrack } from './index'
import styles from './styles.module.scss'
import { SubtitleMenu } from './SubtitleMenu'

// 按钮组件 (把 Popover 逻辑放在这里)
export const SubtitleMenuBtn = ({ player, tracks }: { player: PlayerInstance; tracks: SubtitleTrack[] }) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className={styles.subtitleBox} onMouseLeave={() => setIsOpen(false)}>
            <button
                className={`${controlStyles.iconBtn} ${isOpen ? controlStyles.active : ''}`}
                onClick={() => setIsOpen((v) => !v)}
            >
                <Captions />
            </button>

            {isOpen && (
                <div className={styles.subtitlePopover}>
                    <SubtitleMenu player={player} tracks={tracks} />
                </div>
            )}
        </div>
    )
}
