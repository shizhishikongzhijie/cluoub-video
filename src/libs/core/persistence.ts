import { loadPersisted, savePersisted } from '../utils/storage'
import type { createPlayerStore } from './store'
import type { PersistConfig, PlayerOptions } from './types'

export const resolvePersistConfig = (persist: PlayerOptions['persist'] | null): PersistConfig | null => {
    if (persist === true) return { progress: true, volume: true, playbackRate: true }
    if (persist && typeof persist === 'object') return persist
    return null
}

export interface Persistence {
    restore: () => void
    updateConfig: (persist: PlayerOptions['persist']) => void
    onTimeUpdate: (now: number, currentTime: number) => void
    onRateChange: (rate: number) => void
    onVolumeChange: (volume: number, muted: boolean) => void
    destroy: () => void
}

export const createPersistence = (
    video: HTMLVideoElement,
    store: ReturnType<typeof createPlayerStore>,
    persist: PlayerOptions['persist'] | null,
    getCurrentSrc: () => string
): Persistence => {
    let config = resolvePersistConfig(persist)
    let lastPersistSave = 0
    let removePendingRestore: (() => void) | undefined

    const restore = () => {
        removePendingRestore?.()
        removePendingRestore = undefined
        if (!config) return
        const saved = loadPersisted(getCurrentSrc())
        if (!saved) return

        if (config.volume && typeof saved.volume === 'number') {
            video.volume = saved.volume
            video.muted = saved.volume === 0
            store.setState({ volume: saved.volume, isMuted: video.muted })
        }
        if (config.playbackRate && typeof saved.playbackRate === 'number') {
            video.playbackRate = saved.playbackRate
            store.setState({ playbackRate: saved.playbackRate })
        }
        if (config.progress && typeof saved.time === 'number' && saved.time > 0) {
            const onMetadata = () => {
                if (saved.time! < video.duration - 1) {
                    video.currentTime = saved.time!
                    store.setState({ currentTime: saved.time! })
                }
                removePendingRestore = undefined
            }
            video.addEventListener('loadedmetadata', onMetadata, { once: true })
            removePendingRestore = () => video.removeEventListener('loadedmetadata', onMetadata)
        }
    }

    const persistence: Persistence = {
        restore,
        updateConfig: (persistConfig) => {
            config = resolvePersistConfig(persistConfig)
            lastPersistSave = 0
            restore()
        },
        onTimeUpdate: (now, currentTime) => {
            if (config?.progress && now - lastPersistSave > 3000) {
                lastPersistSave = now
                savePersisted(getCurrentSrc(), { time: currentTime })
            }
        },
        onRateChange: (rate) => {
            if (config?.playbackRate) savePersisted(getCurrentSrc(), { playbackRate: rate })
        },
        onVolumeChange: (volume, muted) => {
            if (config?.volume) savePersisted(getCurrentSrc(), { volume: muted ? 0 : volume })
        },
        destroy: () => {
            removePendingRestore?.()
            removePendingRestore = undefined
        }
    }
    persistence.restore()
    return persistence
}
