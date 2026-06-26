export interface DanmuItem {
    /** 出现时间（秒） */
    time: number
    /** 文本内容 */
    text: string
    /** 颜色，默认白色 */
    color?: string
    /** 模式：滚动 / 顶部 / 底部 */
    mode?: 'scroll' | 'top' | 'bottom'
}

/** 运行时的活动弹幕，附带渲染所需的运行态字段 */
export interface ActiveDanmu extends DanmuItem {
    id: number
    /** 分配到的弹道索引 */
    track: number
    /** 进入舞台的时间戳（performance.now，毫秒） */
    enterAt: number
    /** 估算文本宽度（px），用于碰撞检测 */
    width: number
}

export interface AllocateContext {
    /** 弹道数量 */
    trackCount: number
    /** 舞台宽度（px） */
    stageWidth: number
    /** 滚动弹幕穿越舞台的时长（毫秒） */
    duration: number
    /** 当前时间戳（performance.now，毫秒） */
    now: number
}

/**
 * 为一条滚动弹幕分配弹道，避免与同弹道仍在运行的弹幕重叠（碰撞检测）。
 *
 * 判定逻辑：对每条弹道取最后一条已存在的滚动弹幕，
 * 1) 该弹幕右边缘尚未完全进入舞台（still entering）会追尾 → 跳过；
 * 2) 按匀速运动估算新弹幕是否会在到达右边界前追上前者 → 会追上则跳过。
 * 找不到安全弹道时返回 -1（调用方可丢弃或强制复用）。
 */
export const allocateTrack = (existing: ActiveDanmu[], ctx: AllocateContext, newWidth: number): number => {
    const { trackCount, stageWidth, duration, now } = ctx

    for (let track = 0; track < trackCount; track++) {
        const last = lastOnTrack(existing, track)
        if (!last) return track

        if (isSafe(last, newWidth, now, stageWidth, duration)) {
            return track
        }
    }
    return -1
}

/** 取某弹道上 enterAt 最新的滚动弹幕 */
const lastOnTrack = (existing: ActiveDanmu[], track: number): ActiveDanmu | null => {
    let result: ActiveDanmu | null = null
    for (const d of existing) {
        if (d.mode && d.mode !== 'scroll') continue
        if (d.track !== track) continue
        if (!result || d.enterAt > result.enterAt) result = d
    }
    return result
}

/**
 * 判断在某弹道追加一条新弹幕是否安全（不会与 last 重叠）。
 */
const isSafe = (last: ActiveDanmu, newWidth: number, now: number, stageWidth: number, duration: number): boolean => {
    const speed = (stageWidth + last.width) / duration // px/ms，按总行程算速度
    const elapsed = now - last.enterAt
    // 前一条弹幕右边缘当前位置（从右侧 stageWidth 处向左移动）
    const lastRight = stageWidth - speed * elapsed
    // 1) 前一条尾部还没完全进入舞台 → 追尾
    if (lastRight > stageWidth - last.width) return false

    // 2) 速度相同，新弹幕从 stageWidth 出发，需保证在前者离开前不会追上
    const newSpeed = (stageWidth + newWidth) / duration
    if (newSpeed <= speed) return true // 新的不快于旧的，永不追上

    // 新弹幕头部追上旧弹幕尾部所需时间
    const gap = stageWidth - lastRight
    const catchUpTime = gap / (newSpeed - speed)
    // 旧弹幕离开舞台（尾部到达左边界）的剩余时间
    const lastLeaveTime = (lastRight + last.width) / speed
    return catchUpTime > lastLeaveTime
}

/** 估算文本像素宽度（无 DOM 环境的近似：按字号 * 字符数，中文按 1，西文按 0.6） */
export const estimateWidth = (text: string, fontSize: number): number => {
    let units = 0
    for (const ch of text) {
        // 单字节字符（码点 <= 0xff，含 ASCII 与西文）按 0.6，其余（中文等）按 1
        units += ch.charCodeAt(0) <= 0xff ? 0.6 : 1
    }
    return Math.ceil(units * fontSize)
}
