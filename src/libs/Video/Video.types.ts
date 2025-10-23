/**
 * 视频播放器类型定义
 * 包含所有组件、配置和状态接口
 */

import React from 'react'

import {ControlButtonConfig, IPlayerPlugin, PlayerComponentConfig} from './core/IPlayerCore'

/**
 * 向后兼容的类型别名
 * 支持旧版代码的引用方式
 */
export type ControlButton = ControlButtonConfig
export type PlayerComponent = PlayerComponentConfig

/**
 * 弹幕接口定义
 * 描述视频弹幕的结构和属性
 * @interface Barrage
 */
export interface Barrage {
    /** 弹幕唯一标识符 */
    id: string

    /** 弹幕文本内容 */
    text: string

    /** 发送用户ID */
    userId: string

    /** 发送用户名 */
    username: string

    /** 弹幕发送时间戳（毫秒） */
    timestamp: number

    /** 弹幕显示颜色（可选） */
    color?: string

    /** 弹幕字体大小（可选，像素） */
    size?: number

    /** 弹幕显示位置（可选，0-1表示垂直位置比例） */
    position?: number

    /** 弹幕动画持续时间（可选，毫秒） */
    duration?: number

    /** 弹幕在视频中的时间点（可选，秒）- 用于与视频进度同步 */
    videoTime?: number
}

/**
 * 字幕轨道接口定义
 * 描述视频字幕轨道的配置信息
 * @interface Track
 */
export interface Track {
    /** 字幕轨道唯一标识符 */
    id: string

    /** 字幕轨道显示标签，用于UI选择 */
    label: string

    /** 字幕语言代码（如 'en', 'zh', 'ja'） */
    srclang: string

    /** 字幕文件URL或路径 */
    src: string

    /** 字幕类型 */
    kind: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata'

    /** 是否设为默认字幕轨道 */
    default?: boolean
}

/**
 * 控制配置接口定义
 * 配置视频播放器UI控件的显示与隐藏
 * @interface ControlConfig
 */
export interface ControlConfig {
    /** 是否显示播放/暂停控制按钮 */
    play?: boolean

    /** 是否显示音量控制滑块 */
    volume?: boolean

    /** 是否显示时间（当前时间/总时长） */
    time?: boolean

    /** 是否显示进度条控制 */
    progress?: boolean

    /** 是否显示设置按钮 */
    settings?: boolean

    /** 是否显示全屏切换按钮 */
    fullscreen?: boolean

    /** 是否显示字幕控制 */
    subtitles?: boolean

    /** 是否显示画质控制 */
    quality?: boolean

    /** 是否显示倍速控制 */
    speed?: boolean
}

/**
 * 视频类型枚举
 */
export enum VideoType {
    /** 普通视频类型（MP4、WebM等） */
    NORMAL = 'normal',
    /** DASH视频类型 */
    DASH = 'dash'
}

/**
 * 视频组件属性接口定义
 * 配置视频播放器组件的所有属性和行为
 * @interface VideoProps
 */
export interface VideoProps {
    /** 视频源URL，可以是字符串或画质对象 */
    videoSrc: string | { [quality: string]: string }

    /** 视频类型，默认为普通视频 */
    videoType?: VideoType

    /** DASH视频数据前缀，用于拼接MPD文件中定义的片段URL */
    dataPrefix?: string

    /** 视频宽度（可选，像素值或CSS单位） */
    width?: string | number

    /** 视频高度（可选，像素值或CSS单位） */
    height?: string | number

    /** 视频宽高比（可选），例如: "16:9", "4:3" */
    aspectRatio?: string

    /** 控制UI元素配置 */
    controls?: {
        play?: boolean
        volume?: boolean
        time?: boolean
        progress?: boolean
        settings?: boolean
        fullscreen?: boolean
        pip?: boolean
        barrage?: boolean
        subtitles?: boolean
        quality?: boolean
        speed?: boolean
    }

    /** 自定义图标配置，用于替换默认图标 */
    customIcons?: Record<string, React.ReactNode>

    /** 是否自动播放（注意：受浏览器策略限制） */
    autoPlay?: boolean

    /** 是否循环播放 */
    loop?: boolean

    /** 是否静音启动 */
    muted?: boolean

    /** 预加载模式 */
    preload?: 'none' | 'metadata' | 'auto'

    /** 初始音量（0-1范围） */
    initialVolume?: number

    /** 缩略图URL */
    thumbnailUrl?: string

    /** 缩略图宽度 */
    thumbnailWidth?: number

    /** 缩略图高度 */
    thumbnailHeight?: number

    /** 字幕轨道配置列表 */
    tracks?: Track[]

    /** 是否启用快捷键 */
    enableShortcuts?: boolean

    /** 是否开启调试模式 */
    debug?: boolean

    /** 插件配置列表 */
    plugins?: Array<
        | {
              /** 插件实例 */
              plugin: IPlayerPlugin
              /** 插件配置选项 */
              options?: any
          }
        | IPlayerPlugin
    >

    /** 是否显示控制栏 */
    showControls?: boolean

    /** 封面图片URL */
    coverImage?: string

    /** 是否显示封面 */
    showCover?: boolean
}

/**
 * 视频组件引用接口定义
 * 提供对视频播放器实例的编程访问
 * @interface VideoRef
 */
export interface VideoRef {
    /**
     * 开始播放视频
     */
    play: () => void

    /**
     * 暂停视频播放
     */
    pause: () => void

    /**
     * 切换视频播放/暂停状态
     */
    togglePlay: () => void

    /**
     * 跳转到指定时间点
     * @param time - 目标时间点（秒）
     */
    seekTo: (time: number) => void

    /**
     * 设置视频音量
     * @param volume - 音量值（0-1）
     */
    setVolume: (volume: number) => void

    /**
     * 切换静音状态
     */
    toggleMute: () => void

    /**
     * 切换全屏显示状态
     */
    toggleFullscreen: () => void

    /**
     * 获取已注册的插件实例
     * @param pluginName - 插件名称
     * @returns 插件实例或undefined（如果插件未注册）
     */
    getPlugin: (pluginName: string) => any

    /**
     * 当前播放时间（秒）
     */
    currentTime: number

    /**
     * 视频总时长（秒）
     */
    duration: number

    /**
     * 是否正在播放
     */
    isPlaying: boolean
}
