# Cluoub Video Player

一个现代化、可定制的 React 视频播放器组件，基于 Zustand 状态管理与函数式插件架构。支持多字幕（WebVTT / SRT / ASS）、DASH / HLS 自适应码流、Canvas 弹幕（含外部控制与操作栏）、截图 / GIF 录制、播放列表连播、进度续播等能力。

> 当前版本：`0.1.0-beta.0`（首个测试版本）

## 特性

- 🎬 完整播放控制：播放/暂停、进度、音量、倍速、全屏、宽屏 / 小窗模式、画中画（原生 PiP）
- 📝 多语言字幕：WebVTT / SRT / ASS；可在线调节字号、颜色、透明度、描边、加粗、同步偏移；ASS 使用 libjass 完整渲染
- 📺 DASH / HLS 自适应码流：按需动态加载 dashjs / hls.js（可选依赖），自动 ABR 与手动画质切换
- 💬 Canvas 弹幕：滚动 / 顶部 / 底部，碰撞检测分配弹道；对外暴露 `player.danmu` API 与 `<DanmuBar />` 操作栏（B 站式）
- 📷 截图 / GIF 录制：原生 Canvas 图层合成（视频帧 + 弹幕层 + 字幕），无需 DOM 序列化
- 📃 播放列表连播：`playlist` + 上一集 / 下一集 / 自动连播
- 💾 本地持久化：记忆音量 / 倍速 / 续播进度（按视频源 key 存储于 localStorage）
- 🔄 Props 响应式更新：`source` / `playlist` / `plugins` 变化不重建实例，保留播放状态
- 🧩 函数式插件系统：`(player) => cleanup`，零侵入核心，可注册 UI 层与控制按钮
- 🌐 完整 TypeScript 类型定义，ESM + CJS 双格式产物

## 安装

```bash
npm install @cluoub-design/cluoub-video
# 或
pnpm add @cluoub-design/cluoub-video
```

`react` / `react-dom` 为 peerDependencies（使用方需自行安装）。`dashjs` / `hls.js` / `libjass` 为可选 peerDependencies，仅在启用对应功能时需要（见下文各插件说明）。

## 快速开始

组件为**命名导出** `CluoubVideo`；样式通过单独的 CSS 文件引入：

```tsx
import { CluoubVideo } from '@cluoub-design/cluoub-video'
import '@cluoub-design/cluoub-video/dist/cluoub-video.css'

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

> 不要使用默认导入 `import CluoubVideo from ...`（组件仅提供命名导出）。

## 基础用法

### 视频源与多画质

`source` 支持字符串、单个 `VideoSource`，或 `VideoSource[]` 多画质数组（控制栏出现画质切换按钮）：

```tsx
<CluoubVideo
  source={[
    { src: 'https://example.com/video-1080.mp4', quality: '1080P' },
    { src: 'https://example.com/video-720.mp4', quality: '720P' },
    { src: 'https://example.com/video-480.mp4', quality: '480P' }
  ]}
/>
```

### 播放列表连播

```tsx
const playlist = [
  { source: '/ep1.mp4', title: '第一集' },
  { source: '/ep2.mp4', title: '第二集' }
]

<CluoubVideo
  source={playlist[0].source}
  playlist={playlist}
  autoNext          // 单集播完自动播下一集
  onPlaylistChange={({ index, item }) => console.log('切换到', index, item.title)}
/>
```

### 实例 API（ref）

```tsx
const ref = useRef<VideoRef>(null)

<CluoubVideo ref={ref} source="/video.mp4" />

