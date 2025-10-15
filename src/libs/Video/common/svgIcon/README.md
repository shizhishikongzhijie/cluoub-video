# SvgIcon 组件

SvgIcon 是一个用于渲染 SVG 图标的 React 组件，支持自定义 SVG 内容和多种样式选项。

## 功能特性

- 支持 SVG 字符串和 URL 两种方式引入 SVG
- 提供 primary 样式选项
- 支持无背景样式
- 可自定义图标大小
- 支持所有标准 SVG 属性
- 自动处理加载和错误状态

## 使用方法

```tsx
import SvgIcon from '@/components/SvgIcon'

// 使用 SVG 字符串
<SvgIcon 
  src="<svg>...</svg>" 
  size={32} 
  primary 
/>

// 使用 SVG URL
<SvgIcon 
  src="/icons/home.svg" 
  size={24} 
  noBackground 
/>

// 基本用法
<SvgIcon 
  src="<svg>...</svg>" 
  size={20} 
/>

// 带事件处理
<SvgIcon 
  src="<svg>...</svg>" 
  size={24}
  onClick={() => console.log('Icon clicked')}
/>
```

## Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| src | string | - | SVG内容，可以是SVG字符串或URL |
| size | number \| string | 24 | 图标大小 |
| primary | boolean | false | 是否使用primary样式 |
| noBackground | boolean | false | 是否无背景 |
| ...props | SVGProps | - | 其他标准SVG属性 |

## 样式说明

- 默认样式：带灰色背景和圆角
- primary 样式：使用主题色背景，白色图标
- noBackground 样式：无背景，无内边距

## 注意事项

1. 当使用 URL 方式加载 SVG 时，组件会自动处理加载状态和错误状态
2. 组件会自动为 SVG 元素添加适当的类名以确保样式正确应用
3. 所有标准的 SVG 属性都可以通过 props 传递给组件