import { useStore } from 'zustand'

import type { PlayerInstance, SubtitleStyles } from '../../core/types'
import type { SubtitleTrack } from './index'
import styles from './styles.module.scss'

// --- 简单的 Switch 组件 ---
const Switch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <div className={`${styles.switch} ${checked ? styles.active : ''}`} onClick={() => onChange(!checked)}>
        <div className={styles.switchHandle} />
    </div>
)

const DEFAULT_SUBTITLE_STYLES: SubtitleStyles = {
    fontSize: 20,
    color: '#ffffff',
    isOutline: true,
    isBold: false,
    opacity: 1
}

export const SubtitleMenu = ({ player, tracks }: { player: PlayerInstance; tracks: SubtitleTrack[] }) => {
    const { isSubtitleVisible, subtitleTrack } = useStore(player.store)
    const subtitleStyles = useStore(player.store, (s) => s.subtitleStyles) ?? DEFAULT_SUBTITLE_STYLES

    const updateStyle = (key: keyof SubtitleStyles, val: number | string | boolean) => {
        player.store.setState((prev) => ({
            subtitleStyles: { ...(prev.subtitleStyles ?? DEFAULT_SUBTITLE_STYLES), [key]: val }
        }))
    }

    return (
        <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
            {/* 1. 开关 & 轨道 */}
            <div className={styles.section}>
                <div className={styles.title}>
                    <span>字幕开关</span>
                    <Switch
                        checked={isSubtitleVisible}
                        onChange={(v) => player.store.setState({ isSubtitleVisible: v })}
                    />
                </div>

                {isSubtitleVisible && (
                    <div className={styles.row}>
                        <select
                            className={styles.nativeSelect}
                            value={subtitleTrack}
                            onChange={(e) => player.store.setState({ subtitleTrack: Number(e.target.value) })}
                        >
                            {tracks.map((t, i) => (
                                <option key={t.id} value={i}>
                                    {t.label} ({t.lang})
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {isSubtitleVisible && (
                <>
                    <div className={styles.section}>
                        <div className={styles.title}>样式</div>

                        {/* 字体大小 */}
                        <div className={styles.row}>
                            <span>大小</span>
                            <input
                                type="range"
                                min={12}
                                max={40}
                                step={1}
                                className={styles.slider}
                                value={subtitleStyles.fontSize}
                                onChange={(e) => updateStyle('fontSize', Number(e.target.value))}
                            />
                            <span>{subtitleStyles.fontSize}</span>
                        </div>

                        {/* 不透明度 */}
                        <div className={styles.row}>
                            <span>透明</span>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.1}
                                className={styles.slider}
                                value={subtitleStyles.opacity}
                                onChange={(e) => updateStyle('opacity', Number(e.target.value))}
                            />
                            <span>{Math.round(subtitleStyles.opacity * 100)}%</span>
                        </div>

                        {/* 颜色 */}
                        <div className={styles.row}>
                            <span>颜色</span>
                            <input
                                type="color"
                                className={styles.colorInput}
                                value={subtitleStyles.color}
                                onChange={(e) => updateStyle('color', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.row}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>描边</span>
                                <Switch
                                    checked={subtitleStyles.isOutline}
                                    onChange={(v) => updateStyle('isOutline', v)}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>加粗</span>
                                <Switch checked={subtitleStyles.isBold} onChange={(v) => updateStyle('isBold', v)} />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