ref.current?.play()
ref.current?.seek(30)
ref.current?.setPlaybackRate(1.5)
ref.current?.toggleFullscreen()
ref.current?.setScreenMode('wide')
const url = await ref.current?.captureComposite() // 合成截图（视频+弹幕+字幕）
```

### Props 响应式更新

切换 `source` / `playlist` / `plugins` 不会销毁重建播放器实例，播放状态（当前时间、音量等）得以保留：

```tsx
const [src, setSrc] = useState('/a.mp4')
return <CluoubVideo source={src} /* 后续 setSrc('/b.mp4') 自动切换 */ />
```

## Props 参考

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| source | `string \| VideoSource \| VideoSource[]` | 必需 | 视频源（支持多画质数组） |
| playlist | `PlaylistItem[]` | undefined | 播放列表 |
| autoNext | boolean | false | 单集播完自动播下一集 |
| poster | string | undefined | 封面图 |
| width / height | string \| number | undefined | 容器尺寸 |
| aspectRatio | string | undefined | 宽高比，如 `'16:9'` / `'21:9'` |
| themeColor | string | `#35ddd8` | 主题色 |
| autoPlay | boolean | false | 自动播放（需 muted 等满足浏览器策略） |
| loop | boolean | false | 循环播放 |
| muted | boolean | false | 静音 |
| controls | boolean \| `PlayerControlsConfig` | true | 控件配置（`false` 隐藏全部内置控件） |
| persist | boolean \| `{ progress?; volume?; playbackRate? }` | undefined | 本地持久化（续播 / 音量 / 倍速） |
| plugins | `IPlayerPlugin[]` | [] | 插件列表 |
| thumbnail | `ThumbnailConfig` | undefined | 进度条悬停预览（雪碧图 / 视频抽帧） |
| onReady | `(player: PlayerInstance) => void` | undefined | 播放器就绪回调 |
| onPlay / onPause / onEnded | `() => void` | undefined | 播放状态回调 |
| onError | `(err) => void` | undefined | 错误回调 |
| onQualityChange | `(info) => void` | undefined | 画质切换回调（`{ mode, activeKey, label }`） |
| onPlaylistChange | `(info) => void` | undefined | 播放列表切换回调（`{ index, item }`） |

`PlayerControlsConfig`：`play` / `volume` / `time` / `progress` / `fullscreen` / `settings` / `pip` / `danmu` / `quality` / `speed` / `screenMode`，均为 boolean，未指定字段默认显示。

> 组件接受任意额外 props 并透传给播放器 `options`，供插件读取自定义配置（如 `tracks`、`danmuList`、`capture` 等）。

## 插件用法

播放器核心只负责播放；字幕、弹幕、流媒体、截图等能力以插件形式按需启用（`plugins` 属性）。各插件也可从对应子路径导入。

### 字幕插件 `subtitlePlugin`

```tsx
import { CluoubVideo } from '@cluoub-design/cluoub-video'
import { subtitlePlugin, type SubtitleTrack } from '@cluoub-design/cluoub-video/plugins/subtitle'

const tracks: SubtitleTrack[] = [
  { id: '1', label: '简体中文', lang: 'zh', type: 'vtt', src: '/subtitles/zh.vtt' },
  { id: '2', label: 'English', lang: 'en', type: 'srt', src: '/subtitles/en.srt' },
  { id: '3', label: '日文', lang: 'ja', type: 'ass', src: '/subtitles/ja.ass' }
]

<CluoubVideo
  source="/video.mp4"
  plugins={[subtitlePlugin]}
  tracks={tracks}
/>
```

