/**
 * Cluoub Video 播放器组件库
 * 提供完整的视频播放器功能和扩展API
 */

// 导入CSS样式
import './anime-player.css'

// 导出主要组件
export { default as CluoubVideo } from './CluoubVideo'

// 导出核心类型定义
export { VideoType } from './Video.types'
export type { Barrage, ControlConfig, Track, VideoProps, VideoRef } from './Video.types'
// 导出核心类
export { PlayerCore } from './core/PlayerCore'

// 导出插件系统相关内容
export { PlayerComponentConfigType } from './core/IPlayerCore'
export type {
    ControlButtonConfig,
    IPlayerCore,
    IPlayerPlugin,
    IPlayerPluginApi,
    PlayerComponentConfig
} from './core/IPlayerCore'
export { DefaultPlugins, DemoPlugin, PluginManager, registerPlugin, removePlugin } from './plugins'
// 导出自定义Hooks
export { useControlsVisibility } from './hooks/useControlsVisibility'
export { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
export { useControlsManager, usePlayerCore, useThumbnailManager } from './hooks/usePlayerCore'
export { useSubtitles } from './hooks/useSubtitles'
export { useVideoEvents } from './hooks/useVideoEvents'

// 导出工具类
export { default as Logger } from './utils/Logger'

// 导出组件管理器
export { ControlsManager, ThumbnailManager } from './managers'

//导出公共组件
export { ColorPicker, Menu, NumberInput, Popover, SvgIcon, Switch } from './common'
export type {
    ColorPickerProps,
    MenuItemType,
    MenuProps,
    NumberInputProps,
    NumberInputRef,
    PopoverPosition,
    PopoverProps,
    SvgIconProps,
    SvgIconRef,
    SwitchProps
} from './common'

/**
 * 组件库版本信息
 */
export const version = '1.0.0'

/**
 * 组件库名称
 */
export const libraryName = 'Cluoub Video'
