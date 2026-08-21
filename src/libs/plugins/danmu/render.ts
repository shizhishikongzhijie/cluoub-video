import type { ActiveDanmu } from './engine'

export const TRACK_HEIGHT = 28 // 每条弹道高度（px）
export const SCROLL_DURATION = 8000 // 滚动弹幕穿越舞台时长（ms）
export const FIXED_DURATION = 4000 // 顶部/底部固定弹幕停留时长（ms）
export const FONT_SIZE = 20
export const FONT_FAMILY = "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif"

/** 绘制单条弹幕（滚动：按进度左移；顶部/底部：居中淡入淡出） */
export const drawDanmu = (ctx: CanvasRenderingContext2D, d: ActiveDanmu, w: number, h: number, now: number) => {
    ctx.font = `600 ${FONT_SIZE}px ${FONT_FAMILY}`
    ctx.textBaseline = 'middle'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 4
    ctx.strokeStyle = 'rgba(0,0,0,0.8)'
    ctx.fillStyle = d.color || '#fff'

    const elapsed = now - d.enterAt
    const cy =
        d.mode === 'bottom' ? h - d.track * TRACK_HEIGHT - TRACK_HEIGHT / 2 : d.track * TRACK_HEIGHT + TRACK_HEIGHT / 2

    let x = 0
    let alpha = 1
    if (d.mode === 'scroll') {
        const travel = w + d.width
        const progress = Math.min(1, elapsed / SCROLL_DURATION)
        x = w - progress * travel
        // 进入/退出淡入淡出，对齐原 CSS 动画观感
        alpha = Math.min(1, Math.min(elapsed / 200, (SCROLL_DURATION - elapsed) / 200))
    } else {
        x = w / 2
        const p = elapsed / FIXED_DURATION
        alpha = p < 0.1 ? p / 0.1 : p > 0.9 ? (1 - p) / 0.1 : 1
    }
    if (alpha <= 0) return

    ctx.globalAlpha = Math.max(0, Math.min(1, alpha))
    ctx.strokeText(d.text, x, cy)
    ctx.fillText(d.text, x, cy)
    ctx.globalAlpha = 1
}
