import {PluginManager} from "../plugins";

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
 * 播放器组件位置枚举
 */
export enum PlayerComponentPosition {
  // 视频容器级别的位置
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  CENTER = 'CENTER',
  // 控制栏中的位置
  CONTROLS_LEFT = 'CONTROLS_LEFT',
  CONTROLS_RIGHT = 'CONTROLS_RIGHT',
  CONTROLS_CENTER = 'CONTROLS_CENTER',
}

/**
 * 播放器组件配置接口定义
 */
export interface PlayerComponentConfig {
  /** 组件ID */
  id: string;
  /** 组件内容 */
  component: React.ReactNode;
  /** 组件位置 */
  position: PlayerComponentPosition;
  /** 组件顺序 */
  order?: number;
  /** 是否绝对定位 */
  absolute?: boolean;
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
  setAPI?(api: PluginManager): void;
  /** 插件销毁方法 */
  destroy?(): void;
}

/**
 * PlayerCore接口定义，提供标准化的API接口
 */
export interface IPlayerCore {
  // 播放控制
  play(): void;
  pause(): void;
  togglePlay(): void;
  
  // 音量控制
  setMuted(muted: boolean): void;
  setVolume(volume: number): void;
  toggleMute(): void;
  
  // 进度控制
  seek(time: number): void;
  setProgress(progress: number): void;
  
  // 全屏控制
  toggleFullscreen(): void;
  
  // 字幕控制
  toggleSubtitles(): void;
  setSubtitleTrack(index: number): void;
  setShowSubtitles(show: boolean): void;
  
  // 时间相关
  setTimeUpdate(currentTime: number): void;
  setDuration(duration: number): void;
  
  // 控制栏显示
  showControls(): void;
  hideControls(): void;
  
  // 事件监听
  on(event: string, callback: Function): void;
  removeListener(event: string, callback: Function): void;
  removeAllListeners(): void;
  emit(event: string, data?: any): void;
  
  // 插件系统
  use(plugin: IPlayerPlugin, options?: any): void;
  getPlugin(pluginName: string): IPlayerPlugin | undefined;
  
  // 控制按钮注册
  registerControlButton(button: ControlButtonConfig): void;
  unregisterControlButton(buttonId: string): void;
  getControlButtons(): ControlButtonConfig[];
  
  // 组件注册
  // 获取播放器状态 (使用下面的readonly属性)
    
  // 组件注册
  registerComponent(component: PlayerComponentConfig): void;
  unregisterComponent(componentId: string): void;
  getComponents(position?: string): PlayerComponentConfig[];
  
  // 清理
  destroy(): void;
  
  // 状态获取
  readonly isPlaying: boolean;
  readonly isMuted: boolean;
  readonly volume: number;
  readonly duration: number;
  readonly currentTime: number;
  readonly progress: number;
  readonly isFullscreen: boolean;
  readonly showSubtitles: boolean;
  readonly currentTrackIndex: number;
  readonly videoSrc: string;
  readonly videoId: string;
  readonly userId: string;
  readonly username: string;
}