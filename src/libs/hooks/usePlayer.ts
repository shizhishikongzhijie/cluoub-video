import { useEffect, useRef, useState } from 'react'

import { createPlayer } from '../core/createPlayer'
import type { PlayerInstance } from '../core/types'
import type { CluoubVideoProps } from '../types'

export const usePlayer = (containerRef: React.RefObject<HTMLElement | null>, config: CluoubVideoProps) => {
    const [player, setPlayer] = useState<PlayerInstance | null>(null)

    // 保存最新 config，避免把 props 对象放进依赖导致播放器被反复销毁重建
    const configRef = useRef(config)
    configRef.current = config

    useEffect(() => {
        if (!containerRef.current) return

        const instance = createPlayer(configRef.current)
        instance.mount(containerRef.current)

        // 加载插件
        const cleanups: (() => void)[] = []

        if (configRef.current.plugins) {
            configRef.current.plugins.forEach((p) => {
                const cleanup = (p as (player: PlayerInstance) => void | (() => void))(instance)
                if (typeof cleanup === 'function') cleanups.push(cleanup)
            })
        }

        setPlayer(instance)

        // 播放器初始化、挂载、插件加载完成后通知外部
        configRef.current.onReady?.(instance)

        return () => {
            cleanups.forEach((fn) => fn())
            instance.destroy()
            setPlayer(null)
        }
        // 仅在挂载时初始化一次
    }, [containerRef])

    return player
}
