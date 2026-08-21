import { describe, expect, it } from 'vitest'

import { wrapSubtitle } from './captureContainer'

// 简易 mock ctx：measureText 按字符估算宽度（中文/字母均 10px，便于断言换行）
const makeCtx = (charW = 10) =>
    ({
        measureText: (text: string) => ({ width: text.length * charW })
    }) as CanvasRenderingContext2D

describe('wrapSubtitle 字幕换行（复刻 DOM pre-line）', () => {
    it('短文本不换行', () => {
        const lines = wrapSubtitle(makeCtx(), '你好，欢迎', 300)
        expect(lines).toEqual(['你好，欢迎'])
    })

    it('无空格文本（中文）按字符换行', () => {
        const lines = wrapSubtitle(makeCtx(), '这是一条很长的中文弹幕字幕内容', 30)
        expect(lines).toEqual(['这是一', '条很长', '的中文', '弹幕字', '幕内容'])
    })

    it('含空格文本按词换行', () => {
        const lines = wrapSubtitle(makeCtx(), 'Hello world foo bar', 120)
        expect(lines).toEqual(['Hello world', 'foo bar'])
    })

    it('按 \n 分段保留空行', () => {
        const lines = wrapSubtitle(makeCtx(), '第一行\n\n第二行', 300)
        expect(lines).toEqual(['第一行', '', '第二行'])
    })

    it('空文本返回空数组', () => {
        expect(wrapSubtitle(makeCtx(), '', 300)).toEqual([])
    })
})
