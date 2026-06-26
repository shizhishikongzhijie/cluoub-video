export interface SubtitleCue {
    start: number
    end: number
    text: string
}

/**
 * 将时间戳字符串解析为秒数。
 * 同时支持 VTT 的点号分隔（00:00:05.000 / 00:05.000）
 * 与 SRT 的逗号分隔（00:00:05,000）。
 */
const parseTimestamp = (raw: string): number => {
    const trimmed = raw.trim().replace(',', '.')
    const parts = trimmed.split(':').map(parseFloat)

    if (parts.some(isNaN)) return NaN

    // 支持 hh:mm:ss 与 mm:ss 两种格式
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1]
    }
    return parts[0] || 0
}

/**
 * 解析 VTT / SRT 文本为字幕 cue 列表。
 * 二者结构高度一致，差异仅在时间戳分隔符与可选的序号行，统一处理。
 */
export const parseSubtitle = (text: string): SubtitleCue[] => {
    const lines = text.split(/\r?\n/)
    const cues: SubtitleCue[] = []
    let current: SubtitleCue | null = null

    lines.forEach((line) => {
        if (line.includes('-->')) {
            const [startRaw, endRaw] = line.split('-->')
            const start = parseTimestamp(startRaw)
            // 结束时间可能带有 VTT 的样式设置（如 "00:05.000 line:90%"），仅取首段
            const end = parseTimestamp(endRaw.trim().split(/\s+/)[0])
            current = { start, end, text: '' }
        } else if (current && line.trim()) {
            current.text += (current.text ? '\n' : '') + line
        } else if (!line.trim() && current) {
            cues.push(current)
            current = null
        }
    })

    if (current) cues.push(current)

    // 过滤掉时间戳解析失败的无效 cue
    return cues.filter((c) => !isNaN(c.start) && !isNaN(c.end))
}

/**
 * 拉取并解析字幕文件。
 */
export const fetchSubtitle = async (url: string): Promise<SubtitleCue[]> => {
    const text = await fetch(url).then((r) => r.text())
    return parseSubtitle(text)
}
