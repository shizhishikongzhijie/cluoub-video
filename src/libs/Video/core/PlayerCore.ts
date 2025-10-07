import {Barrage} from '../Video.types';
import {WebSocketManager} from '../WebSocketManager';
import {v4 as uuidv4} from 'uuid';
import {EventEmitter} from './EventEmitter';
import {IPlayerCore, IPlayerPlugin} from './IPlayerCore';
import {PluginManager} from '../plugins/PluginManager';

/**
 * 播放器核心类，负责管理播放器状态和逻辑
 * 与UI组件解耦，提供统一的事件接口
 * 实现标准化API接口和插件化架构
 */
export class PlayerCore extends EventEmitter implements IPlayerCore {
  // 视频相关状态
  private _isPlaying: boolean = false;
  private _isMuted: boolean = false;
  private _volume: number = 1;
  private _duration: number = 0;
  private _currentTime: number = 0;
  private _progress: number = 0;
  private _isFullscreen: boolean = false;
  private _lastBarrageSendTime: number = 0; // 添加这一行用于跟踪最后一次弹幕发送时间

  // 弹幕相关
  private _barrages: Barrage[] = [];
  private _showBarrageInput: boolean = false;
  private _isBarrageEnabled: boolean = true;
  
  // 字幕相关
  private _showSubtitles: boolean = true;
  private _currentTrackIndex: number = 0;
  
  // 配置
  private _videoSrc: string;
  private _videoId: string;
  private _userId: string;
  private _username: string;
  
  // 管理器
  private _wsManager: WebSocketManager | null = null;
  private _pluginManager: PluginManager;
  
