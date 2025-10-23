# Cluoub Video 插件系统

## 概述

Cluoub Video 播放器采用高度灵活的插件化架构，使开发者能够轻松扩展播放器功能。插件系统通过标准化接口与核心播放器集成，提供统一的生命周期管理和事件处理机制。

## 插件架构

```
PlayerCore (核心播放器)
    │
    ├── PluginManager (插件管理器)
    │       │
    │       ├── BarragePlugin (弹幕插件)
    │       ├── SubtitlePlugin (字幕插件)
    │       └── ... (自定义插件)
    │
    └── IPlayerCore (核心接口)
```

## 快速开始

### 注册和使用插件

```typescript
import { PlayerCore } from '../core';
import { BarragePlugin, SubtitlePlugin } from './plugins';

// 创建播放器实例
const player = new PlayerCore({
  videoSrc: 'path/to/video.mp4',
});

// 注册弹幕插件
const barragePlugin = new BarragePlugin({
  enabled: true,
  cleanupInterval: 2000,
  maxDisplayTime: 15000
});
player.use(barragePlugin);

// 注册字幕插件
const subtitlePlugin = new SubtitlePlugin({
  enabled: true,
  defaultTrackIndex: 0
});
player.use(subtitlePlugin);
```

## 插件配置选项

### 弹幕插件配置

```typescript
interface BarragePluginOptions {
  // 是否启用弹幕功能
  enabled?: boolean;
  // 弹幕清理间隔（毫秒）
  cleanupInterval?: number;
  // 弹幕最大存在时间（毫秒）
  maxDisplayTime?: number;
  // 同时显示的最大弹幕数量
  maxDisplayCount?: number;
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
  // 过滤配置
  filter?: {
    // 是否启用敏感词过滤
    enabled?: boolean;
    // 最大长度限制
    maxLength?: number;
  };
}
```

### 字幕插件配置

```typescript
interface SubtitlePluginOptions {
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
    // 文本阴影
    textShadow?: string;
  };
  // 字幕偏移时间（秒）
  timeOffset?: number;
  // 是否自动加载字幕
  autoLoad?: boolean;
  // 是否使用外部字幕渲染器
  useExternalRenderer?: boolean;
}
```

## 开发自定义插件

### 插件接口定义

所有插件必须实现以下接口：

```typescript
interface IPlayerPlugin {
  // 插件名称（必须唯一）
  name: string;
  
  // 安装插件
  install(player: IPlayerCore, options?: any): void;
  
  // 卸载插件（可选）
  destroy?(): void;
  
  // 启用/禁用插件（可选）
  enable?(): void;
  disable?(): void;
  
  // 获取插件状态（可选）
  getStatus?(): Record<string, any>;
}
```

### 创建插件示例

```typescript
import { IPlayerPlugin, IPlayerCore } from '../core/IPlayerCore';

/**
 * 自定义插件示例
 * 用于记录视频播放统计数据
 */
export class AnalyticsPlugin implements IPlayerPlugin {
  public name = 'analytics-plugin';
  private player: IPlayerCore;
  private startTime: number = 0;
  private watchedTime: number = 0;
  private options: {
    enabled?: boolean;
    samplingRate?: number;
  };

  constructor(options: any = {}) {
    this.options = {
      enabled: true,
      samplingRate: 1.0, // 100% 采样率
      ...options
    };
  }

  install(player: IPlayerCore, options?: any): void {
    this.player = player;
    this.options = {
      ...this.options,
      ...options
    };
    
    if (!this.options.enabled) {
      return;
    }
    
    // 监听播放器事件
    this.player.on('play', this.handlePlay.bind(this));
    this.player.on('pause', this.handlePause.bind(this));
    this.player.on('ended', this.handleEnded.bind(this));
    this.player.on('seeked', this.handleSeeked.bind(this));
    
    console.log('AnalyticsPlugin installed');
  }

  private handlePlay(): void {
    this.startTime = Date.now();
    console.log('Video started playing');
  }

  private handlePause(): void {
    if (this.startTime) {
      this.watchedTime += Date.now() - this.startTime;
      this.startTime = 0;
      this.reportAnalytics();
    }
  }

  private handleEnded(): void {
    if (this.startTime) {
      this.watchedTime += Date.now() - this.startTime;
      this.startTime = 0;
    }
    this.reportAnalytics(true);
  }

  private handleSeeked(): void {
    // 处理跳转事件
    console.log('Video position changed');
  }

  private reportAnalytics(isCompleted = false): void {
    // 模拟发送统计数据
    const data = {
      videoId: this.player.videoId,
      watchedTime: this.watchedTime,
      duration: this.player.duration,
      completionRate: this.player.duration > 0 ? this.watchedTime / (this.player.duration * 1000) : 0,
      isCompleted,
      timestamp: Date.now()
    };
    
    console.log('Reporting analytics:', data);
    // 实际应用中这里会发送API请求
  }

  destroy(): void {
    // 清理事件监听器
    this.player.off('play', this.handlePlay.bind(this));
    this.player.off('pause', this.handlePause.bind(this));
    this.player.off('ended', this.handleEnded.bind(this));
    this.player.off('seeked', this.handleSeeked.bind(this));
    
    // 最后一次上报数据
    if (this.watchedTime > 0) {
      this.reportAnalytics();
    }
    
    console.log('AnalyticsPlugin destroyed');
  }

  enable(): void {
    this.options.enabled = true;
    console.log('AnalyticsPlugin enabled');
  }

  disable(): void {
    this.options.enabled = false;
    console.log('AnalyticsPlugin disabled');
  }

  getStatus(): Record<string, any> {
    return {
      enabled: this.options.enabled,
      watchedTime: this.watchedTime,
      samplingRate: this.options.samplingRate
    };
  }
}
```

