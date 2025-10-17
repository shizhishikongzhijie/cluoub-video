# SvgIcon 组件使用说明

## 基本用法

```tsx
import SvgIcon from './SvgIcon'

// 从URL加载SVG
<SvgIcon src="/path/to/icon.svg" />

// 使用原始SVG字符串（通过vite-plugin-raw）
import fullscreenSvg from './assets/全屏.svg?raw'
<SvgIcon src={fullscreenSvg} isRaw />
```

## 属性说明

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| src | string | 必需 | SVG内容，可以是SVG字符串、原始SVG字符串或URL |
| size | number/string | 24 | 图标大小 |
| primary | boolean | false | primary样式 |
| noBackground | boolean | false | 无背景样式 |
| isRaw | boolean | false | 是否为原始SVG字符串 |
| onClick | function | - | 点击事件处理函数 |
| onMouseEnter | function | - | 鼠标悬停事件处理函数 |
| onMouseLeave | function | - | 鼠标离开事件处理函数 |

## 使用原始SVG字符串（推荐）

通过 `vite-plugin-raw` 插件，可以将SVG文件作为原始字符串导入，避免网络请求：

1. 安装插件：
```bash
pnpm add -D vite-plugin-raw
```

2. 配置 `vite.config.ts`：
```ts
import rawPlugin from 'vite-plugin-raw'

export default defineConfig({
  plugins: [
    // 其他插件...
    rawPlugin({
      fileRegex: /\.svg$/
    })
  ]
})
```

3. 在组件中使用：
```tsx
import fullscreenSvg from './assets/全屏.svg?raw'
import exitFullscreenSvg from './assets/退出全屏.svg?raw'

<SvgIcon src={fullscreenSvg} isRaw />
<SvgIcon src={exitFullscreenSvg} isRaw />
```

这种方式将SVG内容直接内联到JS中，无需额外的网络请求，完全兼容所有项目环境。