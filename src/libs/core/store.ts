import {createStore} from 'zustand/vanilla'

import type {PlayerState} from './types.ts'

export const createPlayerStore = () =>
    createStore<PlayerState>(() => ({
        isPlaying: false,
        isMuted: false,
        volume: 1,
        currentTime: 0,
        duration: 0,
        buffered: 0,
        isWaiting: false,
        playbackRate: 1,
        quality: 'auto',
        qualities: [],
        subtitleTrack: -1,
        isSubtitleVisible: true,
        isFullscreen: false,
        isPip: false,
        isControlsVisible: true,
        uiRegistry: { layers: [], controls: [] }
    }))
