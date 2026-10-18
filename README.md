# Cluoub Video Player

> A modern, plugin-first web video player with a framework-neutral Headless Core.
>
> MP4 · HLS · DASH · WebVTT · SRT · ASS · Danmaku · Capture · TypeScript

Cluoub Video Player 是一个面向现代 Web 应用的视频播放器 SDK。它以轻量 Headless Core 为基础，将默认 React UI、字幕、流媒体、弹幕和截图能力拆分为独立入口，通过统一的播放器实例、插件运行时和 Slot API 按需组合功能。

当前代码版本：`0.3.0-beta.2`。代码、Demo 构建和 Pages 部署配置已完成；公开 Demo 地址以实际部署结果为准。

## 为什么是 Cluoub Video Player？

很多播放器已经能完成“播放视频”。Cluoub 更关注的是：怎样让播放器能力像 SDK 一样被组合、替换和扩展。

- **Plugin-first**：字幕、DASH、HLS、弹幕、截图 / GIF 都是独立插件
- **Headless Core**：纯 TypeScript / DOM 生命周期，不导入 React、ReactDOM 或 Lucide
- **React primitives**：Provider、Root、Slot 与 hooks 可自由组合，默认播放器仍保留 Cluoub 视觉和交互
- **Streaming-ready**：DASH / HLS 共用取消、切源和画质状态契约
- **Advanced subtitles**：WebVTT / SRT / ASS，多轨字幕与样式 / 偏移控制
- **Danmaku built-in**：Canvas 弹幕、碰撞检测、外部发送 API 与操作栏
- **Composite capture**：合成视频帧、弹幕与字幕进行截图 / GIF 录制
- **TypeScript-first**：强类型插件配置、ESM / CJS 和分入口声明文件

## 核心能力

| 能力 | 当前状态 | 说明 |
|---|---|---|
| 基础播放控制 | ✅ | 播放 / 暂停 / 进度 / 音量 / 倍速 / 全屏 / PiP |
| MP4 多画质 | ✅ | 切换时保留时间、播放状态、音量和倍速 |
| HLS | ✅ Plugin | hls.js / Safari Native HLS，异步取消与过期保护 |
| DASH | ✅ Plugin | dashjs、ABR / 手动画质切换 |
| WebVTT / SRT / ASS | ✅ Plugin | 多轨字幕、样式与同步偏移 |
| Canvas 弹幕 | ✅ Plugin | 滚动 / 顶部 / 底部与碰撞检测 |
| 截图 / GIF | ✅ Plugin | 视频 + 弹幕 + 字幕 Canvas 合成 |
| 播放列表 | ✅ | 上一集 / 下一集 / 自动连播 |
| 续播持久化 | ✅ | 按视频源保存进度 / 音量 / 倍速 |
| 插件 Schema / Slot | ✅ | 严格配置、错误隔离、确定性 Slot 排序 |
| Headless Core | ✅ | 独立于 React UI 使用 |
| Vue / Svelte | Roadmap | v0.4 官方绑定 |
| AI Plugins | Roadmap | 摘要 / 章节 / 翻译 / 视频问答 |

## 安装

```bash
npm install @cluoub-design/cluoub-video@0.3.0-beta.2
# 或
pnpm add @cluoub-design/cluoub-video@0.3.0-beta.2
```

`react` / `react-dom` 是 React 入口的 peer dependencies。`dashjs`、`hls.js`、`libjass` 是对应插件的可选 peer dependencies。
可选插件请从 `plugins/dash`、`plugins/hls` 或 `plugins/subtitle` 子路径显式导入；未使用的插件不需要加入应用依赖。

## 默认 React 播放器

新代码推荐从 `/react` 导入默认组件，并通过 `.configure()` 显式传入插件配置：

```tsx
import { CluoubVideo } from '@cluoub-design/cluoub-video/react'
import { hlsPlugin } from '@cluoub-design/cluoub-video/plugins/hls'
import { subtitlePlugin } from '@cluoub-design/cluoub-video/plugins/subtitle'
import '@cluoub-design/cluoub-video/styles.css'

export default function App() {
  return (
    <CluoubVideo
      source="https://example.com/live.m3u8"
      plugins={[
        hlsPlugin.configure({}),
        subtitlePlugin.configure({
          tracks: [
            { id: 'zh', label: '简体中文', lang: 'zh', type: 'vtt', src: '/zh.vtt' }
          ]
        })
      ]}
      aspectRatio="16:9"
    />
  )
}
```

