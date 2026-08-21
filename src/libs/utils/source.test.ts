import { describe, expect, it } from 'vitest'

import { isStreamingSource, resolveSource } from './source'

describe('resolveSource', () => {
    it('字符串源原样返回', () => {
        expect(resolveSource('video.mp4')).toBe('video.mp4')
    })

    it('VideoSource 对象取 src', () => {
        expect(resolveSource({ src: 'movie.mp4', type: 'mp4' })).toBe('movie.mp4')
    })

    it('VideoSource 数组取首个 src', () => {
        expect(
            resolveSource([
                { src: '1080p.mp4', quality: '1080P' },
                { src: '720p.mp4', quality: '720P' }
            ])
        ).toBe('1080p.mp4')
    })

    it('空数组返回空字符串', () => {
        expect(resolveSource([])).toBe('')
    })
})

describe('isStreamingSource', () => {
    it('识别 m3u8 / mpd 源', () => {
        expect(isStreamingSource('https://x.com/stream.m3u8')).toBe(true)
        expect(isStreamingSource('https://x.com/stream.m3u8?token=1')).toBe(true)
        expect(isStreamingSource('https://x.com/stream.mpd')).toBe(true)
        expect(isStreamingSource('https://x.com/stream.mpd?token=1')).toBe(true)
    })

    it('普通源与带后缀的目录不误判', () => {
        expect(isStreamingSource('video.mp4')).toBe(false)
        expect(isStreamingSource('movie.mpd.backup')).toBe(false)
    })
})
