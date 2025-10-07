/**
 * 弹幕接口定义
 * @interface Barrage
 */
export interface Barrage {
  /** 弹幕唯一标识符 */
  id: string;
  /** 弹幕文本内容 */
  text: string;
  /** 发送用户ID */
  userId: string;
  /** 发送用户名 */
  username: string;
  /** 弹幕时间戳（毫秒） */
  timestamp: number;
  /** 弹幕颜色（可选） */
  color?: string;
  /** 弹幕字体大小（可选） */
  size?: number;
  /** 弹幕位置（可选） */
  position?: number;
}

/**
 * 控制配置接口定义
 * @interface ControlConfig
 */
export interface ControlConfig {
  /** 播放/暂停控制（可选） */
  play?: boolean;
  /** 音量控制（可选） */
  volume?: boolean;
  /** 时间显示（可选） */
  time?: boolean;
  /** 进度条控制（可选） */
  progress?: boolean;
  /** 设置按钮（可选） */
  settings?: boolean;
  /** 全屏控制（可选） */
  fullscreen?: boolean;
  /** 弹幕控制（可选） */
  barrage?: boolean;
}

/**
 * 视频组件属性接口定义
 * @interface VideoProps
 */
export interface VideoProps {
  /** 视频源URL */
  videoSrc: string;
  /** 视频唯一标识符 */
  videoId: string;
  /** 当前用户ID */
  userId: string;
  /** 当前用户名 */
  username: string;
  /** 视频宽度（可选） */
  width?: string | number;
  /** 视频高度（可选） */
  height?: string | number;
  /** 视频宽高比（可选），例如: "16:9", "4:3" */
  aspectRatio?: string; // e.g., "16:9", "4:3"
  /** 控制配置（可选） */
  controls?: ControlConfig;
  /** 自定义图标配置（可选） */
  customIcons?: {
    /** 播放图标（可选） */
    playIcon?: React.ReactNode;
    /** 暂停图标（可选） */
    pauseIcon?: React.ReactNode;
    /** 音量图标（可选） */
    volumeIcon?: React.ReactNode;
    /** 静音图标（可选） */
    muteIcon?: React.ReactNode;
    /** 全屏图标（可选） */
    fullscreenIcon?: React.ReactNode;
    /** 设置图标（可选） */
    settingsIcon?: React.ReactNode;
    /** 发送图标（可选） */
    sendIcon?: React.ReactNode;
    /** 进度条拖拽点图标（可选） */
    progressThumbIcon?: React.ReactNode;
  };
  /** 缩略图URL（可选） */
  thumbnailUrl?: string;
  /** 缩略图宽度（可选） */
  thumbnailWidth?: number;
  /** 缩略图高度（可选） */
  thumbnailHeight?: number;
}

/**
 * 音量变化事件数据接口
 * @interface VolumeChangeData
 */
export interface VolumeChangeData {
  /** 是否静音 */
  isMuted: boolean;
  /** 音量值 */
  volume: number;
}

/**
 * 时间更新事件数据接口
 * @interface TimeUpdateData
 */
export interface TimeUpdateData {
  /** 当前时间 */
  currentTime: number;
  /** 进度百分比 */
  progress: number;
}

/**
 * 跳转事件数据接口
 * @interface SeekData
 */
export interface SeekData {
  /** 跳转时间 */
  time: number;
  /** 进度百分比 */
  progress: number;
}