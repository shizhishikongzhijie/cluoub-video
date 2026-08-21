import { describe, expect, it } from 'vitest'

import { encodeGif, type GifFrame } from './gif'

const solidFrame = (r: number, g: number, b: number): GifFrame => {
    const data = new Uint8Array(2 * 2 * 4)
    for (let i = 0; i < data.length; i += 4) {
        data[i] = r
        data[i + 1] = g
        data[i + 2] = b
        data[i + 3] = 255
    }
    return { data, width: 2, height: 2 }
}

describe('encodeGif', () => {
    it('将多帧 RGBA 编码为合法 GIF 字节流', () => {
        const frames = [solidFrame(255, 0, 0), solidFrame(0, 255, 0), solidFrame(0, 0, 255)]
        const bytes = encodeGif(frames, 10)
        expect(bytes).toBeInstanceOf(Uint8Array)
        const header = new TextDecoder().decode(bytes.slice(0, 6))
        expect(header).toBe('GIF89a')
        expect(bytes.length).toBeGreaterThan(30)
    })

    it('帧不足时仍可编码（单帧）', () => {
        const bytes = encodeGif([solidFrame(10, 20, 30)], 5)
        expect(new TextDecoder().decode(bytes.slice(0, 6))).toBe('GIF89a')
    })
})
