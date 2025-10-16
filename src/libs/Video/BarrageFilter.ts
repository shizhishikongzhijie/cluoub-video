export class BarrageFilter {
    private sensitiveWords: string[]
    private userBlockedWords: string[]

    constructor() {
        // 敏感词库（实际应用中应从后端获取）
        this.sensitiveWords = [
            '广告',
            '违法',
            '色情',
            '赌博',
            '测试',
            '垃圾',
            '违法',
            '违法信息',
            '违法内容',
            '违法广告',
            '违法信息',
            '违法活动',
            '违法言论'
        ]

        // 用户屏蔽词（从localStorage获取）
        this.userBlockedWords = JSON.parse(localStorage.getItem('barrageBlockedWords') || '[]')
    }

    filter(text: string): string | null {
        // 1. 检查是否包含敏感词
        for (const word of this.sensitiveWords) {
            if (text.includes(word)) {
                return null // 过滤
            }
        }

        // 2. 检查用户屏蔽词
        for (const word of this.userBlockedWords) {
            if (text.includes(word)) {
                return null // 过滤
            }
        }

        // 3. 长度限制
        if (text.length > 20) {
            return text.substring(0, 20) + '...' // 截断
        }

        // 4. 重复内容检查（避免刷屏）
        if (this.isRepeated(text)) {
            return null // 过滤
        }

        return text
    }

    isRepeated(text: string): boolean {
        // 简单重复检测（实际应用中应更复杂）
        const now = Date.now()
        const recentBarrages = JSON.parse(localStorage.getItem('recentBarrages') || '[]')

        // 检查最近10秒内是否有相同弹幕
        const recent = recentBarrages.filter((b: any) => b.text === text && now - b.timestamp < 10000)

        if (recent.length > 2) {
            return true
        }

        // 保存最近弹幕
        recentBarrages.push({ text, timestamp: now })
        localStorage.setItem('recentBarrages', JSON.stringify(recentBarrages.slice(-20)))

        return false
    }

    addBlockedWord(word: string): void {
        this.userBlockedWords.push(word)
        localStorage.setItem('barrageBlockedWords', JSON.stringify(this.userBlockedWords))
    }
}
