# Cluoub Video Player

一个现代化、功能丰富的 React 视频播放器组件，专为二次元文化爱好者打造，集成弹幕系统、多字幕支持和快捷键功能。

## 特性

- 🎬 完整的视频播放控制功能
- 💬 实时弹幕系统，支持 WebSocket 通信
- 📝 多语言字幕轨道支持（WebVTT 格式）
- ⌨️ 全面的键盘快捷键支持
- 🎨 精美的二次元风格 UI 设计
- 📱 完全响应式设计，适配各种屏幕尺寸
- 🔧 高度可定制的播放器控件
- 🌐 完整的 TypeScript 类型定义
- 🧩 可扩展的插件系统架构

## 安装

```bash
npm install @cluoub-design/cluoub-video
# 或使用 yarn
yarn add @cluoub-design/cluoub-video
# 或使用 pnpm
pnpm add @cluoub-design/cluoub-video
```

## 快速开始

```jsx
import React from 'react';
import CluoubVideo from '@cluoub-design/cluoub-video';
import '@cluoub-design/cluoub-video/dist/cluoub-video.css';

function App() {
  return (
    <div className="app-container">
      <h1>Cluoub Video Player 演示</h1>
      <CluoubVideo
        videoSrc="https://example.com/video.mp4"
        videoId="video-demo-001"
        userId="user123"
        username="二次元爱好者"
        width="100%"
        maxWidth="1200px"
        aspectRatio="16:9"
      />
    </div>
  );
}

export default App;
```

## 功能详解

### 1. 弹幕系统

我们的弹幕系统专为二次元文化定制，具有以下特点：

- **实时通信**：基于 WebSocket 的实时弹幕传输
- **智能过滤**：多层级过滤机制（敏感词检测、用户屏蔽词、长度限制、重复内容检测）
- **性能优化**：自动清理过期弹幕，智能控制同时显示的弹幕数量
- **个性化定制**：支持自定义弹幕颜色、大小、透明度和移动速度
- **二次元风格**：精心设计的视觉效果，符合二次元美学

```jsx
<CluoubVideo
  videoSrc="https://example.com/video.mp4"
  videoId="unique-video-id"
  userId="user123"
  username="用户名"
  controls={{
    barrage: true // 启用弹幕功能
  }}
  barrageConfig={{
    enabled: true,
    maxDisplayCount: 30,
    display: {
      fontSize: 16,
      opacity: 0.9
    }
  }}
/>
```

### 2. 字幕支持

提供专业级的字幕支持：

```jsx
<CluoubVideo
  videoSrc="https://example.com/video.mp4"
  videoId="video1"
  userId="user1"
  username="用户名"
  tracks={[
    {
      id: "subtitle-cn",
      label: "简体中文",
      language: "zh-CN",
      src: "/video_翻译.vtt",
      kind: "subtitles",
      default: true
    },
    {
      id: "subtitle-jp",
      label: "日本語",
      language: "ja",
      src: "/video_original.vtt",
      kind: "subtitles"
    }
  ]}
/>
```

### 3. 快捷键支持

默认快捷键：

| 快捷键 | 功能 |
|--------|------|
| 空格键 | 播放/暂停 |
| ←/→ 方向键 | 快退/快进 5 秒 |
| ↑/↓ 方向键 | 增加/减少音量 10% |
| F | 全屏切换 |
| M | 静音切换 |
| S | 字幕开关 |
| B | 弹幕开关 |
| 数字键 0-9 | 跳转到视频的 0%-90% 位置 |

控制快捷键：

```jsx
<CluoubVideo
  videoSrc="https://example.com/video.mp4"
  videoId="video1"
  userId="user1"
  username="用户名"
  enableShortcuts={true} // 启用快捷键
  customShortcuts={{
    // 自定义快捷键映射
    playPause: [' ', 'k'],
    toggleFullscreen: ['f', 'F11']
  }}
/>
```

### 4. 自定义控件

灵活配置播放器控件：

```jsx
<CluoubVideo
  videoSrc="https://example.com/video.mp4"
  videoId="video1"
  userId="user1"
  username="用户名"
  controls={{
    play: true,
    volume: true,
    time: true,
    progress: true,
    settings: true,
    fullscreen: true,
    barrage: true,
    subtitles: true,
    pictureInPicture: false
  }}
/>
```

