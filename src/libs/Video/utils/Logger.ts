/**
 * 日志级别枚举
 */
export enum LogLevel {
    NONE = 0,
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4
}

/**
 * 日志管理器类
 */
class Logger {
    private static instance: Logger
    private logLevel: LogLevel = LogLevel.INFO
    private componentName: string = 'VideoPlayer'

    private constructor() {}

    /**
     * 获取Logger实例
     * @returns Logger实例
     */
    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger()
        }
        return Logger.instance
    }

    /**
     * 设置日志级别
     * @param level 日志级别
     */
    setLogLevel(level: LogLevel): void {
        this.logLevel = level
    }

    /**
     * 设置是否为调试模式
     * @param isDebug 是否为调试模式
     */
    setDebugMode(isDebug: boolean): void {
        this.logLevel = isDebug ? LogLevel.DEBUG : LogLevel.INFO
    }

    /**
     * 设置组件名称
     * @param name 组件名称
     */
    setComponentName(name: string): void {
        this.componentName = name
    }

    /**
     * 输出调试日志
     * @param message 日志消息
     * @param optionalParams 可选参数
     */
    debug(message: string, ...optionalParams: any[]): void {
        if (this.logLevel >= LogLevel.DEBUG) {
            console.debug(`[${this.componentName}] DEBUG: ${message}`, ...optionalParams)
        }
    }

    /**
     * 输出信息日志
     * @param message 日志消息
     * @param optionalParams 可选参数
     */
    info(message: string, ...optionalParams: any[]): void {
        if (this.logLevel >= LogLevel.INFO) {
            console.info(`[${this.componentName}] INFO: ${message}`, ...optionalParams)
        }
    }

    /**
     * 输出警告日志
     * @param message 日志消息
     * @param optionalParams 可选参数
     */
    warn(message: string, ...optionalParams: any[]): void {
        if (this.logLevel >= LogLevel.WARN) {
            console.warn(`[${this.componentName}] WARN: ${message}`, ...optionalParams)
        }
    }

    /**
     * 输出错误日志
     * @param message 日志消息
     * @param optionalParams 可选参数
     */
    error(message: string, ...optionalParams: any[]): void {
        if (this.logLevel >= LogLevel.ERROR) {
            console.error(`[${this.componentName}] ERROR: ${message}`, ...optionalParams)
        }
    }

    /**
     * 输出初始化成功日志
     * @param message 初始化消息
     */
    initSuccess(message: string = '组件初始化成功'): void {
        // 初始化成功信息始终显示，不受日志级别影响
        console.info(`[${this.componentName}] ${message}`)
    }
}

export default Logger
