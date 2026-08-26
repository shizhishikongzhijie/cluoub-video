# Migrating to 0.3 beta

`0.3.0-beta.0` 将框架无关 Core、React 绑定和内置插件拆成独立入口。根入口暂时保留 0.1 兼容行为。

## 推荐迁移顺序

1. 将默认组件和 hooks 改为从 `/react` 导入。
2. 将 `tracks`、`danmuList`、`capture`、`dataPrefix` 等顶层 Props 移入插件 `.configure()`。
3. 将 `player.danmu` 改为 `player.plugins.get(danmuPlugin)`。
4. 将旧 `registerUI` 插件迁移为 `definePlugin` 和固定 Slot。
5. 引入 `@cluoub-design/cluoub-video/styles.css`。

## React 组件

Before:

```tsx
import { CluoubVideo, danmuPlugin, subtitlePlugin } from '@cluoub-design/cluoub-video'

<CluoubVideo
  source="/video.mp4"
  plugins={[danmuPlugin, subtitlePlugin]}
  danmuList={items}
  tracks={tracks}
/>
```

After:

```tsx
import { CluoubVideo } from '@cluoub-design/cluoub-video/react'
import { danmuPlugin } from '@cluoub-design/cluoub-video/plugins/danmu'
import { subtitlePlugin } from '@cluoub-design/cluoub-video/plugins/subtitle'

<CluoubVideo
  source="/video.mp4"
  plugins={[
    danmuPlugin.configure({ danmuList: items }),
    subtitlePlugin.configure({ tracks })
  ]}
/>
```

新 `CluoubVideoProps` 没有 `[key: string]: any`。无效类型和未知插件配置字段会产生 `PluginError`，只禁用对应插件。

## 插件 API

Before:

```tsx
const badgePlugin = (player) => {
  player.registerUI('badge', <span>LIVE</span>, 'layer')
  return () => player.unregisterUI('badge')
}
```

After:

```tsx
import { definePlugin } from '@cluoub-design/cluoub-video/core'

const badgePlugin = definePlugin({
  id: 'badge',
  setup(context) {
    context.slots.register({ id: 'badge-label', slot: 'overlay', content: <span>LIVE</span> })
  }
})
```

作用域事件、Slot 和捕获层由运行时自动清理。异步插件应使用 `context.signal` 停止过期工作，并用 `context.reportError` 上报运行时错误。

## Headless

不需要默认 React UI 时从 `/core` 导入：

```ts
import { createPlayer } from '@cluoub-design/cluoub-video/core'

const player = createPlayer({ source: '/video.mp4' })
player.mount(document.querySelector('#player'))
```

需要 React 自定义视图时，组合 `/react` 的 `PlayerProvider`、`PlayerRoot`、`PlayerSlot` 和 hooks。

`PlayerState` 只保存媒体、画质、播放列表以及浏览器媒体状态。默认控件可见性与屏幕布局由 React View Store 持有；字幕和弹幕状态由各自插件 API 的 Store 持有，可分别通过 `player.plugins.get(subtitlePlugin)` 和 `player.plugins.get(danmuPlugin)` 访问。合成截图从已渲染的字幕 DOM 读取快照，不在 Core 中维护第二份字幕 UI 状态。

## Beta 兼容窗口与删除条件

`0.3.0-beta.0` 暂时保留根入口、旧顶层插件 Props、`[danmuPlugin]`、`player.danmu` 和函数式插件。

兼容层仅在以下条件全部满足后删除：

- npm 上已有可安装的 0.3 beta 包；
- `cluoub-web` 已切换到 `/react` 和配置型插件入口；
- 使用实际打包 tarball 完成类型检查、相关测试和 `pnpm build:ssr` 联调；
- 迁移版本已给出明确的弃用周期。

本仓库当前没有修改 `cluoub-web` 的正式 manifest 或 lockfile。
