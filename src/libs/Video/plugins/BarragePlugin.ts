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
    console.log('[BarragePlugin] 创建弹幕插件实例');
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
    console.log('[BarragePlugin] 插件配置:', this.options);
  }

  install(player: IPlayerCore, options?: BarragePluginOptions): void {
    console.log('[BarragePlugin] 安装弹幕插件');
    // 合并配置选项
    this.options = { ...this.options, ...options };
    
    if (!this.options.enabled) {
      console.log('[BarragePlugin] 弹幕插件被禁用');
      return;
    }
    
    this.player = player;
    console.log('[BarragePlugin] 弹幕插件安装完成');
    
    // 初始化WebSocket连接
    this.initWebSocket();
    
    // 初始化弹幕清理定时器
    this.initBarrageCleanup();
  }

  private initWebSocket(): void {
    console.log('[BarragePlugin] 初始化WebSocket连接');
    // 注意：这里需要获取videoId，可以通过player的属性获取
    // 由于接口限制，暂时无法直接获取，需要在实际实现中解决
    /*
    this.wsManager = new WebSocketManager(this.player.videoId);
    
    // 连接WebSocket
    this.wsManager.connect();
    
    // 处理新弹幕
    this.wsManager.onBarrage((newBarrage: Barrage) => {
      console.log('[BarragePlugin] 接收到新弹幕:', newBarrage);
      this.addBarrage(newBarrage);
    });
    
    // 获取历史弹幕
    this.wsManager.onHistory((historyBarrages: Barrage[]) => {
      console.log('[BarragePlugin] 接收到历史弹幕:', historyBarrages);
      this.barrages = historyBarrages;
      // 通知播放器更新弹幕
      this.player.emit('barragesUpdate', this.barrages);
    });
    */
  }

  private initBarrageCleanup(): void {
    console.log('[BarragePlugin] 初始化弹幕清理定时器');
    // 定期清理过期弹幕以提高性能
    // 为了避免视频暂停时弹幕消失，我们不自动清理弹幕
    console.log('[BarragePlugin] 弹幕自动清理已禁用，避免视频暂停时弹幕消失');
    /*
    this.barrageCleanupInterval = setInterval(() => {
      console.log('[BarragePlugin] 执行弹幕清理');
      const now = Date.now();
      const oldLength = this.barrages.length;
      this.barrages = this.barrages.filter(barrage => now - barrage.timestamp < this.options.maxDisplayTime!); // 只保留指定时间内的弹幕
      if (oldLength !== this.barrages.length) {
        console.log('[BarragePlugin] 清理了', oldLength - this.barrages.length, '条过期弹幕');
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
    console.log('[BarragePlugin] 添加弹幕:', barrage);
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
    console.log('[BarragePlugin] 发送弹幕:', { text, userId, username });
    
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
      console.log('[BarragePlugin] 通过WebSocket发送弹幕');
      this.wsManager.sendBarrage(text, userId, username);
    }
    
    // 本地立即显示
    console.log('[BarragePlugin] 本地添加弹幕');
    this.addBarrage(newBarrage);
  }

  /**
   * 手动清理过期弹幕
   */
  cleanupExpiredBarrages(): void {
    console.log('[BarragePlugin] 手动清理过期弹幕');
    const now = Date.now();
    const oldLength = this.barrages.length;
    this.barrages = this.barrages.filter(barrage => now - barrage.timestamp < this.options.maxDisplayTime!);
    if (oldLength !== this.barrages.length) {
      console.log('[BarragePlugin] 清理了', oldLength - this.barrages.length, '条过期弹幕');
      // 通知播放器更新弹幕
      this.player.emit('barragesUpdate', this.barrages);
    }
  }

  /**
   * 切换弹幕输入框显示
   */
  toggleBarrageInput(): void {
    console.log('[BarragePlugin] 切换弹幕输入框显示');
    // 通过player接口控制状态
    this.player.setShowBarrageInput(!this.player.showBarrageInput);
  }

  /**
   * 切换弹幕启用状态
   */
  toggleBarrageEnabled(): void {
    console.log('[BarragePlugin] 切换弹幕启用状态');
    // 通过player接口控制状态
    this.player.setBarrageEnabled(!this.player.isBarrageEnabled);
  }

  /**
   * 获取弹幕显示配置
   */
  getDisplayOptions(): any {
    console.log('[BarragePlugin] 获取弹幕显示配置');
    return this.options.display;
  }

  destroy(): void {
    console.log('[BarragePlugin] 销毁弹幕插件');
    if (this.barrageCleanupInterval) {
      clearInterval(this.barrageCleanupInterval);
    }
    
    if (this.wsManager) {
      // 销毁WebSocket连接
    }
  }
}