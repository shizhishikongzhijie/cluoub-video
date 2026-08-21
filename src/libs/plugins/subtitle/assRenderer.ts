// libjass 渲染所需的全局样式子集（libjass 未随包提供 CSS 产物，这里按需注入，
// 避免要求使用方额外引入 libjass.css；动画/对齐等关键规则均来自官方样式表）
const LIBJASS_CSS = `
.libjass-wrapper{position:relative;overflow:hidden}
.libjass-subs{position:absolute;overflow:hidden;pointer-events:none;line-height:0}
.libjass-subs *{pointer-events:none;-webkit-animation-fill-mode:both !important;animation-fill-mode:both !important}
.libjass-subs.paused *{-webkit-animation-play-state:paused !important;animation-play-state:paused !important}
.libjass-subs .an{position:absolute}
.libjass-subs .an1,.libjass-subs .an2,.libjass-subs .an3{bottom:0}
.libjass-subs .an4,.libjass-subs .an5,.libjass-subs .an6{display:table;width:100%;height:100%}
.libjass-subs .an4>*,.libjass-subs .an5>*,.libjass-subs .an6>*{display:table-cell;vertical-align:middle}
.libjass-subs .an7,.libjass-subs .an8,.libjass-subs .an9{top:0}
.libjass-subs .an1,.libjass-subs .an4,.libjass-subs .an7{text-align:left}
.libjass-subs .an2,.libjass-subs .an5,.libjass-subs .an8{text-align:center}
.libjass-subs .an3,.libjass-subs .an6,.libjass-subs .an9{text-align:right}
.libjass-subs div[data-dialogue-id]>span{-webkit-perspective-origin:center;-webkit-perspective:400px;perspective-origin:center;perspective:400px}
.libjass-font-measure{position:absolute;visibility:hidden;border:0;margin:0;padding:0;line-height:normal}
.libjass-filters{display:block}
`

let cssInjected = false
const ensureCss = () => {
    if (cssInjected || typeof document === 'undefined') return
    cssInjected = true
    const style = document.createElement('style')
    style.id = 'cluoub-libjass-css'
    style.textContent = LIBJASS_CSS
    document.head.appendChild(style)
}

export interface AssRendererHandle {
    /** 隐藏字幕（仅隐藏字幕层，不影响视频） */
    pause: () => void
    /** 恢复显示字幕 */
    resume: () => void
    /** 按当前视频/容器尺寸重新布局（容器尺寸变化（全屏/屏幕模式/窗口缩放）后调用） */
    resize: () => void
    /** 销毁：解除 libjass 对 <video> 的包裹并移除监听 */
    dispose: () => void
}

/**
 * 用 libjass 完整渲染 ASS 字幕。
 * libjass 为可选依赖，调用方需捕获动态 import 失败（未安装 libjass）或解析失败。
 * 渲染器以 DefaultRenderer 包裹 <video>（在容器中顶替其位置），
 * 内部用 VideoClock 随 video 播放自动同步时间轴。
 */
export const createAssRenderer = async (video: HTMLVideoElement, src: string): Promise<AssRendererHandle> => {
    const mod = await import('libjass')
    const subtitles = await mod.ASS.fromUrl(src)
    const renderer = new mod.renderers.DefaultRenderer(video, subtitles)
    ensureCss()

    const wrapper = renderer.libjassSubsWrapper
    // wrapper 顶替 <video> 位于容器中，需与 video 同尺寸，避免高度塌陷
    wrapper.style.width = '100%'
    wrapper.style.height = '100%'

    const onResize = () => {
        try {
            renderer.resize()
        } catch {
            // 元数据未就绪时忽略，'ready' 事件会再次触发
        }
    }
    renderer.addEventListener('ready', onResize)
    window.addEventListener('resize', onResize)
    document.addEventListener('fullscreenchange', onResize)

    const getSubsEl = () => wrapper.querySelector<HTMLElement>('.libjass-subs')

    return {
        pause: () => {
            const el = getSubsEl()
            if (el) el.style.display = 'none'
        },
        resume: () => {
            const el = getSubsEl()
            if (el) el.style.display = ''
            onResize()
        },
        resize: () => {
            onResize()
        },
        dispose: () => {
            window.removeEventListener('resize', onResize)
            document.removeEventListener('fullscreenchange', onResize)
            const parent = wrapper.parentElement
            if (parent) {
                parent.insertBefore(video, wrapper)
                wrapper.remove()
            }
        }
    }
}
