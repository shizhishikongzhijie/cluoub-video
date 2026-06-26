# Cluoub Video Player

一个现代化的 React 视频播放器组件，基于 Zustand 状态管理与函数式插件架构，支持多字幕（VTT / SRT）与 DASH 自适应码流。

## 特性

- 🎬 完整的视频播放控制功能（播放/暂停、进度、音量、全屏）
- 📝 多语言字幕轨道支持（WebVTT 与 SRT 格式，可在线调节字号、颜色、透明度、描边、加粗）
- 📺 DASH 自适应码流支持（按需加载 dashjs）
- 🧩 函数式插件系统，可按需注册 UI 层与控制按钮
- 🌐 完整的 TypeScript 类型定义

## 安装

```bash
npm install @cluoub-design/cluoub-video
# 或
pnpm add @cluoub-design/cluoub-video
```

## 快速开始

```tsx
import React from 'react'
import { CluoubVideo } from '@cluoub-design/cluoub-video'

function App() {
  return (
    <CluoubVideo
      source="https://example.com/video.mp4"
      width="800px"
      aspectRatio="16:9"
    />
  )
}

export default App
```

> 注意：组件以**命名导出** `CluoubVideo` 提供，请使用 `import { CluoubVideo }` 而非默认导入。

## 插件用法

播放器本身只负责核心播放能力，字幕、DASH 等功能以插件形式按需启用，通过 `plugins` 属性传入。

### 字幕插件

字幕轨道通过 `tracks` 属性传入，并启用 `subtitlePlugin`：

```tsx
import { CluoubVideo } from '@cluoub-design/cluoub-video'
import { subtitlePlugin, type SubtitleTrack } from '@cluoub-design/cluoub-video/plugins/subtitle'

const tracks: SubtitleTrack[] = [
  { id: '1', label: '简体中文', lang: 'zh', type: 'vtt', src: '/subtitles/zh.vtt' },
  { id: '2', label: 'English', lang: 'en', type: 'srt', src: '/subtitles/en.srt' }
]

<CluoubVideo
  source="https://example.com/video.mp4"
  plugins={[subtitlePlugin]}
  tracks={tracks}
/>
```

VTT 与 SRT 两种格式均受支持，时间戳分隔符（`.` 与 `,`）会被自动识别。

### DASH 插件

```tsx
import { CluoubVideo } from '@cluoub-design/cluoub-video'
import { dashPlugin } from '@cluoub-design/cluoub-video/plugins/dash'

<CluoubVideo
  source="https://example.com/stream.mpd"
  plugins={[dashPlugin]}
/>
```

## API 参考

### CluoubVideo 主要属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| source | string \| VideoSource \| VideoSource[] | 必需 | 视频源 |
| poster | string | undefined | 封面图 |
| width | string \| number | undefined | 视频宽度 |
| height | string \| number | undefined | 视频高度 |
| aspectRatio | string | undefined | 视频宽高比，如 `'16:9'` |
| themeColor | string | `#35ddd8` | 主题色 |
| autoPlay | boolean | false | 自动播放 |
| loop | boolean | false | 循环播放 |
| muted | boolean | false | 静音 |
| controls | boolean \| PlayerControlsConfig | true | 控件配置 |
| plugins | IPlayerPlugin[] | [] | 插件列表 |
| tracks | SubtitleTrack[] | [] | 字幕轨道（由字幕插件消费） |
| thumbnail | { url, cols, rows, interval } | undefined | 缩略图雪碧图配置 |
| onReady | (player) => void | undefined | 播放器就绪回调 |
| onPlay / onPause / onEnded | () => void | undefined | 播放状态回调 |
| onError | (err) => void | undefined | 错误回调 |

### SubtitleTrack 接口

| 属性 | 类型 | 描述 |
|------|------|------|
| id | string | 字幕轨道唯一标识符 |
| label | string | 字幕轨道显示名称 |
| lang | string | 字幕语言代码，如 `'zh'` |
| src | string | 字幕文件 URL |
| type | `'vtt'` \| `'srt'` \| `'ass'` | 字幕格式（`ass` 暂未实现渲染） |

## 架构设计

Cluoub Video Player 采用「核心 + 状态 + 函数式插件」的架构：

- **核心层（`core/createPlayer`）**：封装 `<video>` 元素的生命周期、原生事件绑定与统一清理，提供播放控制 API 与简单的事件总线。
- **状态层（`core/store`）**：基于 Zustand 的单一数据源，管理播放状态与插件 UI 注册表。
- **React 绑定（`hooks/usePlayer`）**：负责播放器的挂载与销毁，保证仅初始化一次。
- **UI 层（`Controls` / `Layers`）**：纯展示组件，订阅 store 切片渲染控制栏与覆盖层。
- **插件（`plugins/*`）**：形如 `(player) => cleanup` 的函数，通过 `registerUI` / `unregisterUI` 向播放器注入控制按钮或覆盖层，零侵入核心。

## 浏览器兼容性

- Chrome / Firefox / Safari / Edge（最新 2 个版本）
- 移动端主流浏览器

## 开发指南

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build

# 代码风格检查
pnpm run lint
```

## 许可证

MIT License
