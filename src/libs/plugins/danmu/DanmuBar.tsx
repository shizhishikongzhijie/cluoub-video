import classNames from 'classnames'
import { MessageSquare, Send } from 'lucide-react'
import { useState } from 'react'
import { useStore } from 'zustand'

import type { PlayerInstance } from '../../core/types'
import { useOptionalPlayerViewState } from '../../react/context'
import styles from './danmuBar.module.scss'
import { type DanmuAPI, getLegacyDanmuApi } from './state'

const MODES: { key: 'scroll' | 'top' | 'bottom'; label: string }[] = [
    { key: 'scroll', label: '滚动' },
    { key: 'top', label: '顶部' },
    { key: 'bottom', label: '底部' }
]

// B 站常用弹幕配色
const COLORS = [
    '#ffffff',
    '#fe0302',
    '#ff7204',
    '#ffaa02',
    '#ffd302',
    '#ffff00',
    '#a0ee00',
    '#00cd00',
    '#019899',
    '#4266be',
    '#89d5ff',
    '#ec00ec'
]

/**
 * 弹幕操作栏（B 站式「专门操作区」）：输入框 + 发送 + 模式/颜色/开关。
 * 两种用法：
 * 1) docked=true：弹幕插件按 showDanmuBar 配置挂载到播放器底部（zIndex 25，控制栏之上，
 *    控制栏出现时自动上移避免遮挡）；
 * 2) 默认（内联）：外部任意位置渲染 <DanmuBar player={player} /> 放入播放器下方的专门区域。
 * 依赖弹幕插件已安装（player.danmu）。弹幕隐藏时禁止发送（与 B 站行为一致）。
 */
export const DanmuBar = ({
    player,
    api: configuredApi,
    docked = false
}: {
    player: PlayerInstance
    api?: DanmuAPI
    docked?: boolean
}) => {
    const api = configuredApi ?? getLegacyDanmuApi(player)
    if (!api) throw new Error('DanmuBar requires an installed danmuPlugin')
    const { isVisible, mode, color } = useStore(api.store)
    const showControls = useOptionalPlayerViewState((state) => state.controlsVisible)
    const [text, setText] = useState('')

    const send = () => {
        if (!isVisible || !text.trim()) return
        api.send(text.trim())
        setText('')
    }

    // 阻止冒泡：操作栏悬浮在视频上，避免触发底层播放/暂停点击热区
    const stop = (e: React.SyntheticEvent) => e.stopPropagation()

    return (
        <div
            className={classNames(styles.bar, { [styles.docked]: docked })}
            style={docked ? { bottom: showControls ? 96 : 12 } : undefined}
            onClick={stop}
            onKeyDown={stop}
        >
            <input
                className={styles.input}
                type="text"
                value={text}
                maxLength={100}
                placeholder={isVisible ? '发一条友善的弹幕吧' : '弹幕已关闭'}
                disabled={!isVisible}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        send()
                    }
                }}
                aria-label="弹幕内容"
            />
            <button
                className={styles.sendBtn}
                onClick={send}
                disabled={!isVisible || !text.trim()}
                aria-label="发送弹幕"
            >
                <Send size={16} />
            </button>

            <div className={styles.controls}>
                {MODES.map((m) => (
                    <button
                        key={m.key}
                        className={classNames(styles.modeBtn, { [styles.active]: mode === m.key })}
                        onClick={() => api.setMode(m.key)}
                        aria-pressed={mode === m.key}
                    >
                        {m.label}
                    </button>
                ))}

                <div className={styles.colors}>
                    {COLORS.map((c) => (
                        <button
                            key={c}
                            className={classNames(styles.colorDot, { [styles.active]: color === c })}
                            style={{ background: c }}
                            onClick={() => api.setColor(c)}
                            aria-label={`弹幕颜色 ${c}`}
                        />
                    ))}
                </div>

                <label className={styles.customColor} title="自定义颜色" aria-label="自定义弹幕颜色">
                    <input type="color" value={color} onChange={(e) => api.setColor(e.target.value)} />
                </label>

                <button
                    className={classNames(styles.toggleBtn, { [styles.active]: isVisible })}
                    onClick={api.toggleVisible}
                    aria-pressed={isVisible}
                    aria-label={isVisible ? '关闭弹幕' : '开启弹幕'}
                >
                    <MessageSquare size={15} />
                    {isVisible ? '开' : '关'}
                </button>
            </div>
        </div>
    )
}
