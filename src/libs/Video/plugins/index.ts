import {PluginManager} from './PluginManager';
import DemoPlugin from './DemoPlugin';
import {IPlayerPlugin} from "../core";

// 直接导出所有需要的内容
export {
  PluginManager,
  DemoPlugin
};


// 默认插件列表
export const DefaultPlugins = {
  demo: DemoPlugin
};

// 插件注册辅助函数
export function registerPlugin(player: any, plugin: IPlayerPlugin, options?: any): void {
  if (player && typeof player.use === 'function') {
    player.use(plugin, options);
  }
}

// 插件移除辅助函数
export function removePlugin(player: any, pluginName: string): void {
  if (player && typeof player.removePlugin === 'function') {
    player.removePlugin(pluginName);
  }
}
