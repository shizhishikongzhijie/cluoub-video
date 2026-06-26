import { describe, expect, it } from 'vitest'

import { formatTime } from './time'

describe('formatTime', () => {
    it('对非法/边界输入返回 00:00', () => {
        expect(formatTime(0)).toBe('00:00')
        expect(formatTime(NaN)).toBe('00:00')
        expect(formatTime(-5)).toBe('00:00')
    })

    it('格式化分秒（小于 1 小时）', () => {
        expect(formatTime(5)).toBe('00:05')
        expect(formatTime(65)).toBe('01:05')
        expect(formatTime(599)).toBe('09:59')
        expect(formatTime(3599)).toBe('59:59')
    })

    it('超过 1 小时带上小时位', () => {
        expect(formatTime(3600)).toBe('1:00:00')
        expect(formatTime(3661)).toBe('1:01:01')
        expect(formatTime(36000)).toBe('10:00:00')
    })

    it('向下取整忽略毫秒部分', () => {
        expect(formatTime(5.9)).toBe('00:05')
        expect(formatTime(125.4)).toBe('02:05')
    })
})
