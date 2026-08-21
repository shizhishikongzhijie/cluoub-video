import { describe, expect, it } from 'vitest'

import { resolveSource } from '../utils/source'

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
