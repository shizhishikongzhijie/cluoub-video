/**
 * 合成捕获：把「视频帧 + 弹幕 canvas 层 + 字幕文本」一起导出为图片/GIF 帧。
 *
 * 采用与主流播放器（B站 / DPlayer）一致的方案：不做任何 DOM 序列化（无 foreignObject），
 * 直接在目标 canvas 上按图层顺序原生绘制：
 *   1) 黑色底图 + <video> 当前帧（object-fit:contain 语义）；
 *   2) 逐层 drawImage 覆盖各插件注册的 canvas 图层（如弹幕），按 canvas 在容器内的
 *      相对坐标叠加，保证与屏幕布局对齐；
 *   3) 按字幕样式用 fillText 绘制当前字幕文本（VTT/SRT）。
 *
 * 跨域视频未配置 CORS 时视频帧绘制本身就会污染 canvas，此时 toDataURL 抛 SecurityError，
 * 由调用方捕获后返回 null（与「仅捕获视频帧」行为一致）。
 */

import { DEFAULT_SUBTITLE_STYLES, type SubtitleStyles } from '../core/types'

/** 与 DOM 字幕层的 bottom: 60px 对齐的离底距离（px） */
const SUBTITLE_BOTTOM = 60
const SUBTITLE_FONT_FAMILY = "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif"
/** 行高倍数：与 DOM 字幕层 .cue 的 line-height 对齐（styles.module.scss 中固定为 1.2） */
const SUBTITLE_LINE_HEIGHT = 1.2

export interface CompositeCaptureOptions {
    /** 各插件注册的 canvas 捕获层（如弹幕），按容器内坐标逐层叠加 */
    captureLayers?: { getCanvas: () => HTMLCanvasElement | null }[]
    /** 当前字幕文本与样式；缺省/空文本时不绘制字幕 */
    subtitle?: { text: string; styles?: SubtitleStyles } | null
}

/**
 * 把字幕文本按可用宽度换行成多行（按 \n 分段；含空格按词换行，无空格按字符换行适配中文）。
 * 复刻 DOM 字幕层 white-space: pre-line 的自动换行行为。
 */
export const wrapSubtitle = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    if (!text) return []
    const out: string[] = []
    for (const para of text.split('\n')) {
        if (!para) {
            out.push('')
            continue
        }
        if (ctx.measureText(para).width <= maxWidth) {
            out.push(para)
            continue
        }
        if (para.includes(' ')) {
            // 含空格：按词换行
            let line = ''
            for (const word of para.split(' ')) {
                const next = line ? `${line} ${word}` : word
                if (line && ctx.measureText(next).width > maxWidth) {
                    out.push(line)
                    line = word
                } else {
                    line = next
                }
            }
            if (line) out.push(line)
        } else {
            // 无空格（中文）：按字符换行
            let line = ''
            for (const ch of para) {
                const next = line + ch
                if (line && ctx.measureText(next).width > maxWidth) {
                    out.push(line)
                    line = ch
                } else {
                    line = next
                }
            }
            if (line) out.push(line)
        }
    }
    return out
}

/** 按字幕样式在画布底部绘制字幕文本（背景框 + 描边 + 文字，复刻 DOM 字幕层外观） */
const drawSubtitle = (
    ctx: CanvasRenderingContext2D,
    text: string,
    styles: SubtitleStyles | undefined,
    w: number,
    h: number
) => {
    const s = styles ?? DEFAULT_SUBTITLE_STYLES
    const fontSize = s.fontSize
    const lineHeight = Math.ceil(fontSize * SUBTITLE_LINE_HEIGHT)
    const padX = 4
    const padY = 2
    // 与 DOM .subtitleLayer 一致：可换行宽度为容器整宽（去掉极小边距）
    const maxWidth = Math.max(100, w - 2)

    ctx.font = `${s.isBold ? 'bold ' : ''}${fontSize}px ${SUBTITLE_FONT_FAMILY}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const lines = wrapSubtitle(ctx, text, maxWidth)
    const maxLineWidth = Math.max(...lines.map((l) => ctx.measureText(l).width))
    const boxH = lines.length * lineHeight + padY * 2
    // 与 DOM 对齐：背景框底边距容器底部 SUBTITLE_BOTTOM
    const boxTop = h - SUBTITLE_BOTTOM - boxH
    const boxW = maxLineWidth + padX * 2
    const bx = w / 2 - boxW / 2
    const cx = w / 2

    // 半透明背景框（对应 DOM 的 rgba(0,0,0,0.5) + padding + 圆角，随整体透明度）
    ctx.fillStyle = `rgba(0,0,0,${0.5 * s.opacity})`
    if (
        typeof (ctx as CanvasRenderingContext2D & { roundRect?: (...args: number[]) => void }).roundRect === 'function'
    ) {
        ctx.beginPath()
        ;(ctx as CanvasRenderingContext2D & { roundRect: (...args: number[]) => void }).roundRect(
            bx,
            boxTop,
            boxW,
            boxH,
            4
        )
        ctx.fill()
    } else {
        ctx.fillRect(bx, boxTop, boxW, boxH)
    }

    // 描边（对应 DOM 的 text-shadow，透明度随整体）
    const lineCenterY = (i: number) => boxTop + padY + lineHeight * i + lineHeight / 2
    if (s.isOutline) {
        ctx.strokeStyle = `rgba(0,0,0,${0.8 * s.opacity})`
        ctx.lineWidth = 2
        for (let i = 0; i < lines.length; i++) ctx.strokeText(lines[i], cx, lineCenterY(i))
    }
    ctx.globalAlpha = s.opacity
    ctx.fillStyle = s.color
    for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], cx, lineCenterY(i))
    ctx.globalAlpha = 1
}

/**
 * 合成捕获播放器容器，返回 canvas（视频帧已绘制、弹幕层与字幕已叠加）。
 * 容器未就绪 / 无可见区域 / 绘制失败时返回 null。
 */
export const captureContainerComposite = (
    root: HTMLElement | null | undefined,
    video: HTMLVideoElement,
    options: CompositeCaptureOptions = {}
): HTMLCanvasElement | null => {
    if (!root) return null
    const rect = root.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width))
    const h = Math.max(1, Math.round(rect.height))
    if (w <= 1 || h <= 1) return null

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // 1) 黑色底图 + 视频帧（object-fit:contain 语义）
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    if (video.videoWidth && video.videoHeight) {
        const scale = Math.min(w / video.videoWidth, h / video.videoHeight)
        const dw = video.videoWidth * scale
        const dh = video.videoHeight * scale
        ctx.drawImage(video, (w - dw) / 2, (h - dh) / 2, dw, dh)
    }

    // 2) 字幕文本（VTT/SRT）—— 与 DOM z 序一致（字幕 z-index 5 在弹幕层 8 之下）
    if (options.subtitle?.text) {
        drawSubtitle(ctx, options.subtitle.text, options.subtitle.styles, w, h)
    }

    // 3) 逐层叠加插件注册的 canvas 捕获层（按容器内坐标对齐屏幕布局，如弹幕盖在字幕上）
    for (const layer of options.captureLayers ?? []) {
        const el = layer.getCanvas?.()
        if (!el || el.width === 0 || el.height === 0) continue
        const r = el.getBoundingClientRect()
        if (r.width <= 0 || r.height <= 0) continue
        ctx.drawImage(el, r.left - rect.left, r.top - rect.top, r.width, r.height)
    }

    return canvas
}
