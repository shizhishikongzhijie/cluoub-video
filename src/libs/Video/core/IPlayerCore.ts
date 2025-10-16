/**
 * 控制按钮配置接口定义
 */
export interface ControlButtonConfig {
    /** 按钮ID */
    id: string
    /** 按钮图标 */
    icon?: React.ReactNode
    /** 按钮位置：left(播放按钮右边)、right(进度拖动条右边) */
    position: 'left' | 'right'
    /** 按钮标题 */
    title?: string
    /** 按钮顺序 */
    order?: number
    /** 自定义按钮组件，如果提供则使用自定义组件 */
    customComponent?: React.ReactNode
    /** 点击事件处理函数 */
    onClick?: () => void
}
export enum PlayerComponentConfigType {
    COVER = 'cover',
    NO_CONTROL_BOTTOM = 'no_control_bottom'
}
/**
 * 播放器组件配置接口定义
 */
export interface PlayerComponentConfig {
    /** 组件ID */
    id: string
    /** 组件内容 */
    component: React.ReactNode
    /** 组件类型 */
    type: PlayerComponentConfigType
    /** 组件顺序 */
    order?: number
    /** 是否绝对定位 */
    absolute?: boolean
}

/**
 * 播放器插件API接口定义
 * 为插件提供与播放器核心交互的标准接口
 */
export interface IPlayerPluginApi {
    /** 播放器核心实例，提供完整的播放器控制功能 */
    player: IPlayerCore

    /**
     * 注册控制按钮
     * @param button 控制按钮配置对象
     */
    registerControlButton: IPlayerCore['registerControlButton']

    /**
     * 更新控制按钮
     * @param buttonId 要更新的按钮ID
     * @param newButton 新的按钮配置对象
     */
    updateControlButton: (buttonId: string, newButton: Partial<ControlButtonConfig>) => void

    /**
     * 注销控制按钮
     * @param buttonId 要注销的按钮ID
     */
    unregisterControlButton: IPlayerCore['unregisterControlButton']

    /**
     * 注册播放器组件
     * @param component 组件配置对象
     */
    registerComponent: IPlayerCore['registerComponent']

    /**
     * 更新播放器组件
     * @param componentId 要更新的组件ID
     * @param newComponent 新的组件配置对象
     */
    updateComponent: (componentId: string, newComponent: Partial<PlayerComponentConfig>) => void

    /**
     * 注销播放器组件
     * @param componentId 要注销的组件ID
     */
    unregisterComponent: IPlayerCore['unregisterComponent']

    /**
     * 获取播放器当前状态信息
     * @returns 包含播放器各种状态的对象
     */
    getPlayerState: () => {
        /** 是否正在播放 */
        isPlaying: IPlayerCore['isPlaying']
        /** 当前播放时间 */
        currentTime: IPlayerCore['currentTime']
        /** 视频总时长 */
        duration: IPlayerCore['duration']
        /** 当前音量 */
        volume: IPlayerCore['volume']
        /** 是否静音 */
        isMuted: IPlayerCore['isMuted']
        /** 是否全屏 */
        isFullscreen: IPlayerCore['isFullscreen']
        /** 播放进度百分比 */
        progress: IPlayerCore['progress']
        /** 是否显示字幕 */
        showSubtitles: IPlayerCore['showSubtitles']
        /** 当前字幕轨道索引 */
        currentTrackIndex: IPlayerCore['currentTrackIndex']
        /** 视频源地址 */
        videoSrc: IPlayerCore['videoSrc']
        /** 视频ID */
        videoId: IPlayerCore['videoId']
        /** 用户ID */
        userId: IPlayerCore['userId']
        /** 用户名 */
        username: IPlayerCore['username']
    }
}

/**
 * 播放器插件接口定义
 */
export interface IPlayerPlugin {
    /** 插件名称 */
    name: string

    /** 插件安装方法 */
    install(player: IPlayerCore, options?: any): void

    /**
     * 接收插件API（可选）
     * @param api 插件API对象
     */
    setAPI?(api: IPlayerPluginApi): void

    /** 插件销毁方法 */
    destroy?(): void
}

/**
 * PlayerCore接口定义
 * 定义播放器核心需要实现的方法和属性
 */

export interface IPlayerCore {
    // 状态属性
    readonly isPlaying: boolean
    readonly duration: number
    readonly quality: string
    readonly speed: number
    readonly availableQualities: { key: string; label: string }[]
    readonly videoSrc: string | { [key: string]: string }
    readonly videoType: string
    readonly isMuted: boolean
    readonly volume: number
    readonly currentTime: number
    readonly progress: number
    readonly isFullscreen: boolean
    readonly showSubtitles: boolean
    readonly currentTrackIndex: number
    readonly videoId: string
    readonly userId: string
    readonly username: string
    readonly dataPrefix: string

    pause(): void

    togglePlay(): void

    // 音量控制
    setVolume(volume: number): void

    toggleMute(): void

    // 全屏控制
    toggleFullscreen(): void

    // 字幕控制
    toggleSubtitles(): void

    setSubtitleTrack(index: number): void

    setShowSubtitles(show: boolean): void

    // 时间相关
    setTimeUpdate(currentTime: number): void

    setDuration(duration: number): void

    // 控制栏显示
    showControls(): void

    hideControls(): void

    // 插件系统
    use(plugin: IPlayerPlugin, options?: any): void

    getPlugin(pluginName: string): IPlayerPlugin | undefined

    // 控制按钮注册
    registerControlButton(button: ControlButtonConfig): void

    unregisterControlButton(buttonId: string): void

    getControlButtons(): ControlButtonConfig[]

    // 组件注册
    registerComponent(component: PlayerComponentConfig): void

    unregisterComponent(componentId: string): void

    getComponents(): PlayerComponentConfig[]

    updateComponent(componentId: string, newComponent: Partial<PlayerComponentConfig>): void

    // 事件监听
    on(event: string, listener: (...args: any[]) => void): void

    // 基本播放控制
    play(): void

    seek(time: number): void

    setMuted(muted: boolean): void

    // 画质控制
    setQuality(quality: string): void

    // 倍速控制
    setSpeed(speed: number): void

    setProgress(progress: number): void

    updateControlButton(buttonId: string, newButton: Partial<ControlButtonConfig>): void

    removeListener(event: string, listener: (...args: any[]) => void): void

    removeAllListeners(): void

    emit(event: string, ...args: any[]): void

    // 生命周期
    destroy(): void
}

/**
 * 控制按钮配置接口
 */
export interface ControlButtonConfig {
    /** 按钮唯一标识符 */
    id: string

    /** 按钮图标 */
    icon?: React.ReactNode

    /** 按钮标题/提示文字 */
    title?: string

    /** 按钮点击事件处理函数 */
    onClick?: () => void

    /** 按钮位置 */
    position: 'left' | 'right'

    /** 按钮排序 */
    order?: number

    /** 自定义组件（可选，如果提供将替代默认按钮） */
    customComponent?: React.ReactNode
}

/**
 * 播放器组件配置接口
 */
export interface PlayerComponentConfig {
    /** 组件唯一标识符 */
    id: string

    /** 组件类型 */
    type: string

    /** 组件内容 */
    component: React.ReactNode

    /** 组件排序 */
    order?: number
}

/**
 * 插件接口定义
 */
export interface IPlayerPlugin {
    /** 插件名称 */
    name: string

    /** 插件安装方法 */
    install(core: IPlayerCore, options?: any): void

    /** 插件卸载方法 */
    uninstall?(): void
}
