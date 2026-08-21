import { applyPalette, GIFEncoder, quantize } from 'gifenc'

export interface GifFrame {
    /** RGBA 像素数据（width * height * 4） */
    data: Uint8Array
    width: number
    height: number
}

/** 将一组 RGBA 帧编码为 GIF 字节（gifenc 打包，调用方负责下载/预览） */
export const encodeGif = (frames: GifFrame[], fps: number): Uint8Array => {
    const gif = GIFEncoder()
    const delay = Math.max(1, Math.round(1000 / fps))
    for (const frame of frames) {
        const palette = quantize(frame.data, 256)
        const index = applyPalette(frame.data, palette)
        gif.writeFrame(index, frame.width, frame.height, { palette, delay })
    }
    gif.finish()
    return gif.bytes()
}