- VTT 与 SRT 均支持，时间戳分隔符 `.` / `,` 自动识别。
- 字幕设置面板：轨道下拉、开关、同步偏移（`subtitleOffset`，±5s 步进 0.5s）、字号 / 颜色 / 透明度 / 描边 / 加粗。
- **ASS 轨道**使用 [libjass](https://github.com/Arnavion/libjass) 完整渲染（含特效 / 定位），需额外安装可选依赖：

```bash
npm install libjass
```

  > libjass 未安装时 ASS 轨道静默回退为不渲染，不影响 VTT / SRT；ASS 使用文件内嵌样式，样式面板对 ASS 不生效。

| SubtitleTrack | 类型 | 描述 |
|---|---|---|
| id | string | 轨道唯一标识 |
| label | string | 显示名称 |
| lang | string | 语言代码（如 `'zh'`） |
| src | string | 字幕文件 URL |
| type | `'vtt' \| 'srt' \| 'ass'` | 字幕格式 |

### 弹幕插件 `danmuPlugin`

弹幕在 `<canvas>` 上渲染（与 B 站 / DPlayer 一致），`danmuList` 提供时间轴数据并按 `currentTime` 自动发射，支持滚动 / 顶部 / 底部与碰撞检测分配弹道。进度条拖动（seek）时弹幕清空并从新位置重新计算。

```tsx
import { CluoubVideo } from '@cluoub-design/cluoub-video'
import { danmuPlugin, type DanmuItem } from '@cluoub-design/cluoub-video/plugins/danmu'

const danmuList: DanmuItem[] = [
  { time: 1, text: '你好呀 👋', color: '#35ddd8' },
  { time: 4, text: '顶部弹幕', mode: 'top' }
]

<CluoubVideo
  source="/video.mp4"
  plugins={[danmuPlugin]}
  danmuList={danmuList}
  defaultShow
/>
```

**外部控制（B 站式）**：安装插件后 `player.danmu`（`DanmuAPI`）即成为外部控制入口，可在任意自定义输入框 / 按钮中调用：

```ts
const danmu = player.danmu
danmu?.send('自定义弹幕', { mode: 'scroll', color: '#ffd54a' }) // 发送
danmu?.setVisible(false)    // 开关弹幕
danmu?.toggleVisible()
danmu?.setMode('top')       // 默认发送模式：滚动 / 顶部 / 底部
danmu?.setColor('#ff0000')  // 默认发送颜色
```

> 弹幕隐藏时 `send` 为 no-op（与 B 站一致：弹幕关闭即不可发送）。

**弹幕操作栏 `<DanmuBar />`**（输入框 + 发送 + 模式 / 颜色 / 开关），两种放置方式：

```tsx
import { DanmuBar } from '@cluoub-design/cluoub-video'

// 1) 外部渲染到播放器下方等专门区域：
<div style={{ marginTop: 12 }}>{player && <DanmuBar player={player} />}</div>

// 2) 或由插件挂载到播放器底部（showDanmuBar，控制栏出现时自动上移）：
<CluoubVideo plugins={[danmuPlugin]} showDanmuBar />
```

| DanmuConfig | 类型 | 默认值 | 描述 |
|---|---|---|---|
| danmuList | `DanmuItem[]` | [] | 时间轴弹幕数据 |
| defaultShow | boolean | true | 默认显示弹幕 |
| showDanmuBar | boolean | false | 在播放器底部挂载内置操作栏 |
| danmuColor | string | `#ffffff` | 默认发送颜色 |
| danmuMode | `'scroll' \| 'top' \| 'bottom'` | `'scroll'` | 默认发送模式 |

| DanmuItem | 类型 | 描述 |
|---|---|---|
| time | number | 出现时间（秒） |
| text | string | 文本内容 |
| color? | string | 颜色，默认白 |
| mode? | `'scroll' \| 'top' \| 'bottom'` | 模式，默认滚动 |

### DASH / HLS 插件

按需加载 dashjs / hls.js（可选 peerDependencies，需使用方安装），原生支持 HLS 的浏览器（如 Safari）自动直接播放：

```tsx
import { dashPlugin } from '@cluoub-design/cluoub-video/plugins/dash'
import { hlsPlugin } from '@cluoub-design/cluoub-video/plugins/hls'

// DASH
<CluoubVideo source="https://example.com/stream.mpd" plugins={[dashPlugin]} />

// HLS
<CluoubVideo source="https://example.com/stream.m3u8" plugins={[hlsPlugin]} />
```

```bash
npm install dashjs      # DASH 需要
npm install hls.js      # HLS 需要
```

### 截图 / GIF 录制插件 `capturePlugin`

```tsx
import { capturePlugin } from '@cluoub-design/cluoub-video/plugins/capture'

<CluoubVideo
  source="/video.mp4"
  plugins={[capturePlugin]}
  capture={{ screenshot: true, gif: true, gifFps: 10, gifDuration: 3, filename: 'cluoub' }}
/>
```

- 截图 / GIF 按钮以右侧竖排工具栏悬浮在视频右边缘中部（不占用底部控制栏）。
- **原生 Canvas 合成捕获**：与 B 站 / DPlayer 一致，弹幕在 `<canvas>` 上渲染并注册为捕获层，截图 / GIF 直接按图层合成「视频帧 + 弹幕 canvas + 字幕文本」，无需 DOM 序列化（无 foreignObject），工具栏自身不会入画。
- 截图：下载当前帧 PNG。GIF：点击开始录制，再次点击或达到 `gifFps × gifDuration` 上限后编码下载（基于 gifenc，运行时依赖自动安装）。
- 跨域视频未配置 CORS 时 canvas 会被污染，截图 / 录制自动失败。

| CaptureConfig | 类型 | 默认值 | 描述 |
|---|---|---|---|
| screenshot | boolean | true | 启用截图按钮 |
| gif | boolean | true | 启用 GIF 录制按钮 |
| gifFps | number | 10 | GIF 帧率 |
| gifDuration | number | 3 | GIF 录制时长（秒） |
| filename | string | `cluoub-<时间戳>` | 下载文件名前缀 |
| onGifReady | `(url: string) => void` | undefined | GIF 编码完成回调（临时 objectURL） |

## 实例 API 参考

### VideoRef（通过 `ref` 获取）

| 方法 | 签名 | 描述 |
|---|---|---|
| play / pause / togglePlay | `() => void` | 播放控制 |
| seek | `(time: number) => void` | 跳转 |
| setVolume / toggleMute | `(vol) => void` / `() => void` | 音量 |
| setPlaybackRate | `(rate: number) => void` | 倍速 |
| toggleFullscreen | `() => void` | 全屏 |
| togglePip | `() => Promise<void>` | 画中画（原生） |
| setScreenMode / toggleScreenMode | `(mode) => void` / `() => void` | 屏幕模式（normal / wide / small） |
| playIndex / next / prev | `(index) => void` / `() => void` | 播放列表 |
| captureFrame | `(opts?) => string \| null` | 单帧截图 dataURL |
| captureFrames | `(opts?) => Promise<string[]>` | 多帧截图（用于 GIF） |
| captureComposite | `(opts?) => Promise<string \| null>` | 合成截图（视频 + 弹幕 + 字幕） |
| getVideoElement | `() => HTMLVideoElement \| null` | 底层 `<video>` |
| getPlayer | `() => PlayerInstance \| null` | 完整播放器实例（含 store / danmu / 事件总线） |

### PlayerInstance（通过 `onReady(player)` 或 `getPlayer()` 获取）

在 VideoRef 方法基础上，额外提供：

- `store`：Zustand store（`getState()` / `setState()` / `subscribe()`），含 `isPlaying`、`currentTime`、`danmuMode`、`danmuColor`、`uiRegistry` 等全部播放状态。
- `danmu?`：`DanmuAPI`（弹幕插件安装后可用，见上文）。
- `on / off / emit`：事件总线，用于插件间通信。
- `registerUI / unregisterUI`：注册 / 注销插件 UI。
- `registerCaptureLayer / unregisterCaptureLayer`：注册 / 注销 canvas 捕获层。
- `updateSource / updatePlaylist / applyOptions`：响应式更新。

## 进度条预览缩略图

`thumbnail` 支持两种模式：

**1. 雪碧图（独立缩略图文件）**

```tsx
thumbnail={{ type: 'sprite', url: '/thumbs.jpg', cols: 5, rows: 4, interval: 10 }}
```

单张图片按 `cols × rows` 网格切分，每格代表 `interval` 秒，适合 HLS / DASH 等无法随机 seek 的源。

**2. 视频抽帧（直接对视频源取帧）**

```tsx
thumbnail={{ type: 'video' }}                       // 自动使用当前播放源
thumbnail={{ type: 'video', source: '/movie.mp4' }} // 或指定抽帧源
```

悬停浮窗自动钳位在容器 / 视口内，三角箭头始终指向实际悬停位置；带按秒缓存与并发取消，适合 mp4 等可随机 seek 的源。跨域未授权视频受 canvas 污染限制无法取帧。

## 屏幕模式

控制栏屏幕模式按钮按 `normal → wide → small → normal` 循环切换：常规、宽屏（21:9）、小窗（50% 宽度）。可用 `controls={{ screenMode: false }}` 隐藏，或调用 `setScreenMode` / `toggleScreenMode`。

## 持久化

`persist` 开启后按视频源 URL 为 key 记忆音量、倍速，并在播放到中途时记录断点、下次自动续播：

```tsx
persist                          // 全部开启
persist={{ progress: true }}     // 仅续播
persist={{ volume: true, playbackRate: true }}
```

## 事件回调

```tsx
<CluoubVideo
  onReady={(player) => console.log('ready')}
  onPlay={() => {}}
  onPause={() => {}}
  onEnded={() => {}}
  onError={(err) => console.error(err)}
  onQualityChange={({ mode, activeKey, label }) => {}}
  onPlaylistChange={({ index, item }) => {}}
/>
```

## 开发插件

插件是形如 `(player) => cleanup` 的纯函数，通过 `registerUI` / `unregisterUI` 注入 UI：

```tsx
import type { IPlayerPlugin } from '@cluoub-design/cluoub-video'

export const myPlugin: IPlayerPlugin = (player) => {
  player.registerUI('my-badge', <span>自定义徽标</span>, 'layer', { zIndex: 15 })
  player.registerUI('my-btn', <button onClick={...}>按钮</button>, 'control', { position: 'right', order: 9 })
  return () => player.unregisterUI('my-badge')
}
```

- `type: 'layer'`：绝对定位覆盖层，`zIndex` 决定层级（字幕 5、弹幕 8、控制栏 20）。
- `type: 'control'`：控制栏按钮，`position` / `order` 决定位置。
- 插件可读写 `player.store`、通过 `player.on / emit` 通信、`registerCaptureLayer` 注册 canvas 捕获层参与截图合成。

## 架构设计

- **核心层（`core/createPlayer`）**：封装 `<video>` 生命周期、原生事件绑定与统一清理，提供播放控制 API 与事件总线。
- **持久化（`core/persistence`）**：音量 / 倍速 / 续播的节流落盘，按视频源 URL 为 key 存于 localStorage。
- **状态层（`core/store`）**：基于 Zustand 的单一数据源，管理播放状态与插件 UI 注册表。
- **React 绑定（`hooks/usePlayer`）**：挂载 / 销毁仅一次；对 `source` / `playlist` / `plugins` 及标量配置做响应式 diff，增量更新、不重建实例。
- **UI 层（`Controls` / `Layers`）**：订阅 store 切片渲染控制栏与覆盖层。
- **插件（`plugins/*`）**：`(player) => cleanup`，零侵入核心；DASH / HLS 共享 `plugins/streaming` 接管 / 让出脚手架；`plugins/capture` 提供截图 / GIF；`plugins/subtitle` 的 ASS 经 `assRenderer` 封装 libjass。

## 打包产物与导入路径

构建产出（`dist/`）：

| 产物 | 说明 |
|---|---|
| `index.mjs` | ESM 格式 |
| `index.cjs` | CJS 格式 |
| `index.d.ts` | TypeScript 类型（rollup 汇总单文件） |
| `cluoub-video.css` | 组件样式（需显式引入） |
| `stats.html` | 产物体积分析 |

包导出映射（`package.json#exports`）：`@cluoub-design/cluoub-video` 主入口；`./plugins/subtitle`、`./plugins/dash`、`./plugins/hls`、`./plugins/danmu`、`./plugins/capture` 子路径；`./dist/cluoub-video.css` 样式。`react` / `react-dom` / `lucide-react` 外部化，`dashjs` / `hls.js` / `libjass` 动态导入、外部化。

## 浏览器兼容性

- Chrome / Firefox / Safari / Edge（最新 2 个版本）
- 移动端主流浏览器

## 开发指南

```bash
# 安装依赖
pnpm install

# 启动开发服务器（demo）
pnpm run dev

# 构建生产版本（含类型声明）
pnpm run build

# 代码风格检查
pnpm run lint

# 类型检查
pnpm run typecheck

# 单元测试
pnpm test          # 或 pnpm exec vitest run --maxWorkers=2（低内存机器）
```

## 许可证

MIT License