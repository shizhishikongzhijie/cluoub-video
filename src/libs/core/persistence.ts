import type { CluoubVideoProps } from '../types'
import { loadPersisted, savePersisted } from '../utils/storage'
import type { createPlayerStore } from './store'

export interface PersistConfig {
    progress?: boolean
    volume?: boolean
    playbackRate?: boolean
}

export const resolvePersistConfig = (persist: CluoubVideoProps['persist']): PersistConfig | null => {
    if (persist === true) return { progress: true, volume: true, playbackRate: true }
    if (persist && typeof persist === 'object') return persist
    return null
}

export interface Persistence {
    /** timeupdate 节流回调：按需落盘进度（落盘频率由内部 ~3s 节流控制） */
    onTimeUpdate: (now: number, currentTime: number) => void
    /** ratechange 回调 */
    onRateChange: (rate: number) => void
    /** volumechange 回调（含静音切换） */
    onVolumeChange: (volume: number, muted: boolean) => void
}

/**
 * 本地持久化：创建时恢复音量/倍速/续播进度，并提供各媒体事件下的落盘回调。
 * key 为当前视频源 URL，进度需等元数据加载后再 seek。
 */
export const createPersistence = (
    video: HTMLVideoElement,
    store: ReturnType<typeof createPlayerStore>,
    persistCfg: PersistConfig | null,
    getCurrentSrc: () => string
): Persistence => {
    // 恢复音量/倍速（在初次设置 src 后立即应用，进度需等元数据加载）
    if (persistCfg) {
        const saved = loadPersisted(getCurrentSrc())
        if (saved) {
            if (persistCfg.volume && typeof saved.volume === 'number') {
                video.volume = saved.volume
                video.muted = saved.volume === 0
                store.setState({ volume: saved.volume, isMuted: video.muted })
            }
            if (persistCfg.playbackRate && typeof saved.playbackRate === 'number') {
                video.playbackRate = saved.playbackRate
                store.setState({ playbackRate: saved.playbackRate })
            }
            if (persistCfg.progress && typeof saved.time === 'number' && saved.time > 0) {
                video.addEventListener(
                    'loadedmetadata',
                    () => {
                        // 已播完（接近结尾）则不续播
                        if (saved.time! < video.duration - 1) video.currentTime = saved.time!
                    },
                    { once: true }
                )
            }
        }
    }

    let lastPersistSave = 0
    return {
        onTimeUpdate: (now, currentTime) => {
            // 持久化进度：每 ~3s 落盘一次，避免频繁写 localStorage
            if (persistCfg?.progress && now - lastPersistSave > 3000) {
                lastPersistSave = now
                savePersisted(getCurrentSrc(), { time: currentTime })
            }
        },
        onRateChange: (rate) => {
            if (persistCfg?.playbackRate) savePersisted(getCurrentSrc(), { playbackRate: rate })
        },
        onVolumeChange: (volume, muted) => {
            if (persistCfg?.volume) savePersisted(getCurrentSrc(), { volume: muted ? 0 : volume })
        }
    }
}