`CluoubVideoProps` 不再接受任意字段。字幕、弹幕、截图和 DASH 配置属于各自插件，不会进入播放器 Props。

### MP4 多画质

```tsx
<CluoubVideo
  source={[
    { src: '/video-1080.mp4', quality: '1080P' },
    { src: '/video-720.mp4', quality: '720P' },
    { src: '/video-480.mp4', quality: '480P' }
  ]}
  onQualityChange={({ mode, activeKey, label }) => {
    console.log(mode, activeKey, label)
  }}
/>
```

### 播放列表与持久化

```tsx
<CluoubVideo
  source="/ep1.mp4"
  playlist={[
    { source: '/ep1.mp4', title: '第一集' },
    { source: '/ep2.mp4', title: '第二集' }
  ]}
  autoNext
  persist={{ progress: true, volume: true, playbackRate: true }}
/>
```

## Headless Core

`/core` 入口只依赖 DOM 与状态核心，可直接创建、挂载、更新和销毁播放器：

```ts
import { createPlayer } from '@cluoub-design/cluoub-video/core'

const container = document.querySelector<HTMLElement>('#player')!
const player = createPlayer({
  source: '/video.mp4',
  persist: true,
  onPlay: () => console.log('playing')
})

player.mount(container)
await player.play()
player.updateSource('/next.mp4')

// 页面卸载时；重复调用安全
player.destroy()
```

## React Headless primitives

`/react` 同时提供：

- `PlayerProvider`
- `PlayerRoot`
- `PlayerSlot`
- `usePlayer`
- `usePlayerState`
- `usePlayerInstance`
- `usePluginApi`
- `usePlayerEvent`

```tsx
import {
  PlayerProvider,
  PlayerRoot,
  usePlayer,
  usePlayerInstance,
  usePlayerState
} from '@cluoub-design/cluoub-video/react'

function Controls() {
  const player = usePlayerInstance()
  const playing = usePlayerState((state) => state.isPlaying)
  return <button onClick={player.togglePlay}>{playing ? '暂停' : '播放'}</button>
}

export function HeadlessPlayer() {
  const player = usePlayer({ source: '/video.mp4' })
  if (!player) return null
  return (
    <PlayerProvider player={player}>
      <PlayerRoot>
        <Controls />
      </PlayerRoot>
    </PlayerProvider>
  )
}
```

仓库 Demo 的 `#/headless` 页面使用真实播放器状态实现自定义控制栏和主题，没有复制默认控件状态。

## 插件 API

### definePlugin 与 configure

```tsx
import { definePlugin } from '@cluoub-design/cluoub-video/core'

interface BadgeConfig {
  text: string
}

export const badgePlugin = definePlugin<BadgeConfig>({
  id: 'badge',
  schema: {
    parse(input) {
      if (!input || typeof input !== 'object' || typeof (input as BadgeConfig).text !== 'string') {
        throw new TypeError('badge.text must be a string')
      }
      return input as BadgeConfig
    }
  },
  setup(context, config) {
    context.slots.register({
      id: 'badge-label',
      slot: 'overlay',
      order: 10,
      content: <span>{config.text}</span>
    })
  }
})

const configured = badgePlugin.configure({ text: 'LIVE' })
```

插件上下文提供作用域化事件、Slot、捕获层、`AbortSignal` 和错误上报。运行时会自动回收注册资源；销毁时按安装逆序清理。

固定 Slot：

- `overlay`
- `controls.progress`
- `controls.leading`
- `controls.trailing`
- `controls.settings`
- `below`

同一 Slot 按 `order`、再按注册顺序渲染。单个插件配置、运行、渲染或清理错误会以 `PluginError` 通过 `onPluginError` 和 `plugin:error` 事件报告，不拖垮其他插件。

### 内置插件

