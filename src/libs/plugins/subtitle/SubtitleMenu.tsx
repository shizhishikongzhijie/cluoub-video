import classNames from 'classnames'
import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useStore } from 'zustand'

import type { SubtitleTrack } from './index'
import type { SubtitleAPI, SubtitleStyles } from './state'
import styles from './styles.module.scss'

// --- 简单的 Switch 组件 ---
const Switch = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <div className={`${styles.switch} ${checked ? styles.active : ''}`} onClick={() => onChange(!checked)}>
        <div className={styles.switchHandle} />
    </div>
)

// --- 自定义下拉：替代原生 <select>，支持点击外部关闭 ---
const TrackSelector = ({
    tracks,
    value,
    onChange
}: {
    tracks: SubtitleTrack[]
    value: number
    onChange: (index: number) => void
}) => {
    const [open, setOpen] = useState(false)
    const boxRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onDocMouseDown = (e: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', onDocMouseDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('mousedown', onDocMouseDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [])

    const selected = tracks[value]

    return (
        <div className={styles.trackSelect} ref={boxRef}>
            <button
                type="button"
                className={styles.trackSelectTrigger}
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label="选择字幕语言"
            >
                <span>{selected ? `${selected.label} (${selected.lang})` : '选择字幕语言'}</span>
                <ChevronDown size={14} className={styles.trackSelectChevron} />
            </button>

            {open && (
                <ul className={styles.trackSelectList} role="listbox">
                    {tracks.map((t, i) => (
                        <li
                            key={t.id}
                            role="option"
                            aria-selected={i === value}
                            className={classNames(styles.trackSelectItem, { [styles.active]: i === value })}
                            onClick={() => {
                                onChange(i)
                                setOpen(false)
                            }}
                        >
                            <span>{t.label}</span>
                            <span className={styles.trackLang}>{t.lang}</span>
                            {i === value && <Check size={14} />}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export const SubtitleMenu = ({ api, tracks }: { api: SubtitleAPI; tracks: SubtitleTrack[] }) => {
    const { isVisible, track, offset, styles: subtitleStyles } = useStore(api.store)

    const updateStyle = (key: keyof SubtitleStyles, val: number | string | boolean) => {
        api.store.setState((prev) => ({ styles: { ...prev.styles, [key]: val } }))
    }

    return (
        <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
            {/* 1. 开关 & 轨道 */}
            <div className={styles.section}>
                <div className={styles.title}>
                    <span>字幕开关</span>
                    <Switch checked={isVisible} onChange={api.setVisible} />
                </div>

                {isVisible && (
                    <div className={styles.row}>
                        <TrackSelector tracks={tracks} value={track} onChange={api.setTrack} />
                    </div>
                )}

                {isVisible && (
                    <div className={styles.row}>
                        <span>同步</span>
                        <input
                            type="range"
                            min={-5}
                            max={5}
                            step={0.5}
                            className={styles.slider}
                            value={offset}
                            onChange={(e) => api.setOffset(Number(e.target.value))}
                        />
                        <span>{offset > 0 ? `+${offset}s` : `${offset}s`}</span>
                    </div>
                )}
            </div>

            {isVisible && (
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
