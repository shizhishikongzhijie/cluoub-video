import {IPlayerPlugin, ControlButtonConfig, PlayerComponentConfig} from '../core/IPlayerCore';

/**
 * 插件管理器
 */
export class PluginManager {
  private plugins: Map<string, IPlayerPlugin> = new Map();
  private player: any;
  // 存储所有注册的控制按钮配置
  private controlButtons: ControlButtonConfig[] = [];
  // 存储所有注册的组件配置
  private components: PlayerComponentConfig[] = [];

  constructor(player: any) {
    this.player = player;
  }

  /**
   * 注册插件
   * @param plugin 插件实例
   * @param options 插件配置选项
   */
  use(plugin: IPlayerPlugin, options?: any): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} is already registered.`);
      return;
    }

    this.plugins.set(plugin.name, plugin);
    
    // 提供插件API
    const pluginAPI = {
      player: this.player,
      registerControlButton: this.registerControlButton.bind(this),
      removeControlButton: this.removeControlButton.bind(this),
      registerComponent: this.registerComponent.bind(this),
      removeComponent: this.removeComponent.bind(this),
      // 提供播放器状态信息
      getPlayerState: () => ({
        isPlaying: this.player?.isPlaying,
        currentTime: this.player?.currentTime,
        duration: this.player?.duration,
        volume: this.player?.volume,
        isMuted: this.player?.isMuted,
        isFullscreen: this.player?.isFullscreen
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
   * 注册控制按钮
   * @param button 控制按钮配置
   */
  registerControlButton(button: ControlButtonConfig): void {
    // 检查是否已存在相同ID的按钮
    const existingIndex = this.controlButtons.findIndex(b => b.id === button.id);
    if (existingIndex !== -1) {
      // 更新已存在的按钮
      this.controlButtons[existingIndex] = button;
    } else {
      // 添加新按钮
      this.controlButtons.push(button);
    }
  }

  /**
   * 移除控制按钮
   * @param id 按钮ID
   */
  removeControlButton(id: string): void {
    const index = this.controlButtons.findIndex(b => b.id === id);
    if (index !== -1) {
      this.controlButtons.splice(index, 1);
    }
  }

  /**
   * 注册组件
   * @param component 组件配置
   */
  registerComponent(component: PlayerComponentConfig): void {
    // 检查是否已存在相同ID的组件
    const existingIndex = this.components.findIndex(c => c.id === component.id);
    if (existingIndex !== -1) {
      // 更新已存在的组件
      this.components[existingIndex] = component;
    } else {
      // 添加新组件
      this.components.push(component);
    }
  }

  /**
   * 移除组件
   * @param id 组件ID
   */
  removeComponent(id: string): void {
    const index = this.components.findIndex(c => c.id === id);
    if (index !== -1) {
      this.components.splice(index, 1);
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