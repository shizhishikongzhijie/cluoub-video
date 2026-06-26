import { describe, expect, it } from 'vitest'

import { type ActiveDanmu, allocateTrack, estimateWidth } from './engine'

const makeActive = (over: Partial<ActiveDanmu>): ActiveDanmu => ({
    id: 1,
    text: 'test',
    time: 0,
    mode: 'scroll',
    track: 0,
    enterAt: 0,
    width: 100,
    ...over
})

describe('estimateWidth', () => {
    it('中文按整宽计算', () => {
        // 4 个中文 * 20px = 80
        expect(estimateWidth('你好世界', 20)).toBe(80)
    })

    it('西文按 0.6 宽计算', () => {
        // 'abcde' 5 * 0.6 * 20 = 60
        expect(estimateWidth('abcde', 20)).toBe(60)
    })

    it('混合文本向上取整', () => {
        // 1中文(1) + 1字母(0.6) = 1.6 units * 20 = 32
        expect(estimateWidth('a好', 20)).toBe(32)
    })
})

describe('allocateTrack', () => {
    const ctx = { trackCount: 3, stageWidth: 800, duration: 8000, now: 10000 }

    it('空舞台分配到第 0 弹道', () => {
        expect(allocateTrack([], ctx, 100)).toBe(0)
    })

    it('第 0 弹道刚发射（尾部未进入）时改用下一条弹道', () => {
        // last 刚在 now 进入，尾部还在舞台外 → 第 0 道不安全
        const last = makeActive({ track: 0, enterAt: ctx.now, width: 200 })
        expect(allocateTrack([last], ctx, 100)).toBe(1)
    })

    it('第 0 弹道弹幕已充分前进时可复用第 0 道', () => {
        // last 在很久前进入，早已离开 → 第 0 道安全
        const last = makeActive({ track: 0, enterAt: ctx.now - 7000, width: 100 })
        expect(allocateTrack([last], ctx, 100)).toBe(0)
    })

    it('所有弹道都被占满且不安全时返回 -1', () => {
        const blockers = [0, 1, 2].map((t) => makeActive({ id: t, track: t, enterAt: ctx.now, width: 300 }))
        expect(allocateTrack(blockers, ctx, 100)).toBe(-1)
    })

    it('忽略非滚动模式的弹幕', () => {
        // 顶部弹幕占了 track 0，但不影响滚动弹道分配
        const topDanmu = makeActive({ track: 0, mode: 'top', enterAt: ctx.now })
        expect(allocateTrack([topDanmu], ctx, 100)).toBe(0)
    })
})
