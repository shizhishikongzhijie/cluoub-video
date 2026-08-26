import { Captions } from 'lucide-react'
import { useState } from 'react'

import controlStyles from '../../styles/controls.module.scss'
import type { SubtitleTrack } from './index'
import type { SubtitleAPI } from './state'
import styles from './styles.module.scss'
import { SubtitleMenu } from './SubtitleMenu'

// 按钮组件 (把 Popover 逻辑放在这里)
export const SubtitleMenuBtn = ({ tracks, api }: { tracks: SubtitleTrack[]; api: SubtitleAPI }) => {
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
                    <SubtitleMenu api={api} tracks={tracks} />
                </div>
            )}
        </div>
    )
}
