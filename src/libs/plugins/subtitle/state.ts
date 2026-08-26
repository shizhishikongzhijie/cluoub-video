import type { StoreApi } from 'zustand/vanilla'
import { createStore } from 'zustand/vanilla'

export interface SubtitleStyles {
    fontSize: number
    color: string
    isOutline: boolean
    isBold: boolean
    opacity: number
}

export const DEFAULT_SUBTITLE_STYLES: SubtitleStyles = {
    fontSize: 20,
    color: '#ffffff',
    isOutline: true,
    isBold: false,
    opacity: 1
}

export interface SubtitleState {
    track: number
    isVisible: boolean
    styles: SubtitleStyles
    offset: number
}

export interface SubtitleAPI {
    readonly store: StoreApi<SubtitleState>
    setVisible: (visible: boolean) => void
    setTrack: (track: number) => void
    setOffset: (offset: number) => void
    setStyles: (styles: SubtitleStyles) => void
}

export const createSubtitleStore = (initial?: Partial<SubtitleState>) =>
    createStore<SubtitleState>(() => ({
        track: 0,
        isVisible: true,
        styles: DEFAULT_SUBTITLE_STYLES,
        offset: 0,
        ...initial
    }))

export const createSubtitleApi = (initial?: Partial<SubtitleState>): SubtitleAPI => {
    const store = createSubtitleStore(initial)
    return {
        store,
        setVisible: (isVisible) => store.setState({ isVisible }),
        setTrack: (track) => store.setState({ track }),
        setOffset: (offset) => store.setState({ offset }),
        setStyles: (styles) => store.setState({ styles })
    }
}
