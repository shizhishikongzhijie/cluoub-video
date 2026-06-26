import { createStore } from 'zustand/vanilla'

import type { PlayerState } from './types.ts'

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
        subtitleTrack: -1,
        isSubtitleVisible: true,
        subtitleStyles: {
            fontSize: 20,
            color: '#ffffff',
            isOutline: true,
            isBold: false,
            opacity: 1
        },
        isFullscreen: false,
        isPip: false,
        isControlsVisible: true,
        isDanmuVisible: true,
        playlistIndex: 0,
        playlistLength: 0,
        uiRegistry: { layers: [], controls: [] }
    }))
