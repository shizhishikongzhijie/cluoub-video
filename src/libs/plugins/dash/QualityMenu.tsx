import { useState } from 'react'
import { useStore } from 'zustand'

import type { PlayerInstance } from '../../core/types'
import styles from './styles.module.scss'

/**
 * 画质选择下拉菜单。
 * 读取 store 中由 dash 插件填充的 qualities 列表，
 * 选择后通过事件总线通知插件切换，并同步 quality 状态。
 */
export const QualityMenu = ({ player }: { player: PlayerInstance }) => {
    const qualities = useStore(player.store, (s) => s.qualities)
    const quality = useStore(player.store, (s) => s.quality)
    const activeQuality = useStore(player.store, (s) => s.activeQuality)
    const [isOpen, setIsOpen] = useState(false)

    // 当前实际生效档位的文案（用于 auto 模式下展示真实档位）
    const activeLabel = activeQuality === 'auto' ? '' : (qualities.find((q) => q.key === activeQuality)?.label ?? '')

    // 按钮文案：手动模式显示所选档位；auto 模式显示「自动」并附带实际档位
    const currentLabel =
        quality === 'auto'
            ? activeLabel
                ? `自动 · ${activeLabel}`
                : '自动'
            : (qualities.find((q) => q.key === quality)?.label ?? '自动')

    const select = (key: string) => {
        player.store.setState({ quality: key })
        player.emit('request-quality-change', key)
        setIsOpen(false)
    }

    return (
        <div className={styles.qualityBox} onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
            <button className={styles.qualityBtn} aria-label="画质" aria-haspopup="menu" aria-expanded={isOpen}>
                {currentLabel}
            </button>
            {isOpen && (
                <div className={styles.qualityMenu} role="menu">
                    <button
                        role="menuitemradio"
                        aria-checked={quality === 'auto'}
                        className={`${styles.qualityItem} ${quality === 'auto' ? styles.qualityActive : ''}`}
                        onClick={() => select('auto')}
                    >
                        自动{activeLabel ? ` · ${activeLabel}` : ''}
                    </button>
                    {qualities.map((q) => (
                        <button
                            key={q.key}
                            role="menuitemradio"
                            aria-checked={quality === q.key}
                            className={`${styles.qualityItem} ${quality === q.key ? styles.qualityActive : ''}`}
                            onClick={() => select(q.key)}
                        >
                            {q.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
