import { createStore } from 'zustand/vanilla'

import { DEFAULT_SUBTITLE_STYLES, type PlayerState } from './types'

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
        subtitleStyles: DEFAULT_SUBTITLE_STYLES,
        subtitleOffset: 0,
        activeSubtitleText: '',
        isFullscreen: false,
        isPip: false,
        isControlsVisible: true,
        isDanmuVisible: true,
        danmuMode: 'scroll',
        danmuColor: '#ffffff',
        // 屏幕模式：normal 常规 / wide 宽屏（21:9）/ small 小窗
        screenMode: 'normal',
        playlistIndex: 0,
        playlistLength: 0,
        uiRegistry: { layers: [], controls: [] }
    }))