### 5. 自定义图标

使用您喜欢的图标库：

```jsx
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, MessageCircle } from 'lucide-react';

<CluoubVideo
  videoSrc="https://example.com/video.mp4"
  videoId="video1"
  userId="user1"
  username="用户名"
  customIcons={{
    playIcon: <Play size={20} />,
    pauseIcon: <Pause size={20} />,
    volumeIcon: <Volume2 size={20} />,
    muteIcon: <VolumeX size={20} />,
    fullscreenIcon: <Maximize size={20} />,
    settingsIcon: <Settings size={20} />,
    barrageIcon: <MessageCircle size={20} />
  }}
/>
```

## API 参考

### 主要属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| videoSrc | string | 必需 | 视频源 URL |
| videoId | string | 必需 | 视频唯一标识符 |
| userId | string | 必需 | 当前用户 ID |
| username | string | 必需 | 当前用户名 |
| width | string \| number | '100%' | 视频宽度 |
| height | string \| number | 'auto' | 视频高度 |
| maxWidth | string \| number | undefined | 最大宽度 |
| aspectRatio | string | '16:9' | 视频宽高比 |
| controls | ControlConfig | 见下方 | 控件配置 |
| customIcons | CustomIcons | undefined | 自定义图标 |
| thumbnailUrl | string | undefined | 缩略图 URL |
| thumbnailWidth | number | 120 | 缩略图宽度 |
| thumbnailHeight | number | 80 | 缩略图高度 |
| tracks | Track[] | [] | 字幕轨道列表 |
| enableShortcuts | boolean | true | 是否启用快捷键 |
| customShortcuts | ShortcutConfig | undefined | 自定义快捷键配置 |
| barrageConfig | BarrageConfig | undefined | 弹幕配置 |

### ControlConfig 接口

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| play | boolean | true | 播放/暂停按钮 |
| volume | boolean | true | 音量控制 |
| time | boolean | true | 时间显示 |
| progress | boolean | true | 进度条 |
| settings | boolean | true | 设置按钮 |
| fullscreen | boolean | true | 全屏按钮 |
| barrage | boolean | true | 弹幕功能 |
| subtitles | boolean | true | 字幕功能 |
| pictureInPicture | boolean | true | 画中画功能 |

### Track 接口

| 属性 | 类型 | 描述 |
|------|------|------|
| id | string | 字幕轨道唯一标识符 |
| label | string | 字幕轨道标签 |
| language | string | 字幕语言代码 |
| src | string | 字幕文件路径 |
| kind | 'subtitles' \| 'captions' \| 'descriptions' \| 'chapters' \| 'metadata' | 字幕类型 |
| default | boolean (可选) | 是否为默认轨道 |

## 架构设计

Cluoub Video Player 采用模块化、插件化的架构设计：

- **核心层**：PlayerCore 提供基础播放控制和事件管理
- **插件系统**：通过 PluginManager 支持功能扩展
- **UI 组件**：基于 React 组件构建的用户界面
- **Hooks 封装**：提供便捷的 React Hooks 接口

### 主要模块

1. **PlayerCore** - 播放器核心
   - 视频状态管理
   - 事件系统
   - 插件管理

2. **插件系统**
   - 弹幕插件 (BarragePlugin)
   - 字幕插件 (SubtitlePlugin)
   - 可自定义的插件接口

3. **UI 组件**
   - 控制面板
   - 弹幕渲染器
   - 字幕显示组件

## 浏览器兼容性

- Chrome (最新 2 个版本)
- Firefox (最新 2 个版本)
- Safari (最新 2 个版本)
- Edge (最新 2 个版本)
- 移动端主流浏览器

## 开发指南

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/your-username/cluoub-video.git
cd cluoub-video

# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev
```

### 构建项目

```bash
# 构建生产版本
pnpm run build

# 运行类型检查
pnpm run type-check

# 运行代码风格检查
pnpm run lint
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目！

## 联系我们

如有任何问题或建议，请在 GitHub 上提交 Issue 或联系我们的开发团队。