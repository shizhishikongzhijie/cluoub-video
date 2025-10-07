import {IPlayerCore, IPlayerPlugin} from '../core/IPlayerCore';
import {Barrage} from '../Video.types';
import {WebSocketManager} from '../WebSocketManager';
import {v4 as uuidv4} from 'uuid';
import {BarragePluginOptions} from './PluginOptions';

/**
 * 弹幕插件
 */
export class BarragePlugin implements IPlayerPlugin {
  name = 'barrage';
  private player: IPlayerCore;
  private wsManager: WebSocketManager | null = null;
  private barrages: Barrage[] = [];
  private barrageCleanupInterval: ReturnType<typeof setInterval> | null = null;
  private options: BarragePluginOptions;

  constructor(options?: BarragePluginOptions) {
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
  }

  install(player: IPlayerCore, options?: BarragePluginOptions): void {
    // 合并配置选项
    this.options = { ...this.options, ...options };
    
    if (!this.options.enabled) {
      return;
    }
    
    this.player = player;
    
    // 初始化WebSocket连接
    this.initWebSocket();
    
    // 初始化弹幕清理定时器
    this.initBarrageCleanup();
  }

  private initWebSocket(): void {
    // 注意：这里需要获取videoId，可以通过player的属性获取
    // 由于接口限制，暂时无法直接获取，需要在实际实现中解决
    /*
    this.wsManager = new WebSocketManager(this.player.videoId);
    
    // 连接WebSocket
    this.wsManager.connect();
    
    // 处理新弹幕
    this.wsManager.onBarrage((newBarrage: Barrage) => {
      this.addBarrage(newBarrage);
    });
    
    // 获取历史弹幕
    this.wsManager.onHistory((historyBarrages: Barrage[]) => {
      this.barrages = historyBarrages;
      // 通知播放器更新弹幕
      this.player.emit('barragesUpdate', this.barrages);
    });
    */
  }

  private initBarrageCleanup(): void {
    // 定期清理过期弹幕以提高性能
    this.barrageCleanupInterval = setInterval(() => {
      const now = Date.now();
      this.barrages = this.barrages.filter(barrage => now - barrage.timestamp < this.options.maxDisplayTime!); // 只保留指定时间内的弹幕
      // 通知播放器更新弹幕
      this.player.emit('barragesUpdate', this.barrages);
    }, this.options.cleanupInterval);
  }

  /**
   * 添加弹幕
   * @param barrage 弹幕对象
   */
  addBarrage(barrage: Barrage): void {
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
    const newBarrage: Barrage = {
      id: uuidv4(),
      text,
      userId,
      username,
      timestamp: Date.now(),
    };
    
    // 发送至服务器
    if (this.wsManager) {
      this.wsManager.sendBarrage(text, userId, username);
    }
    
    // 本地立即显示
    this.addBarrage(newBarrage);
  }

  /**
   * 切换弹幕输入框显示
   */
  toggleBarrageInput(): void {
    // 通过player接口控制状态
    this.player.setShowBarrageInput(!this.player.showBarrageInput);
  }

  /**
   * 切换弹幕启用状态
   */
  toggleBarrageEnabled(): void {
    // 通过player接口控制状态
    this.player.setBarrageEnabled(!this.player.isBarrageEnabled);
  }

  /**
   * 获取弹幕显示配置
   */
  getDisplayOptions(): any {
    return this.options.display;
  }

  destroy(): void {
    if (this.barrageCleanupInterval) {
      clearInterval(this.barrageCleanupInterval);
    }
    
    if (this.wsManager) {
      // 销毁WebSocket连接
    }
  }
}