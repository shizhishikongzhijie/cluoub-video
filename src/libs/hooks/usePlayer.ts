import { useEffect, useRef, useState } from 'react'

import { createPlayer } from '../core/createPlayer'
import type { IPlayerPlugin, PlayerInstance } from '../core/types'
import type { CluoubVideoProps } from '../types'
import { resolveSource } from '../utils/source'

// 安装插件并收集清理函数
const runPlugins = (instance: PlayerInstance, plugins?: IPlayerPlugin[]) => {
    const cleanups: (() => void)[] = []
    plugins?.forEach((p) => {
        const cleanup = p(instance)
        if (typeof cleanup === 'function') cleanups.push(cleanup)
    })
    return cleanups
}

export const usePlayer = (containerRef: React.RefObject<HTMLElement | null>, config: CluoubVideoProps) => {
    const [player, setPlayer] = useState<PlayerInstance | null>(null)

    // 保存最新 config，避免把 props 对象放进依赖导致播放器被反复销毁重建
    const configRef = useRef(config)
    configRef.current = config

    // 记录插件 cleanup，plugins 变化时先清理再重装
    const pluginCleanupsRef = useRef<(() => void)[]>([])
    // 记录上一次响应式 props，用于 diff（首次渲染跳过，由挂载 effect 完成初始化）
    const prevPropsRef = useRef<CluoubVideoProps | null>(null)

    useEffect(() => {
        if (!containerRef.current) return

        const instance = createPlayer(configRef.current)
        instance.mount(containerRef.current)

        // 加载插件
        pluginCleanupsRef.current = runPlugins(instance, configRef.current.plugins)

        setPlayer(instance)

        // 播放器初始化、挂载、插件加载完成后通知外部
        configRef.current.onReady?.(instance)

        return () => {
            pluginCleanupsRef.current.forEach((fn) => fn())
            pluginCleanupsRef.current = []
            instance.destroy()
            setPlayer(null)
        }
        // 仅在挂载时初始化一次
    }, [containerRef])

    // 响应 props 变化：切换源/播放列表/插件/标量配置，不重建实例以保留播放状态
    useEffect(() => {
        if (!player) return
        const prev = prevPropsRef.current
        prevPropsRef.current = config
        // 首次渲染已由挂载 effect 完成初始化，跳过
        if (!prev) return

        const sourceChanged = resolveSource(config.source) !== resolveSource(prev.source)
        const playlistChanged = config.playlist !== prev.playlist
        const pluginsChanged = config.plugins !== prev.plugins

        // playlist 是换集的唯一入口；仅当 playlist 未变化时才走 source 更新
        if (playlistChanged) {
            player.updatePlaylist(config.playlist ?? [])
        } else if (sourceChanged) {
            player.updateSource(config.source)
        }

        // 插件集合变化：先清理旧插件，再安装新插件
        if (pluginsChanged) {
            pluginCleanupsRef.current.forEach((fn) => fn())
            pluginCleanupsRef.current = runPlugins(player, config.plugins)
        }

        // 标量配置：每次渲染都应用（未提供的字段保持原值）
        player.applyOptions({
            autoPlay: config.autoPlay,
            loop: config.loop,
            muted: config.muted,
            poster: config.poster
        })
    })

    return player
}