  // 定时器
  private _controlsTimeout: ReturnType<typeof setTimeout> | null = null;
  private _barrageCleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: {
    videoSrc: string;
    videoId: string;
    userId: string;
    username: string;
  }) {
    super();
    this._videoSrc = options.videoSrc;
    this._videoId = options.videoId;
    this._userId = options.userId;
    this._username = options.username;
    
    // 初始化插件管理器
    this._pluginManager = new PluginManager(this);
    
    this._initWebSocket();
    this._initBarrageCleanup();
  }

  private _initWebSocket() {
    this._wsManager = new WebSocketManager(this._videoId);
    
    // 连接WebSocket
    this._wsManager.connect(this._userId);
    
    // 处理新弹幕
    this._wsManager.onBarrage((newBarrage: Barrage) => {
      this.addBarrage(newBarrage);
    });
    
    // 获取历史弹幕
    this._wsManager.onHistory((historyBarrages: Barrage[]) => {
      this._barrages = historyBarrages;
      this.emit('barragesUpdate', this._barrages);
    });
  }

  private _initBarrageCleanup() {
    // 不再定期清理过期弹幕，避免视频暂停时弹幕消失
    // 如果需要清理过期弹幕，应该在合适的时机手动调用
    console.log('[PlayerCore] 弹幕清理功能已禁用，避免视频暂停时弹幕消失');
  }

  // 播放控制方法
  play() {
    this._isPlaying = true;
    this.emit('play');
  }

  pause() {
    this._isPlaying = false;
    this.emit('pause');
  }

  togglePlay() {
    if (this._isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  // 音量控制方法
  setMuted(muted: boolean) {
    this._isMuted = muted;
    this.emit('volumeChange', { isMuted: this._isMuted, volume: this._volume });
  }

  setVolume(volume: number) {
    this._volume = volume;
    this._isMuted = volume === 0;
    this.emit('volumeChange', { isMuted: this._isMuted, volume: this._volume });
  }

  toggleMute() {
    this.setMuted(!this._isMuted);
  }

  // 进度控制方法
  seek(time: number) {
    this._currentTime = time;
    this._progress = (time / (this._duration || 1)) * 100;
    this.emit('seek', { time, progress: this._progress });
  }

  setProgress(progress: number) {
    this._progress = progress;
    this.emit('progressChange', progress);
  }

  // 全屏控制方法
  toggleFullscreen() {
    this._isFullscreen = !this._isFullscreen;
    this.emit('fullscreenChange', this._isFullscreen);
  }

  // 弹幕控制方法
  toggleBarrageInput() {
    this._showBarrageInput = !this._showBarrageInput;
    this.emit('barrageInputChange', this._showBarrageInput);
  }

  toggleBarrageEnabled() {
    this._isBarrageEnabled = !this._isBarrageEnabled;
    this.emit('barrageEnabledChange', this._isBarrageEnabled);
  }

  setShowBarrageInput(show: boolean) {
    this._showBarrageInput = show;
    this.emit('barrageInputChange', this._showBarrageInput);
  }

  setBarrageEnabled(enabled: boolean) {
    this._isBarrageEnabled = enabled;
    this.emit('barrageEnabledChange', this._isBarrageEnabled);
  }

  // 字幕控制方法
  toggleSubtitles() {
    this._showSubtitles = !this._showSubtitles;
    this.emit('subtitlesVisibilityChange', this._showSubtitles);
  }

  setSubtitleTrack(index: number) {
    this._currentTrackIndex = index;
    this.emit('subtitleTrackChange', {
      trackIndex: this._currentTrackIndex,
      showSubtitles: this._showSubtitles
    });
  }

  setShowSubtitles(show: boolean) {
    this._showSubtitles = show;
    this.emit('subtitlesVisibilityChange', this._showSubtitles);
  }

  // 弹幕相关方法
  addBarrage(barrage: Barrage) {
    console.log('[PlayerCore] 添加弹幕:', barrage);
    // 确保弹幕有位置、颜色、大小和动画持续时间属性
    const normalizedBarrage: Barrage = {
      ...barrage,
      position: barrage.position ?? Math.random() * 80 + 10, // 10% to 90% 垂直位置
      color: barrage.color ?? '#ffffff',
      size: barrage.size ?? 16,
      duration: barrage.duration ?? 8 // 默认8秒持续时间
    };
    
    console.log('[PlayerCore] 标准化后的弹幕:', normalizedBarrage);
    this._barrages.push(normalizedBarrage);
    console.log('[PlayerCore] 当前弹幕总数:', this._barrages.length);
    this.emit('barragesUpdate', this._barrages);
    console.log('[PlayerCore] 已发送barragesUpdate事件');
  }

  sendBarrage(text: string, userId: string, username: string) {
    console.log('[PlayerCore] 发送弹幕请求:', { text, userId, username });
    
    // 检查是否与上一条弹幕重复且时间间隔很短
    const lastBarrage = this._barrages[this._barrages.length - 1];
    if (lastBarrage && lastBarrage.text === text && 
        Date.now() - lastBarrage.timestamp < 100) {
      console.log('[PlayerCore] 检测到重复弹幕，取消发送');
      return;
    }
    
    // 检查是否正在发送相同的弹幕（防止短时间内重复调用）
    const now = Date.now();
    if (this._lastBarrageSendTime && (now - this._lastBarrageSendTime) < 50) {
      console.log('[PlayerCore] 发送弹幕调用过于频繁，取消发送');
      return;
    }
    
    // 记录发送时间
    this._lastBarrageSendTime = now;
    
    const newBarrage: Barrage = {
      id: uuidv4(),
      text,
      userId,
      username,
      timestamp: now,
      position: Math.random() * 80 + 10, // 10% to 90% 垂直位置
      color: '#ffffff',
      size: 16,
      duration: Math.random() * 5 + 5 // 5-10秒持续时间
    };
    
    console.log('[PlayerCore] 创建新弹幕:', newBarrage);
    
    // 发送至服务器
    if (this._wsManager) {
      console.log('[PlayerCore] 通过WebSocket发送弹幕');
      this._wsManager.sendBarrage(text, userId, username);
    }
    
    // 本地立即显示（仅在WebSocketManager没有立即回调时才需要）
    // 在WebSocketManager中已经处理了本地显示，这里不需要重复添加
    console.log('[PlayerCore] 本地添加弹幕（通过WebSocketManager回调）');
  }

  // 时间相关方法
  setTimeUpdate(currentTime: number) {
    this._currentTime = currentTime;
    if (this._duration) {
      this._progress = (currentTime / this._duration) * 100;
    }
    this.emit('timeUpdate', { currentTime: this._currentTime, progress: this._progress });
  }

  setDuration(duration: number) {
    this._duration = duration;
    this.emit('durationChange', duration);
  }

  // 控制栏显示方法
  showControls() {
    this.emit('controlsVisibilityChange', true);
  }

  hideControls() {
    this.emit('controlsVisibilityChange', false);
  }

  // 插件系统
  use(plugin: IPlayerPlugin, options?: any) {
    this._pluginManager.use(plugin, options);
  }

  // 清理方法
  destroy() {
    if (this._controlsTimeout) {
      clearTimeout(this._controlsTimeout);
    }
    
    if (this._barrageCleanupInterval) {
      clearInterval(this._barrageCleanupInterval);
    }
    
    // 销毁插件
    this._pluginManager.destroy();
    
    this.removeAllListeners();
  }

  // Getter方法
  get isPlaying() {
    return this._isPlaying;
  }

  get isMuted() {
    return this._isMuted;
  }

  get volume() {
    return this._volume;
  }

  get duration() {
    return this._duration;
  }

  get currentTime() {
    return this._currentTime;
  }

  get progress() {
    return this._progress;
  }

  get isFullscreen() {
    return this._isFullscreen;
  }

  get barrages() {
    return this._barrages;
  }

  get showBarrageInput() {
    return this._showBarrageInput;
  }

  get isBarrageEnabled() {
    return this._isBarrageEnabled;
  }

  get showSubtitles() {
    return this._showSubtitles;
  }

  get currentTrackIndex() {
    return this._currentTrackIndex;
  }

  get videoSrc() {
    return this._videoSrc;
  }

  get videoId() {
    return this._videoId;
  }

  get userId() {
    return this._userId;
  }

  get username() {
    return this._username;
  }
}