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

/**
 * Player插件接口定义
 */
export interface IPlayerPlugin {
  name: string;
  install(player: IPlayerCore, options?: any): void;
  destroy?(): void;
}