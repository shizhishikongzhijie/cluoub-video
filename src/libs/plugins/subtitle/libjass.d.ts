// libjass 无官方类型声明，此处提供最小 ambient 声明。
// libjass 为可选 peerDependency（仅 ASS 字幕需要），未安装时动态 import 失败由调用方兜底。
declare module 'libjass' {
    export type Ass = Record<string, unknown>

    export const ASS: {
        fromUrl: (url: string) => Promise<Ass>
    }

    export namespace renderers {
        class DefaultRenderer {
            constructor(video: HTMLVideoElement, ass: Ass, settings?: Record<string, unknown>)
            resize: () => void
            addEventListener: (type: 'ready', listener: () => void) => void
            readonly libjassSubsWrapper: HTMLDivElement
        }
    }
}
