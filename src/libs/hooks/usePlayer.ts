import { useEffect, useRef, useState } from 'react'

import { createPlayer } from '../core/createPlayer'
import type { PlayerInstance } from '../core/types'
import type { CluoubVideoProps } from '../types'
import { resolveSource } from '../utils/source'

export const usePlayer = (config: CluoubVideoProps): PlayerInstance | null => {
    const [player, setPlayer] = useState<PlayerInstance | null>(null)
    const initialConfig = useRef(config)
    const previousConfig = useRef<CluoubVideoProps | null>(null)

    useEffect(() => {
        const instance = createPlayer(initialConfig.current)
        previousConfig.current = initialConfig.current
        setPlayer(instance)
        return () => {
            instance.destroy()
            setPlayer(null)
        }
    }, [])

    useEffect(() => {
        if (!player) return
        const previous = previousConfig.current
        previousConfig.current = config
        if (!previous) return

        if (config.playlist !== previous.playlist) {
            player.updatePlaylist(config.playlist ?? [])
        } else if (
            config.source !== previous.source ||
            resolveSource(config.source) !== resolveSource(previous.source)
        ) {
            player.updateSource(config.source)
        }

        if (config.plugins !== previous.plugins) player.plugins.set(config.plugins)

        player.updateOptions({
            autoPlay: config.autoPlay,
            loop: config.loop,
            muted: config.muted,
            poster: config.poster,
            persist: config.persist,
            autoNext: config.autoNext,
            onPlay: config.onPlay,
            onPause: config.onPause,
            onEnded: config.onEnded,
            onError: config.onError,
            onPluginError: config.onPluginError,
            onQualityChange: config.onQualityChange,
            onPlaylistChange: config.onPlaylistChange
        })
    }, [config, player])

    return player
}
