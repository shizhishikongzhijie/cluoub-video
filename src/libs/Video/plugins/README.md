# 视频播放器插件系统文档

## 概述

视频播放器采用插件化架构设计，允许开发者通过插件扩展播放器功能。插件系统提供了灵活的配置选项，使插件可以根据不同需求进行定制。

## 插件架构

```
PlayerCore (核心)
    │
    ├── PluginManager (插件管理器)
    │       │
    │       ├── BarragePlugin (弹幕插件)
    │       ├── SubtitlePlugin (字幕插件)
    │       └── ... (其他插件)
    │
    └── IPlayerCore (核心接口)
```

## 使用插件

### 注册插件

```typescript
import { PlayerCore } from './core';
import { BarragePlugin, SubtitlePlugin } from './plugins';

const player = new PlayerCore({
  videoSrc: 'path/to/video.mp4',
  videoId: 'video123',
  userId: 'user123',
  username: 'username'
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

### 插件配置选项

#### 弹幕插件配置

```typescript
interface BarragePluginOptions {
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
```

#### 字幕插件配置

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
  };
  // 字幕偏移时间（秒）
  timeOffset?: number;
}
```

## 开发自定义插件

### 插件接口

所有插件都需要实现以下接口：

```typescript
interface IPlayerPlugin {
  name: string;
  install(player: IPlayerCore, options?: any): void;
  destroy?(): void;
}
```

### 创建插件示例

```typescript
import { IPlayerPlugin, IPlayerCore } from '../core/IPlayerCore';

export class CustomPlugin implements IPlayerPlugin {
  name = 'custom-plugin';
  private player: IPlayerCore;

  install(player: IPlayerCore, options?: any): void {
    this.player = player;
    
    // 监听播放器事件
    this.player.on('play', () => {
      console.log('Video is playing');
    });
    
    // 执行其他初始化逻辑
    // ...
  }

  destroy(): void {
    // 清理资源
    // ...
  }
}
```

### 插件最佳实践

1. **命名规范**：插件名称应具有描述性且唯一
2. **资源管理**：在destroy方法中清理所有资源
3. **事件处理**：合理使用播放器事件系统
4. **配置选项**：提供合理的默认配置选项
5. **错误处理**：适当处理可能出现的错误情况

## 内置插件

### 弹幕插件 (BarragePlugin)

提供弹幕功能，包括：
- 弹幕发送和显示
- WebSocket连接管理
- 弹幕清理机制
- 自定义显示样式

### 字幕插件 (SubtitlePlugin)

提供字幕功能，包括：
- 多字幕轨道支持
- 字幕显示控制
- 自定义显示样式
- 字幕时间偏移

## API参考

### PluginManager

#### use(plugin: IPlayerPlugin, options?: any): void
注册插件

#### remove(pluginName: string): void
移除插件

#### get(pluginName: string): IPlayerPlugin | undefined
获取插件实例

#### destroy(): void
销毁所有插件

### PlayerCore

#### use(plugin: IPlayerPlugin, options?: any): void
注册插件（通过PluginManager）

## 常见问题

### 插件不工作怎么办？
1. 检查插件是否正确注册
2. 检查插件配置选项是否正确
3. 查看控制台是否有错误信息

### 如何调试插件？
1. 使用浏览器开发者工具
2. 在插件关键位置添加console.log
3. 检查事件是否正确触发