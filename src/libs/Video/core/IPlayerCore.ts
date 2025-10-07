/**
 * 控制按钮配置接口定义
 */
export interface ControlButtonConfig {
    /** 按钮ID */
    id: string;
    /** 按钮图标 */
    icon?: React.ReactNode;
    /** 按钮位置：left(播放按钮右边)、right(进度拖动条右边) */
    position: 'left' | 'right';
    /** 按钮标题 */
    title?: string;
    /** 按钮顺序 */
    order?: number;
    /** 自定义按钮组件，如果提供则使用自定义组件 */
    customComponent?: React.ReactNode;
    /** 点击事件处理函数 */
    onClick?: () => void;
}

/**
 * 播放器组件配置接口定义
 */
export interface PlayerComponentConfig {
    /** 组件ID */
    id: string;
    /** 组件内容 */
    component: React.ReactNode;
    /** 组件顺序 */
    order?: number;
    /** 是否绝对定位 */
    absolute?: boolean;
}

/**
 * 播放器插件API接口定义
 * 为插件提供与播放器核心交互的标准接口
 */
export interface IPlayerPluginApi {
    /** 播放器核心实例，提供完整的播放器控制功能 */
    player: IPlayerCore,

    /**
     * 注册控制按钮
     * @param button 控制按钮配置对象
     */
    registerControlButton: IPlayerCore['registerControlButton'],

    /**
     * 注销控制按钮
     * @param buttonId 要注销的按钮ID
     */
    unregisterControlButton: IPlayerCore['unregisterControlButton'],

    /**
     * 注册播放器组件
     * @param component 组件配置对象
     */
    registerComponent: IPlayerCore['registerComponent'],

    /**
     * 注销播放器组件
     * @param componentId 要注销的组件ID
     */
    unregisterComponent: IPlayerCore['unregisterComponent'],

    /**
     * 获取播放器当前状态信息
     * @returns 包含播放器各种状态的对象
     */
    getPlayerState: () => ({
        /** 是否正在播放 */
        isPlaying: IPlayerCore['isPlaying'],
        /** 当前播放时间 */
        currentTime: IPlayerCore['currentTime'],
        /** 视频总时长 */
        duration: IPlayerCore['duration'],
        /** 当前音量 */
        volume: IPlayerCore['volume'],
        /** 是否静音 */
        isMuted: IPlayerCore['isMuted'],
        /** 是否全屏 */
        isFullscreen: IPlayerCore['isFullscreen'],
        /** 播放进度百分比 */
        progress: IPlayerCore['progress'];
        /** 是否显示字幕 */
        showSubtitles: IPlayerCore['showSubtitles'];
        /** 当前字幕轨道索引 */
        currentTrackIndex: IPlayerCore['currentTrackIndex'];
        /** 视频源地址 */
        videoSrc: IPlayerCore['videoSrc'];
        /** 视频ID */
        videoId: IPlayerCore['videoId'];
        /** 用户ID */
        userId: IPlayerCore['userId'];
        /** 用户名 */
        username: IPlayerCore['username'];
    })
}


/**
 * 播放器插件接口定义
 */
export interface IPlayerPlugin {
    /** 插件名称 */
    name: string;

    /** 插件安装方法 */
    install(player: IPlayerCore, options?: any): void;

    /**
     * 接收插件API（可选）
     * @param api 插件API对象
     */
    setAPI?(api: IPlayerPluginApi): void;

    /** 插件销毁方法 */
    destroy?(): void;
}

/**
 * PlayerCore接口定义，提供标准化的API接口
 */
export interface IPlayerCore {
  // 播放控制
  /** 开始播放视频 */
  play(): void;
  /** 暂停视频播放 */
  pause(): void;
  /** 切换播放/暂停状态 */
  togglePlay(): void;

  // 音量控制
  /** 设置静音状态 */
  setMuted(muted: boolean): void;
  /** 设置音量大小 */
  setVolume(volume: number): void;
  /** 切换静音状态 */
  toggleMute(): void;

  // 进度控制
  /** 跳转到指定时间 */
  seek(time: number): void;
  /** 设置播放进度 */
  setProgress(progress: number): void;

  // 全屏控制
  /** 切换全屏状态 */
  toggleFullscreen(): void;

  // 字幕控制
  /** 切换字幕显示状态 */
  toggleSubtitles(): void;
  /** 设置字幕轨道 */
  setSubtitleTrack(index: number): void;
  /** 设置字幕显示开关 */
  setShowSubtitles(show: boolean): void;

  // 时间相关
  /** 更新当前播放时间 */
  setTimeUpdate(currentTime: number): void;
  /** 设置视频总时长 */
  setDuration(duration: number): void;

  // 控制栏显示
  /** 显示控制栏 */
  showControls(): void;
  /** 隐藏控制栏 */
  hideControls(): void;

  // 事件监听
  /** 监听事件 */
  on(event: string, callback: Function): void;
  /** 移除事件监听器 */
  removeListener(event: string, callback: Function): void;
  /** 移除所有事件监听器 */
  removeAllListeners(): void;
  /** 触发事件 */
  emit(event: string, data?: any): void;

  // 插件系统
  /** 使用插件 */
  use(plugin: IPlayerPlugin, options?: any): void;
  /** 获取插件实例 */
  getPlugin(pluginName: string): IPlayerPlugin | undefined;

  // 控制按钮注册
  /** 注册控制按钮 */
  registerControlButton(button: ControlButtonConfig): void;
  /** 注销控制按钮 */
  unregisterControlButton(buttonId: string): void;
  /** 获取所有控制按钮 */
  getControlButtons(): ControlButtonConfig[];

  // 组件注册
  // 获取播放器状态 (使用下面的readonly属性)

  // 组件注册
  /** 注册播放器组件 */
  registerComponent(component: PlayerComponentConfig): void;
  /** 注销播放器组件 */
  unregisterComponent(componentId: string): void;
  /** 获取注册的组件 */
  getComponents(position?: string): PlayerComponentConfig[];

  // 清理
  /** 销毁播放器 */
  destroy(): void;

  // 状态获取
  /** 是否正在播放 */
  readonly isPlaying: boolean;
  /** 是否静音 */
  readonly isMuted: boolean;
  /** 当前音量 */
  readonly volume: number;
  /** 视频总时长 */
  readonly duration: number;
  /** 当前播放时间 */
  readonly currentTime: number;
  /** 播放进度百分比 */
  readonly progress: number;
  /** 是否全屏 */
  readonly isFullscreen: boolean;
  /** 是否显示字幕 */
  readonly showSubtitles: boolean;
  /** 当前字幕轨道索引 */
  readonly currentTrackIndex: number;
  /** 视频源地址 */
  readonly videoSrc: string;
  /** 视频ID */
  readonly videoId: string;
  /** 用户ID */
  readonly userId: string;
  /** 用户名 */
  readonly username: string;
}
