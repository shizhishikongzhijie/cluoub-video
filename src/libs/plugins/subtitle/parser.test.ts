import { describe, expect, it } from 'vitest'

import { parseSubtitle } from './parser'

describe('parseSubtitle', () => {
    it('解析 VTT（点号时间戳）', () => {
        const vtt = `WEBVTT

00:00:01.000 --> 00:00:03.000
你好，世界

00:00:03.500 --> 00:00:06.000
第二行字幕
`
        const cues = parseSubtitle(vtt)
        expect(cues).toHaveLength(2)
        expect(cues[0]).toEqual({ start: 1, end: 3, text: '你好，世界' })
        expect(cues[1]).toEqual({ start: 3.5, end: 6, text: '第二行字幕' })
    })

    it('解析 SRT（逗号时间戳 + 序号行）', () => {
        const srt = `1
00:00:01,000 --> 00:00:03,000
Hello

2
00:00:03,500 --> 00:00:06,000
World
`
        const cues = parseSubtitle(srt)
        expect(cues).toHaveLength(2)
        // 序号行出现在 cue 起始前，会被解析器忽略，text 只含正文
        expect(cues[0]).toEqual({ start: 1, end: 3, text: 'Hello' })
    })

    it('支持 mm:ss 短格式时间戳', () => {
        const vtt = `WEBVTT

00:05.000 --> 00:08.000
短格式
`
        const cues = parseSubtitle(vtt)
        expect(cues[0].start).toBe(5)
        expect(cues[0].end).toBe(8)
    })

    it('忽略结束时间戳后的 VTT 样式设置', () => {
        const vtt = `WEBVTT

00:00:01.000 --> 00:00:03.000 line:90% align:center
带样式
`
        const cues = parseSubtitle(vtt)
        expect(cues[0]).toEqual({ start: 1, end: 3, text: '带样式' })
    })

    it('合并多行文本', () => {
        const vtt = `WEBVTT

00:00:01.000 --> 00:00:03.000
第一行
第二行
`
        const cues = parseSubtitle(vtt)
        expect(cues[0].text).toBe('第一行\n第二行')
    })

    it('末尾无空行时仍能解析最后一条 cue', () => {
        const vtt = `WEBVTT

00:00:01.000 --> 00:00:03.000
最后一条`
        const cues = parseSubtitle(vtt)
        expect(cues).toHaveLength(1)
        expect(cues[0].text).toBe('最后一条')
    })

    it('过滤时间戳非法的 cue', () => {
        const bad = `WEBVTT

abc --> def
非法时间戳
`
        const cues = parseSubtitle(bad)
        expect(cues).toHaveLength(0)
    })

    it('空文本返回空数组', () => {
        expect(parseSubtitle('')).toEqual([])
    })
})
