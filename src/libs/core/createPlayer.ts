import {createPlayerStore} from './store'
import type {PlayerInstance} from './types.ts'

export function createPlayer(options: any): PlayerInstance {
    const store = createPlayerStore()
    const video = document.createElement('video')
    const listeners = new Map<string, Set<Function>>()

    // --- 内部事件绑定 ---
    video.src = options.source
    video.addEventListener('play', () => store.setState({ isPlaying: true }))
    video.addEventListener('pause', () => store.setState({ isPlaying: false }))
    video.addEventListener('timeupdate', () => store.setState({ currentTime: video.currentTime }))
    video.addEventListener('durationchange', () => store.setState({ duration: video.duration }))
    video.addEventListener('progress', () => {
        if (video.buffered.length) {
            const end = video.buffered.end(video.buffered.length - 1)
            store.setState({ buffered: (end / video.duration) * 100 })
        }
    })

    // --- 方法实现 ---
    const instance: PlayerInstance = {
        video,
        store,
        options,
        isControlsVisible: false,
        setShowControls: (show) => {
            store.setState({ isControlsVisible: show })
        },

        play: async () => {
            try {
                await video.play()
            } catch (e) {
                console.error('Play failed', e)
            }
        },

        pause: () => video.pause(),

        togglePlay: () => {
            if (video.paused) {
                instance.play()
            } else {
                instance.pause()
            }
        },

        seek: (time) => {
            video.currentTime = time
            store.setState({ currentTime: time }) // 立即乐观更新
        },

        setVolume: (vol) => {
            video.volume = vol
            video.muted = vol === 0
            store.setState({ volume: vol, isMuted: vol === 0 })
        },

        toggleMute: () => {
            video.muted = !video.muted
            store.setState({ isMuted: video.muted })
        },

        toggleFullscreen: () => {
            if (document.fullscreenElement) {
                document.exitFullscreen()
            } else {
                video.requestFullscreen()
            }
        },
        mount: (container) => {
            container.appendChild(video)
        },

        destroy: () => {
            video.remove()
            // 清理 listeners...
        },

        registerUI: (id, component, type, opts) => {
            store.setState((prev) => {
                if (type === 'layer') {
                    return {
                        uiRegistry: { ...prev.uiRegistry, layers: [...prev.uiRegistry.layers, { id, component }] }
                    }
                } else {
                    return {
                        uiRegistry: {
                            ...prev.uiRegistry,
                            controls: [...prev.uiRegistry.controls, { id, component, ...opts }]
                        }
                    }
                }
            })
        },

        on: (evt, fn) => {
            if (!listeners.has(evt)) listeners.set(evt, new Set())
            listeners.get(evt)!.add(fn)
        },

        off: (evt, fn) => {
            listeners.get(evt)?.delete(fn)
        }
    }

    return instance
}
