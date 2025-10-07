/**
 * Cluoub Video 播放器组件库
 * 提供完整的视频播放器功能和扩展API
 */

// 导入CSS样式
import './anime-player.css';

// 导出主要组件
export {default as CluoubVideo} from './CluoubVideo';

// 导出核心类型定义
export type {
    VideoProps,
    VideoRef,
    ControlConfig,
    Track,
    Barrage
} from './Video.types';

// 导出核心类
export {PlayerCore} from './core/PlayerCore';

// 导出插件系统相关内容
export {
    PluginManager,
    DemoPlugin,
    DefaultPlugins,
    registerPlugin,
    removePlugin
} from './plugins';

export {
    IPlayerPlugin,
    PlayerComponentPosition,
    ControlButtonConfig,
    PlayerComponentConfig,
    IPlayerCore
} from './core/IPlayerCore';

// 导出自定义Hooks
export {
    usePlayerCore,
    useControlsManager,
    useThumbnailManager
} from './hooks/usePlayerCore';

export {useVideoEvents} from './hooks/useVideoEvents';

export {useSubtitles} from './hooks/useSubtitles';

export {useKeyboardShortcuts} from './hooks/useKeyboardShortcuts';

export {useControlsVisibility} from './hooks/useControlsVisibility';

// 导出工具类
export {default as Logger} from './utils/Logger';

// 导出组件管理器
export {ControlsManager} from './managers';
export {ThumbnailManager} from './managers';

/**
 * 组件库版本信息
 */
export const version = '1.0.0';

/**
 * 组件库名称
 */
export const libraryName = 'Cluoub Video';