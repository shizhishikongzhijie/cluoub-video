import { describe, expect, it, vi } from 'vitest'

import type { ActiveDanmu } from './engine'
import { drawDanmu, FIXED_DURATION, SCROLL_DURATION, TRACK_HEIGHT } from './render'

type DrawCall = ['stroke' | 'fill', string, number, number, number]

const makeCtx = () => {
    const calls: DrawCall[] = []
    const ctx = {
        font: '',
        textBaseline: '',
        lineJoin: '',
        lineWidth: 0,
        strokeStyle: '',
        fillStyle: '',
        globalAlpha: 1,
        strokeText: vi.fn((text: string, x: number, y: number) => calls.push(['stroke', text, x, y, ctx.globalAlpha])),
        fillText: vi.fn((text: string, x: number, y: number) => calls.push(['fill', text, x, y, ctx.globalAlpha]))
    } as unknown as CanvasRenderingContext2D & {
        strokeText: ReturnType<typeof vi.fn>
        fillText: ReturnType<typeof vi.fn>
    }
    return { ctx, calls }
}

const makeDanmu = (over: Partial<ActiveDanmu>): ActiveDanmu => ({
    id: 1,
    text: '测试弹幕',
    time: 0,
    mode: 'scroll',
    track: 0,
    enterAt: 0,
    width: 120,
    ...over
})

describe('drawDanmu 滚动弹幕', () => {
    it('刚发射（elapsed=0）时透明度为 0，不绘制', () => {
        const { ctx, calls } = makeCtx()
        drawDanmu(ctx, makeDanmu({ enterAt: 1000 }), 800, 450, 1000)
        expect(calls).toHaveLength(0)
    })

    it('进入淡入淡出结束后以全透明度绘制，位置随进度左移', () => {
        const { ctx, calls } = makeCtx()
        const d = makeDanmu({ enterAt: 0, width: 100 })
        // elapsed = 400ms，alpha = 1
        drawDanmu(ctx, d, 800, 450, 400)
        const travel = 800 + 100
        const progress = 400 / SCROLL_DURATION
        const x = 800 - progress * travel
        const y = TRACK_HEIGHT / 2
        expect(calls).toHaveLength(2)
        expect(calls[0]).toEqual(['stroke', d.text, x, y, 1])
        expect(calls[1]).toEqual(['fill', d.text, x, y, 1])
    })

    it('接近离场时透明度下降（淡出）', () => {
        const { ctx, calls } = makeCtx()
        drawDanmu(ctx, makeDanmu({ enterAt: 0 }), 800, 450, SCROLL_DURATION - 100)
        const alpha = calls[0][4]
        expect(alpha).toBeGreaterThan(0)
        expect(alpha).toBeLessThan(1)
    })

    it('使用弹幕指定颜色，缺省为白色', () => {
        const { ctx } = makeCtx()
        drawDanmu(ctx, makeDanmu({ enterAt: 0, color: '#ff0000' }), 800, 450, 400)
        expect(ctx.fillStyle).toBe('#ff0000')
        drawDanmu(ctx, makeDanmu({ enterAt: 0 }), 800, 450, 400)
        expect(ctx.fillStyle).toBe('#fff')
    })
})

describe('drawDanmu 顶部/底部固定弹幕', () => {
    it('顶部弹幕水平居中，纵向位于对应弹道顶部', () => {
        const { ctx, calls } = makeCtx()
        const d = makeDanmu({ enterAt: 0, mode: 'top', track: 2 })
        drawDanmu(ctx, d, 800, 450, FIXED_DURATION / 2)
        const x = 800 / 2
        const y = 2 * TRACK_HEIGHT + TRACK_HEIGHT / 2
        expect(calls[0][2]).toBe(x)
        expect(calls[0][3]).toBe(y)
        expect(calls[0][4]).toBe(1)
    })

    it('底部弹幕纵向从下往上数弹道', () => {
        const { ctx, calls } = makeCtx()
        const d = makeDanmu({ enterAt: 0, mode: 'bottom', track: 1 })
        drawDanmu(ctx, d, 800, 450, FIXED_DURATION / 2)
        const x = 800 / 2
        const y = 450 - 1 * TRACK_HEIGHT - TRACK_HEIGHT / 2
        expect(calls[0][2]).toBe(x)
        expect(calls[0][3]).toBe(y)
    })

    it('固定弹幕开头淡入、结尾淡出', () => {
        const { ctx, calls } = makeCtx()
        const d = makeDanmu({ enterAt: 0, mode: 'top' })
        drawDanmu(ctx, d, 800, 450, FIXED_DURATION * 0.05) // 淡入中
        const fadeInAlpha = calls[0][4]
        expect(fadeInAlpha).toBeGreaterThan(0)
        expect(fadeInAlpha).toBeLessThan(1)
        calls.length = 0
        drawDanmu(ctx, d, 800, 450, FIXED_DURATION * 0.95) // 淡出中
        const fadeOutAlpha = calls[0][4]
        expect(fadeOutAlpha).toBeGreaterThan(0)
        expect(fadeOutAlpha).toBeLessThan(1)
    })
})
