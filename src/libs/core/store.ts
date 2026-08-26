import { createStore } from 'zustand/vanilla'

import type { PlayerState } from './types'

export const createPlayerStore = () =>
    createStore<PlayerState>(() => ({
        isPlaying: false,
        isMuted: false,
        volume: 1,
        currentTime: 0,
        duration: 0,
        buffered: 0,
        bufferedRanges: [],
        isWaiting: false,
        playbackRate: 1,
        isLoop: false,
        quality: 'auto',
        activeQuality: 'auto',
        qualities: [],
        isFullscreen: false,
        isPip: false,
        playlistIndex: 0,
        playlistLength: 0
    }))