## 插件生命周期

1. **安装阶段**：调用插件的 `install` 方法，传递播放器实例和配置选项
2. **运行阶段**：插件可以响应播放器事件，修改播放器行为
3. **卸载阶段**：调用插件的 `destroy` 方法，清理资源

## 播放器事件系统

插件可以监听和触发播放器事件：

```typescript
// 监听事件
player.on('play', () => {
  console.log('Video is playing');
});

// 移除事件监听
player.off('play', myHandler);

// 触发自定义事件
player.emit('customEvent', { data: 'custom data' });
```

### 常用播放器事件

| 事件名 | 触发时机 | 参数 |
|-------|---------|------|
| play | 视频开始播放 | 无 |
| pause | 视频暂停 | 无 |
| ended | 视频播放结束 | 无 |
| timeupdate | 视频时间更新 | currentTime: number |
| volumechange | 音量变化 | volume: number, muted: boolean |
| progress | 加载进度更新 | buffered: TimeRanges |
| seeking | 开始跳转 | seekingTime: number |
| seeked | 跳转完成 | currentTime: number |
| ratechange | 播放速率变化 | playbackRate: number |
| enterFullscreen | 进入全屏 | 无 |
| exitFullscreen | 退出全屏 | 无 |

## 插件最佳实践

1. **命名规范**：使用描述性且唯一的插件名称，建议采用 `xxx-plugin` 格式
2. **资源管理**：在 `destroy` 方法中清理所有资源（事件监听器、定时器等）
3. **错误处理**：添加适当的错误捕获和日志记录
4. **配置验证**：验证和规范化配置选项，提供合理的默认值
5. **类型安全**：使用 TypeScript 接口定义配置选项和返回类型
6. **低耦合**：最小化与播放器核心的耦合，通过事件和公共 API 交互
7. **性能优化**：避免频繁操作 DOM，使用节流/防抖处理高频率事件

## 内置插件

### 弹幕插件 (BarragePlugin)

提供完整的弹幕功能支持：
- 实时弹幕发送与接收（WebSocket）
- 弹幕渲染与动画效果
- 智能弹幕过滤（敏感词、用户屏蔽词）
- 弹幕样式自定义（颜色、大小、透明度）
- 弹幕清理与性能优化

### 字幕插件 (SubtitlePlugin)

提供专业的字幕功能支持：
- 多字幕轨道管理与切换
- WebVTT 格式字幕解析
- 字幕样式自定义
- 字幕时间偏移调整
- 字幕搜索与高亮

## API参考

### PluginManager

#### use(plugin: IPlayerPlugin, options?: any): void
注册并初始化插件

#### remove(pluginName: string): boolean
移除指定名称的插件，返回是否成功

#### get(pluginName: string): IPlayerPlugin | undefined
获取已注册的插件实例

#### getAll(): Map<string, IPlayerPlugin>
获取所有已注册的插件

#### enable(pluginName: string): boolean
启用指定插件

#### disable(pluginName: string): boolean
禁用指定插件

#### destroy(): void
销毁所有插件并清理资源

### PlayerCore 插件相关方法

#### use(plugin: IPlayerPlugin, options?: any): void
通过 PluginManager 注册插件

#### getPlugin(pluginName: string): IPlayerPlugin | undefined
获取已注册的插件实例

## 高级插件开发

### 插件间通信

```typescript
// 在一个插件中获取另一个插件实例
const otherPlugin = this.player.getPlugin('other-plugin');
if (otherPlugin) {
  // 调用其他插件的方法
  otherPlugin.someMethod();
}
```

### 自定义组件挂载

```typescript
// 在插件中向播放器添加自定义 UI 组件
install(player: IPlayerCore): void {
  this.player = player;
  
  // 创建自定义控件按钮
  const customButton = document.createElement('button');
  customButton.textContent = '自定义';
  customButton.className = 'custom-plugin-button';
  customButton.onclick = () => this.handleButtonClick();
  
  // 将按钮添加到控制栏
  const controlBar = player.container.querySelector('.control-bar');
  if (controlBar) {
    controlBar.appendChild(customButton);
  }
}

// 销毁时清理自定义 UI
remove(): void {
  const customButton = this.player.container.querySelector('.custom-plugin-button');
  if (customButton) {
    customButton.remove();
  }
}
```

## 常见问题排查

### 插件不工作
1. 检查插件是否正确注册（`player.use(plugin)`）
2. 验证插件的 `install` 方法是否被调用
3. 检查控制台是否有错误信息
4. 确认插件配置选项是否正确

### 性能问题
1. 避免在 `timeupdate` 等高频事件中执行复杂操作
2. 使用节流/防抖优化事件处理
3. 合理管理 DOM 元素，避免内存泄漏
4. 在 `destroy` 方法中彻底清理资源

### 事件处理
1. 确保正确绑定事件处理函数的 `this` 上下文
2. 不要忘记在 `destroy` 方法中移除事件监听器
3. 使用命名空间区分不同插件的事件处理函数

## 插件开发工具

### 调试技巧
1. 使用浏览器开发者工具的 Performance 面板分析性能
2. 在插件关键位置添加 `console.log` 输出调试信息
3. 使用 Chrome 的 Sources 面板设置断点调试
4. 利用 React DevTools 监控组件状态变化（如果插件使用 React）

### 测试方法
1. 单元测试：使用 Jest 测试插件的核心逻辑
2. 集成测试：验证插件与播放器的交互
3. 端到端测试：使用 Cypress 模拟用户操作验证功能

## 未来发展

### 插件市场
未来计划建立官方插件市场，允许开发者分享和发现高质量插件。

### 预设配置
提供常见场景的插件配置预设，简化插件使用流程。

### 插件模板
提供插件开发模板，帮助开发者快速创建符合规范的插件。