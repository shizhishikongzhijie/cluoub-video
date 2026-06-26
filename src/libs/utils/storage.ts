// 播放器本地持久化：记忆音量/倍速与续播断点，按视频源 URL 作为 key 存储。

const PREFIX = 'cluoub-video:'

export interface PersistedState {
    /** 上次播放进度（秒） */
    time?: number
    /** 音量 0-1 */
    volume?: number
    /** 倍速 */
    playbackRate?: number
    /** 写入时间戳，用于过期清理 */
    updatedAt?: number
}

const isAvailable = (): boolean => {
    try {
        return typeof window !== 'undefined' && !!window.localStorage
    } catch {
        return false
    }
}

const keyOf = (src: string) => `${PREFIX}${src}`

export const loadPersisted = (src: string): PersistedState | null => {
    if (!isAvailable() || !src) return null
    try {
        const raw = window.localStorage.getItem(keyOf(src))
        return raw ? (JSON.parse(raw) as PersistedState) : null
    } catch {
        return null
    }
}

export const savePersisted = (src: string, patch: Partial<PersistedState>): void => {
    if (!isAvailable() || !src) return
    try {
        const prev = loadPersisted(src) ?? {}
        const next: PersistedState = { ...prev, ...patch, updatedAt: Date.now() }
        window.localStorage.setItem(keyOf(src), JSON.stringify(next))
    } catch {
        // 配额满或隐私模式下静默失败
    }
}

export const clearPersisted = (src: string): void => {
    if (!isAvailable() || !src) return
    try {
        window.localStorage.removeItem(keyOf(src))
    } catch {
        // ignore
    }
}
