import {Circle, Pause, Play, Settings} from 'lucide-react'
import React from 'react'

import fullscreenSvg from '@/assets/svg/全屏.svg?raw'
import pipSvg from '@/assets/svg/小屏.svg?raw'
import exitFullscreenSvg from '@/assets/svg/退出全屏.svg?raw'
import muteSvg from '@/assets/svg/静音.svg?raw'
import volumeSvg from '@/assets/svg/音量.svg?raw'

import SvgIcon from '../common/svgIcon'

/**
 * 获取图标组件，优先返回自定义图标，如果未提供自定义图标则返回默认图标
 * @param iconType - 图标类型，从SpeedButtonProps的customIcons中定义的键值
 * @param defaultIcon - 默认图标组件，当没有对应的自定义图标时使用
 * @returns 返回自定义图标或默认图标
 */
// 获取图标，优先使用自定义图标，否则使用默认图标
export const getIcon = (iconType: customIconsType, defaultIcon?: React.ReactNode) => {
    return defaultIcon ? defaultIcon : iconType && customIconsMap[iconType] ? customIconsMap[iconType] : iconType
}

export const customIconsMap = {
    progressThumb: <Circle size={12} fill="white" />,
    volume: <SvgIcon src={volumeSvg} size={20} />,
    mute: <SvgIcon src={muteSvg} size={20} />,
    speed: <></>,
    settings: <Settings size={20} />,
    quality: <></>,
    pause: <Pause size={20} fill={'white'} />,
    play: <Play size={20} fill={'white'} />,
    fullscreen: <SvgIcon src={fullscreenSvg} size={20} />,
    exitFullscreen: <SvgIcon src={exitFullscreenSvg} size={20} />,
    pip: <SvgIcon src={pipSvg} size={20} />
}

export type customIconsMapType = typeof customIconsMap

export type customIconsType = keyof customIconsMapType

export const customIconsKey = Object.keys(customIconsMap).reduce(
    (acc, key) => ({ ...acc, [key]: key }),
    {} as Record<customIconsType, customIconsType>
)
