import {ControlButtonConfig, IPlayerPlugin, IPlayerPluginApi, PlayerComponentConfig, PlayerCore} from '../core';
import {Logger} from "../utils";

/**
 * 插件管理器
 */
export class PluginManager {
  private plugins: Map<string, IPlayerPlugin> = new Map();
  private player: PlayerCore;
  private logger: Logger;
  // 存储所有注册的控制按钮配置
  private controlButtons: ControlButtonConfig[] = [];
  // 存储所有注册的组件配置
  private components: PlayerComponentConfig[] = [];

  constructor(player: PlayerCore) {
    this.player = player;
    this.logger = Logger.getInstance();
  }

  /**
   * 注册插件
   * @param plugin 插件实例
   * @param options 插件配置选项
   */
  use(plugin: IPlayerPlugin, options?: any): void {
    if (this.plugins.has(plugin.name)) {
      this.logger.debug(`Plugin ${plugin.name} is already registered.`);
      return;
    }

    this.plugins.set(plugin.name, plugin);
    
    // 提供插件API
    const pluginAPI: IPlayerPluginApi = {
      player: this.player,
      registerControlButton: this.player.registerControlButton.bind(this.player),
      updateControlButton: this.player.updateControlButton.bind(this.player),
      unregisterControlButton: this.player.unregisterControlButton.bind(this.player),
      registerComponent: this.player.registerComponent.bind(this.player),
      updateComponent: this.player.updateComponent.bind(this.player),
      unregisterComponent: this.player.unregisterComponent.bind(this.player),
      // 提供播放器状态信息
      getPlayerState: () => ({
        isPlaying: this.player?.isPlaying,
        currentTime: this.player?.currentTime,
        duration: this.player?.duration,
        volume: this.player?.volume,
        isMuted: this.player?.isMuted,
        isFullscreen: this.player?.isFullscreen,
        showSubtitles: this.player?.showSubtitles,
        currentTrackIndex: this.player?.currentTrackIndex,
        progress: this.player?.progress,
        videoSrc: this.player?.videoSrc,
        videoId: this.player?.videoId,
        userId: this.player?.userId,
        username: this.player?.username,
      })
    };
    
    // 调用插件的install方法
    plugin.install(this.player, options);
    
    // 额外提供插件API给插件
    if (plugin.setAPI) {
      plugin.setAPI(pluginAPI);
    }
  }

  /**
   * 获取所有注册的控制按钮
   * @returns 控制按钮配置数组
   */
  getControlButtons(): ControlButtonConfig[] {
    return [...this.controlButtons];
  }

  /**
   * 获取所有注册的组件
   * @returns 组件配置数组
   */
  getComponents(): PlayerComponentConfig[] {
    return [...this.components];
  }

  /**
   * 移除插件
   * @param pluginName 插件名称
   */
  remove(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (plugin && plugin.destroy) {
      plugin.destroy();
    }
    this.plugins.delete(pluginName);
  }

  /**
   * 获取插件
   * @param pluginName 插件名称
   * @returns 插件实例
   */
  get(pluginName: string): IPlayerPlugin | undefined {
    return this.plugins.get(pluginName);
  }

  /**
   * 销毁所有插件
   */
  destroy(): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.destroy) {
        plugin.destroy();
      }
    }
    this.plugins.clear();
    this.controlButtons = [];
    this.components = [];
  }
}