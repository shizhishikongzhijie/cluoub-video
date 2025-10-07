/**
 * 插件配置选项接口
 */

// 弹幕插件配置选项
export interface BarragePluginOptions {
  // 是否启用弹幕功能
  enabled?: boolean;
  // 弹幕清理间隔（毫秒）
  cleanupInterval?: number;
  // 弹幕最大存在时间（毫秒）
  maxDisplayTime?: number;
  // WebSocket连接配置
  websocket?: {
    // WebSocket服务器地址
    url?: string;
    // 重连间隔（毫秒）
    reconnectInterval?: number;
    // 最大重连次数
    maxReconnectAttempts?: number;
  };
  // 弹幕显示配置
  display?: {
    // 弹幕字体大小
    fontSize?: number;
    // 弹幕颜色
    color?: string;
    // 弹幕透明度
    opacity?: number;
    // 弹幕移动速度
    speed?: number;
  };
}

// 字幕插件配置选项
export interface SubtitlePluginOptions {
  // 是否启用字幕功能
  enabled?: boolean;
  // 默认字幕轨道索引
  defaultTrackIndex?: number;
  // 字幕显示配置
  display?: {
    // 字体大小
    fontSize?: number;
    // 字体颜色
    color?: string;
    // 背景颜色
    backgroundColor?: string;
    // 字体族
    fontFamily?: string;
  };
  // 字幕偏移时间（秒）
  timeOffset?: number;
}

// 通用插件配置选项
export interface PluginOptions {
  // 弹幕插件配置
  barrage?: BarragePluginOptions;
  // 字幕插件配置
  subtitle?: SubtitlePluginOptions;
}