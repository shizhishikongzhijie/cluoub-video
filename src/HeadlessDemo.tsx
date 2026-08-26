import './headless-demo.css'

import { useState } from 'react'

import { usePlayer } from './libs/hooks/usePlayer'
import { PlayerProvider, PlayerRoot, usePlayerInstance, usePlayerState } from './libs/react/context'

const HeadlessControls = () => {
    const player = usePlayerInstance()
    const { currentTime, duration, isMuted, isPlaying, volume } = usePlayerState((state) => ({
        currentTime: state.currentTime,
        duration: state.duration,
        isMuted: state.isMuted,
        isPlaying: state.isPlaying,
        volume: state.volume
    }))
    const progress = duration > 0 ? currentTime / duration : 0

    return (
        <div className="headless-controls" aria-label="自定义播放器控制栏">
            <button onClick={player.togglePlay}>{isPlaying ? '暂停' : '播放'}</button>
            <input
                aria-label="播放进度"
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={progress}
                onChange={(event) => player.seek(Number(event.target.value) * duration)}
            />
            <button onClick={player.toggleMute}>{isMuted ? '取消静音' : '静音'}</button>
            <input
                aria-label="音量"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(event) => player.setVolume(Number(event.target.value))}
            />
            <output>
                {Math.round(currentTime)} / {Math.round(duration || 0)} 秒
            </output>
        </div>
    )
}

export const HeadlessDemo = () => {
    const [error, setError] = useState<string>()
    const player = usePlayer({
        source: './video.mp4_ja.mp4',
        onError: (cause) => setError(String(cause))
    })
    if (!player) return <div className="headless-loading">正在创建 Headless Player…</div>

    return (
        <section className="headless-demo">
            <header>
                <p className="headless-eyebrow">HEADLESS CORE · REACT PRIMITIVES</p>
                <h1>同一个播放内核，自定义控制栏与主题</h1>
                <p>此示例只使用真实播放器状态和命令 API，没有复制默认控件逻辑。</p>
            </header>
            <PlayerProvider player={player}>
                <PlayerRoot className="headless-player" tabIndex={0}>
                    <HeadlessControls />
                </PlayerRoot>
            </PlayerProvider>
            {error && <p className="headless-error">播放错误：{error}</p>}
        </section>
    )
}
