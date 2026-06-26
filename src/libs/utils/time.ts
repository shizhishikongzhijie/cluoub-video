/**
 * 将秒数格式化为 mm:ss 或 hh:mm:ss（时长超过 1 小时时自动带上小时）。
 */
export const formatTime = (time: number): string => {
    if (!time || isNaN(time) || time < 0) return '00:00'

    const totalSeconds = Math.floor(time)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)

    if (hours > 0) {
        return `${hours}:${pad(minutes)}:${pad(seconds)}`
    }
    return `${pad(minutes)}:${pad(seconds)}`
}
