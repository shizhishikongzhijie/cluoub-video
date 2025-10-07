import {IPlayerCore, IPlayerPlugin} from '../core/IPlayerCore';
import {Barrage} from '../Video.types';
import {WebSocketManager} from '../WebSocketManager';
import {v4 as uuidv4} from 'uuid';
import {BarragePluginOptions} from './PluginOptions';
import Logger from '../utils/Logger';

/**
 * 弹幕插件
 */
export class BarragePlugin implements IPlayerPlugin {
  name = 'barrage';
  private player!: IPlayerCore;
  private wsManager: WebSocketManager | null = null;
  private barrages: Barrage[] = [];
  private barrageCleanupInterval: ReturnType<typeof setInterval> | null = null;
  private options: BarragePluginOptions;
  private logger: Logger;
  private isInitialized: boolean = false;

  constructor(options?: BarragePluginOptions) {
    this.logger = Logger.getInstance();
    this.logger.setComponentName('BarragePlugin');
    
    this.options = {
      enabled: true,
      cleanupInterval: 1000,
      maxDisplayTime: 10000,
      websocket: {
        reconnectInterval: 5000,
        maxReconnectAttempts: 5
      },
      display: {
        fontSize: 16,
        color: '#ffffff',
        opacity: 0.8,
        speed: 5
      },
      ...options
    };
    this.logger.debug('Plugin configuration:', this.options);
  }

  install(player: IPlayerCore, options?: BarragePluginOptions): void {
    // 确保初始化日志只打印一次
    if (!this.isInitialized) {
      this.logger.initSuccess();
      this.isInitialized = true;
    }
    
    this.logger.info('Installing barrage plugin');
    // 合并配置选项
    this.options = { ...this.options, ...options };
    
    if (!this.options.enabled) {
      this.logger.info('Barrage plugin is disabled');
      return;
    }
    
    this.player = player;
    this.logger.info('Barrage plugin installed successfully');
    
    // 初始化WebSocket连接
    this.initWebSocket();
    
    // 初始化弹幕清理定时器
    this.initBarrageCleanup();
  }

  private initWebSocket(): void {
    this.logger.debug('Initializing WebSocket connection');
    // 注意：这里需要获取videoId，可以通过player的属性获取
    // 由于接口限制，暂时无法直接获取，需要在实际实现中解决
    /*
    this.wsManager = new WebSocketManager(this.player.videoId);
    
    // 连接WebSocket
    this.wsManager.connect();
    
    // 处理新弹幕
    this.wsManager.onBarrage((newBarrage: Barrage) => {
      this.logger.debug('Received new barrage:', newBarrage);
      this.addBarrage(newBarrage);
    });
    
    // 获取历史弹幕
    this.wsManager.onHistory((historyBarrages: Barrage[]) => {
      this.logger.debug('Received history barrages:', historyBarrages);
      this.barrages = historyBarrages;
      // 通知播放器更新弹幕
      this.player.emit('barragesUpdate', this.barrages);
    });
    */
  }

  private initBarrageCleanup(): void {
    this.logger.debug('Initializing barrage cleanup timer');
    // 定期清理过期弹幕以提高性能
    // 为了避免视频暂停时弹幕消失，我们不自动清理弹幕
    this.logger.debug('Barrage auto-cleanup disabled to prevent disappearance when video is paused');
    /*
    this.barrageCleanupInterval = setInterval(() => {
      this.logger.debug('Performing barrage cleanup');
      const now = Date.now();
      const oldLength = this.barrages.length;
      this.barrages = this.barrages.filter(barrage => now - barrage.timestamp < this.options.maxDisplayTime!); // 只保留指定时间内的弹幕
      if (oldLength !== this.barrages.length) {
        this.logger.debug('Cleaned up', oldLength - this.barrages.length, 'expired barrages');
      }
      // 通知播放器更新弹幕
      this.player.emit('barragesUpdate', this.barrages);
    }, this.options.cleanupInterval);
    */
  }

  /**
   * 添加弹幕
   * @param barrage 弹幕对象
   */
  addBarrage(barrage: Barrage): void {
    this.logger.debug('Adding barrage:', barrage);
    this.barrages.push(barrage);
    // 通知播放器更新弹幕
    this.player.emit('barragesUpdate', this.barrages);
  }

  /**
   * 发送弹幕
   * @param text 弹幕文本
   * @param userId 用户ID
   * @param username 用户名
   */
  sendBarrage(text: string, userId: string, username: string): void {
    this.logger.debug('Sending barrage:', { text, userId, username });
    
    // 获取当前视频时间
    const currentTime = this.player.currentTime || 0;
    
    const newBarrage: Barrage = {
      id: uuidv4(),
      text,
      userId,
      username,
      timestamp: Date.now(),
      videoTime: currentTime, // 记录视频时间
      duration: Math.random() * 5 + 5 // 5-10秒持续时间
    };
    
    // 发送至服务器
    if (this.wsManager) {
      this.logger.debug('Sending barrage via WebSocket');
      this.wsManager.sendBarrage(text, userId, username);
    }
    
    // 本地立即显示
    this.logger.debug('Adding barrage locally');
    this.addBarrage(newBarrage);
  }

  /**
   * 手动清理过期弹幕
   */
  cleanupExpiredBarrages(): void {
    this.logger.debug('Manually cleaning up expired barrages');
    const now = Date.now();
    const oldLength = this.barrages.length;
    this.barrages = this.barrages.filter(barrage => now - barrage.timestamp < this.options.maxDisplayTime!);
    if (oldLength !== this.barrages.length) {
      this.logger.debug('Cleaned up', oldLength - this.barrages.length, 'expired barrages');
      // 通知播放器更新弹幕
      this.player.emit('barragesUpdate', this.barrages);
    }
  }

  /**
   * 切换弹幕输入框显示
   */
  toggleBarrageInput(): void {
    this.logger.debug('Toggling barrage input display');
    // 通过player接口控制状态
    this.player.setShowBarrageInput(!this.player.showBarrageInput);
  }

  /**
   * 切换弹幕启用状态
   */
  toggleBarrageEnabled(): void {
    this.logger.debug('Toggling barrage enabled state');
    // 通过player接口控制状态
    this.player.setBarrageEnabled(!this.player.isBarrageEnabled);
  }

  /**
   * 获取弹幕显示配置
   */
  getDisplayOptions(): any {
    this.logger.debug('Getting display options');
    return this.options.display;
  }

  destroy(): void {
    this.logger.info('Destroying barrage plugin');
    if (this.barrageCleanupInterval) {
      clearInterval(this.barrageCleanupInterval);
    }
    
    if (this.wsManager) {
      // 销毁WebSocket连接
    }
  }
}