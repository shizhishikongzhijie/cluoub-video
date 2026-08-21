// gifenc 无官方类型声明，此处提供最小 ambient 声明。
// 运行时为常规依赖（非 peerDependency），类型以 gifenc 实际 API 为准。
declare module 'gifenc' {
    export interface GIFEncoderInstance {
        writeFrame: (
            index: Uint8Array,
            width: number,
            height: number,
            opts: { palette: Uint32Array; delay?: number; repeat?: number; transparent?: boolean }
        ) => void
        finish: () => void
        bytes: () => Uint8Array
    }

    export function GIFEncoder(opts?: { auto?: boolean }): GIFEncoderInstance
    export function quantize(rgba: Uint8Array, maxColors: number): Uint32Array
    export function applyPalette(rgba: Uint8Array, palette: Uint32Array, format?: 'rgb565' | 'rgba4444'): Uint8Array
}
