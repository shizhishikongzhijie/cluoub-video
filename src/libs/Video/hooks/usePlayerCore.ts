import {useEffect, useRef} from 'react'

import {PlayerCore} from '../core'
import {ControlsManager, ThumbnailManager} from '../managers'
import {VideoType} from '../Video.types'

/**
 * 自定义Hook，用于创建和管理播放器核心实例
 * @param options 播放器配置选项
 */
export const usePlayerCore = (options?: {
    videoSrc?: string | { [key: string]: string }
    videoId?: string
    userId?: string
    username?: string
    videoType?: VideoType
    dataPrefix?: string
}) => {
    const playerCoreRef = useRef<PlayerCore | null>(null)

    if (!playerCoreRef.current && options) {
        playerCoreRef.current = new PlayerCore(options)
    }

    return playerCoreRef.current as PlayerCore
}

/**
 * 自定义Hook，用于创建和管理控制栏管理器实例
 */
export const useControlsManager = () => {
    const controlsManagerRef = useRef<ControlsManager | null>(null)

    if (!controlsManagerRef.current) {
        controlsManagerRef.current = new ControlsManager()
    }

    return controlsManagerRef.current
}

/**
 * 自定义Hook，用于创建和管理缩略图管理器实例
 * @param thumbnailUrl 缩略图URL
 */
export const useThumbnailManager = (thumbnailUrl?: string) => {
    const thumbnailManagerRef = useRef<ThumbnailManager | null>(null)

    if (!thumbnailManagerRef.current) {
        thumbnailManagerRef.current = new ThumbnailManager()
    }

    useEffect(() => {
        thumbnailManagerRef.current?.init(thumbnailUrl)
    }, [thumbnailUrl])

    return thumbnailManagerRef.current
}
