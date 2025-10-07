import {IPlayerPlugin} from '../core/IPlayerCore';

/**
 * 插件管理器
 */
export class PluginManager {
  private plugins: Map<string, IPlayerPlugin> = new Map();
  private player: any;

  constructor(player: any) {
    this.player = player;
  }

  /**
   * 注册插件
   * @param plugin 插件实例
   */
  use(plugin: IPlayerPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} is already registered.`);
      return;
    }

    this.plugins.set(plugin.name, plugin);
    plugin.install(this.player);
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
  }
}