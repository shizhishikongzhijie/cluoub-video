/**
 * 简单的事件发射器实现，用于替代 Node.js 的 EventEmitter
 * 适用于浏览器环境
 */
export class EventEmitter {
    private events: { [key: string]: Function[] } = {}

    /**
     * 监听事件
     * @param event 事件名称
     * @param callback 回调函数
     */
    on(event: string, callback: Function) {
        if (!this.events[event]) {
            this.events[event] = []
        }
        this.events[event].push(callback)
    }

    /**
     * 移除事件监听
     * @param event 事件名称
     * @param callback 回调函数
     */
    removeListener(event: string, callback: Function) {
        if (!this.events[event]) return

        const index = this.events[event].indexOf(callback)
        if (index > -1) {
            this.events[event].splice(index, 1)
        }
    }

    /**
     * 触发事件
     * @param event 事件名称
     * @param args 参数
     */
    emit(event: string, ...args: any[]) {
        if (!this.events[event]) return

        this.events[event].forEach((callback) => {
            callback(...args)
        })
    }

    /**
     * 移除所有事件监听
     */
    removeAllListeners() {
        this.events = {}
    }
}
