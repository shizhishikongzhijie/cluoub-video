import {useEffect, useState} from 'react'

import {createPlayer} from '../core/createPlayer'
import type {PlayerInstance} from '../core/types'

export const usePlayer = (containerRef: React.RefObject<HTMLElement>, config: any) => {
    const [player, setPlayer] = useState<PlayerInstance | null>(null)

    useEffect(() => {
        console.log('usePlayer', config)
        if (!containerRef.current) return
        console.log('usePlayer', config)
        const instance = createPlayer(config)
        instance.mount(containerRef.current)

        // 加载插件
        const cleanups: Function[] = []

        if (config.plugins) {
            config.plugins.forEach((p: any) => {
                const cleanup = p(instance)
                if (cleanup) cleanups.push(cleanup)
            })
        }

        setPlayer(instance)

        return () => {
            cleanups.forEach((fn) => fn())
            instance.destroy()
            setPlayer(null)
        }
    }, [config, containerRef]) // 空依赖，只初始化一次

    return player
}