```tsx
import { capturePlugin } from '@cluoub-design/cluoub-video/plugins/capture'
import { danmuPlugin } from '@cluoub-design/cluoub-video/plugins/danmu'
import { dashPlugin } from '@cluoub-design/cluoub-video/plugins/dash'
import { hlsPlugin } from '@cluoub-design/cluoub-video/plugins/hls'
import { subtitlePlugin } from '@cluoub-design/cluoub-video/plugins/subtitle'

const plugins = [
  danmuPlugin.configure({ danmuList: [], defaultShow: true }),
  subtitlePlugin.configure({ tracks: [] }),
  capturePlugin.configure({ screenshot: true, gif: true }),
  dashPlugin.configure({ dataPrefix: '/media/' }),
  hlsPlugin.configure({})
]
```

插件 API 通过定义对象取回，避免字符串类型丢失：

```ts
const danmu = player.plugins.get(danmuPlugin)
danmu?.send('你好', { mode: 'top', color: '#35ddd8' })
```

## 主题与默认 UI

默认 UI 使用 `--cluoub-*` 语义令牌，同时兼容旧 `--theme-color` / `--color-primary`：

```css
.my-player-theme {
  --cluoub-accent: #65e6d9;
  --cluoub-background: #050807;
  --cluoub-text: #f4fffd;
  --cluoub-focus-ring: #65e6d9;
}
```

默认值与 0.1 视觉保持一致，并补齐 `focus-visible`、禁用态、390px 窄屏和 `prefers-reduced-motion`。

## 0.3 beta 兼容层

根入口是临时的 0.1 兼容 facade。它仍支持：

- `import { CluoubVideo } from '@cluoub-design/cluoub-video'`
- 顶层 `tracks`、`danmuList`、`capture`、`dataPrefix` 等旧插件 Props
- `plugins={[danmuPlugin]}` 未配置形式
- `player.danmu`
- `registerUI` / `unregisterUI` 旧插件形式

兼容入口会把旧配置翻译为新插件实例。删除条件和迁移步骤见 [0.3 migration guide](docs/migration-0.3.md)。

## 包入口

| 入口 | 内容 |
|---|---|
| `@cluoub-design/cluoub-video` | 0.1 临时兼容 facade |
| `@cluoub-design/cluoub-video/core` | Headless Core、插件定义和公共类型 |
| `@cluoub-design/cluoub-video/react` | 默认组件、primitives 和 hooks |
| `@cluoub-design/cluoub-video/plugins/*` | 单个内置插件 |
| `@cluoub-design/cluoub-video/styles.css` | 默认 React UI 样式 |

`./core` 的构建图有自动门禁，禁止 React、ReactDOM 和 Lucide 进入；各插件使用独立入口。兼容根入口当前实测 `0.96 kB gzip`（入口 chunk），低于 0.1 基线 `25.51 kB gzip`。完整预算记录在 `bundle-budgets.json`。

## Demo 与 Pages

- 在线 Demo：https://shizhishikongzhijie.github.io/cluoub-video/
- 默认播放器 Demo：`#/default`
- Headless 自定义控制栏 Demo：`#/headless`
- 两者共用 `/cluoub-video/` base path 和同一个 `demo-dist` 产物
- GitHub Pages 使用官方 Actions：`.github/workflows/pages.yml`
- Gitee Pages 使用同一产物，准备与发布说明见 [Pages deployment](docs/pages-deployment.md)

发布状态以 npm registry、Git 标签和对应 Pages 部署记录为准；仓库文档不预设尚未验证的公开 URL。

## 开发与验证

```bash
pnpm install
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run build
pnpm run check:types
pnpm run check:exports
pnpm run check:size
pnpm run test:e2e
```

当前验证基线：24 个测试文件、141 项测试通过。

## 参与贡献与安全

- 贡献流程与本地门禁：[CONTRIBUTING.md](CONTRIBUTING.md)
- 安全支持和私密漏洞报告：[SECURITY.md](SECURITY.md)
- 社区协作规范：[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- `master` 保护、合并及发布策略：[Repository governance](docs/repository-governance.md)

## Roadmap

### v0.4 — Framework Bindings

- Vue 官方绑定
- Svelte 官方绑定
- 保持 Core / Plugin API 一致

### Future — AI-ready Video Player

AI 能力只会以可选插件探索，不进入 Headless Core：字幕翻译、章节、摘要、语义搜索和视频问答。

## 开源协议

本项目采用 [Apache License 2.0](LICENSE)。允许个人及商业使用、修改和再分发；分发源码或构建产物时，必须保留许可证、版权及 [NOTICE](NOTICE) 中的 Cluoub Video 来源声明。修改后的文件还应明确标注已作修改。
