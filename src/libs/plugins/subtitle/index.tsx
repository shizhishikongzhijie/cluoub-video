import { optionalBoolean, parseConfigObject } from '../../core/config'
import { definePlugin } from '../../core/plugin'
import { createSubtitleApi, type SubtitleAPI } from './state'
import { SubtitleLayer } from './SubtitleLayer'
import { SubtitleMenuBtn } from './SubtitleMenuBtn'

export type { SubtitleAPI, SubtitleState, SubtitleStyles } from './state'

export interface SubtitleTrack {
    id: string
    label: string
    src: string
    lang: string
    type: 'vtt' | 'srt' | 'ass'
}

export interface SubtitleConfig {
    tracks: SubtitleTrack[]
    defaultShow?: boolean
}

const parseTracks = (input: unknown): SubtitleTrack[] => {
    if (!Array.isArray(input)) throw new TypeError('tracks must be an array')
    return input.map((value, index) => {
        const track = parseConfigObject(value, `tracks[${index}]`, ['id', 'label', 'src', 'lang', 'type'])
        for (const key of ['id', 'label', 'src', 'lang'] as const) {
            if (typeof track[key] !== 'string') throw new TypeError(`tracks[${index}].${key} must be a string`)
        }
        if (!['vtt', 'srt', 'ass'].includes(String(track.type))) {
            throw new TypeError(`tracks[${index}].type is invalid`)
        }
        return track as unknown as SubtitleTrack
    })
}

const parseSubtitleConfig = (input: unknown): Required<SubtitleConfig> => {
    const config = parseConfigObject(input, 'subtitle', ['tracks', 'defaultShow'])
    return {
        tracks: parseTracks(config.tracks ?? []),
        defaultShow: optionalBoolean(config, 'defaultShow', true)
    }
}

export const subtitlePlugin = definePlugin<SubtitleConfig, SubtitleAPI>({
    id: 'subtitle',
    schema: { parse: parseSubtitleConfig },
    setup: ({ player, slots }, config) => {
        const { tracks, defaultShow } = config as Required<SubtitleConfig>

        const api = createSubtitleApi({ isVisible: defaultShow })

        // 2. 注册 UI：字幕渲染层
        slots.register({
            id: 'subtitle-layer',
            slot: 'overlay',
            content: <SubtitleLayer player={player} tracks={tracks} api={api} />,
            zIndex: 5
        })

        // 3. 注册 UI：控制栏按钮 (带 Popover)
        slots.register({
            id: 'subtitle-btn',
            slot: 'controls.trailing',
            content: <SubtitleMenuBtn tracks={tracks} api={api} />,
            order: 3
        })

        return { api }
    }
})
