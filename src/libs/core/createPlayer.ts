import type { CluoubVideoProps } from '../types'
import { loadPersisted, savePersisted } from '../utils/storage'
import { createPlayerStore } from './store'
import type { EventHandler, PlayerInstance } from './types.ts'

// 解析视频源，支持 string / VideoSource / VideoSource[]
export const resolveSource = (source: CluoubVideoProps['source']): string => {
    if (typeof source === 'string') return source
    if (Array.isArray(source)) return source[0]?.src ?? ''
    return source?.src ?? ''
}

export function createPlayer(options: CluoubVideoProps): PlayerInstance {
    const store = createPlayerStore()
    const video = document.createElement('video')
    const listeners = new Map<string, Set<EventHandler>>()
    // 内部事件分发（供 loadItem 等内部逻辑与 instance.emit 复用）
    const emitEvent = (evt: string, ...args: any[]) => listeners.get(evt)?.forEach((fn) => fn(...args))

    // 挂载容器引用，用于全屏（对容器而非 video 全屏，保留自定义 UI）
    let containerEl: HTMLElement | null = null

    // 记录绑定到 video 的原生监听器，便于 destroy 时统一解绑
    const videoListeners: { type: string; handler: EventListener }[] = []
    const addVideoListener = (type: string, handler: EventListener) => {
        video.addEventListener(type, handler)
        videoListeners.push({ type, handler })
    }

    // --- 应用基础配置 ---
    video.src = resolveSource(options.source)
    video.autoplay = options.autoPlay ?? false
    video.loop = options.loop ?? false
    video.muted = options.muted ?? false
    video.playsInline = true
    if (options.poster) video.poster = options.poster
    // 同步初始静音/循环状态到 store
    store.setState({ isMuted: video.muted, isLoop: video.loop })

    // 播放列表初始化
    const playlist = options.playlist ?? []
    store.setState({ playlistLength: playlist.length })

    // --- 本地持久化配置 ---
    const persistCfg = (() => {
        if (options.persist === true) return { progress: true, volume: true, playbackRate: true }
        if (options.persist && typeof options.persist === 'object') return options.persist
        return null
    })()
    // 当前生效的源（随播放列表切换更新），作为持久化 key
    let currentSrc = resolveSource(options.source)

    // 恢复音量/倍速（在初次设置 src 后立即应用，进度需等元数据加载）
    if (persistCfg) {
        const saved = loadPersisted(currentSrc)
        if (saved) {
            if (persistCfg.volume && typeof saved.volume === 'number') {
                video.volume = saved.volume
                video.muted = saved.volume === 0
                store.setState({ volume: saved.volume, isMuted: video.muted })
            }
            if (persistCfg.playbackRate && typeof saved.playbackRate === 'number') {
                video.playbackRate = saved.playbackRate
                store.setState({ playbackRate: saved.playbackRate })
            }
            // 进度续播：等元数据加载后再 seek
            if (persistCfg.progress && typeof saved.time === 'number' && saved.time > 0) {
                video.addEventListener(
                    'loadedmetadata',
                    () => {
                        // 已播完（接近结尾）则不续播
                        if (saved.time! < video.duration - 1) video.currentTime = saved.time!
                    },
                    { once: true }
                )
            }
        }
    }

    // 加载播放列表中指定索引的条目（切换源并播放）
    const loadItem = (index: number) => {
        const item = playlist[index]
        if (!item) return
        const nextSrc = resolveSource(item.source)
        currentSrc = nextSrc
        if (item.poster) video.poster = item.poster
        store.setState({
            playlistIndex: index,
            currentTime: 0,
            buffered: 0,
            bufferedRanges: [],
            qualities: [],
            activeQuality: 'auto'
        })

        // 流媒体源（m3u8/mpd）交给对应插件重新加载；普通源直接换 video.src
        const isStreaming = /\.(m3u8|mpd)(\?|$)/i.test(nextSrc)
        if (isStreaming) {
            emitEvent('source-change', nextSrc)
        } else {
            video.src = nextSrc
            video.load()
        }
        options.onPlaylistChange?.({ index, item })
        // 切集后自动播放，避免黑屏停在首帧
        video.play().catch(() => {})
    }

    // --- 内部事件绑定 ---
    addVideoListener('play', () => {
        store.setState({ isPlaying: true })
        options.onPlay?.()
    })
    addVideoListener('pause', () => {
        store.setState({ isPlaying: false })
        options.onPause?.()
    })
    addVideoListener('ended', () => {
        options.onEnded?.()
        // 连播：存在下一集时自动切换
        if (options.autoNext) {
            const { playlistIndex } = store.getState()
            if (playlistIndex < playlist.length - 1) loadItem(playlistIndex + 1)
        }
    })
    addVideoListener('error', () => options.onError?.(video.error))
    // timeupdate 浏览器以 4~66Hz 触发，节流到 ~250ms 一次，降低 store 写入与 UI 重渲染频率
    let lastTimeUpdate = 0
    let lastPersistSave = 0
    addVideoListener('timeupdate', () => {
        const now = performance.now()
        if (now - lastTimeUpdate < 250) return
        lastTimeUpdate = now
        store.setState({ currentTime: video.currentTime })
        // 持久化进度：每 ~3s 落盘一次，避免频繁写 localStorage
        if (persistCfg?.progress && now - lastPersistSave > 3000) {
            lastPersistSave = now
            savePersisted(currentSrc, { time: video.currentTime })
        }
    })
    addVideoListener('durationchange', () => store.setState({ duration: video.duration }))
    // 缓冲态：等待数据时显示 loading，可播放/播放中时关闭
    addVideoListener('waiting', () => store.setState({ isWaiting: true }))
    addVideoListener('canplay', () => store.setState({ isWaiting: false }))
    addVideoListener('playing', () => store.setState({ isWaiting: false }))
    addVideoListener('progress', () => {
        const { buffered, duration } = video
        if (!buffered.length || !duration) return
        // 收集全部缓冲区间用于分段渲染
        const ranges: { start: number; end: number }[] = []
        for (let i = 0; i < buffered.length; i++) {
            ranges.push({
                start: (buffered.start(i) / duration) * 100,
                end: (buffered.end(i) / duration) * 100
            })
        }
        // buffered 仍保留为「最后一段末尾」以兼容旧用法
        const lastEnd = buffered.end(buffered.length - 1)
        store.setState({ buffered: (lastEnd / duration) * 100, bufferedRanges: ranges })
    })

    // 全屏状态变化同步（用户按 ESC 退出时也能同步）
    const onFullscreenChange = () => {
        store.setState({ isFullscreen: document.fullscreenElement === containerEl })
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)

    // 倍速变化同步
    addVideoListener('ratechange', () => {
        store.setState({ playbackRate: video.playbackRate })
        if (persistCfg?.playbackRate) savePersisted(currentSrc, { playbackRate: video.playbackRate })
    })
    // 音量变化持久化（含静音切换）
    addVideoListener('volumechange', () => {
        if (persistCfg?.volume) savePersisted(currentSrc, { volume: video.muted ? 0 : video.volume })
    })
    // 画中画进入/退出同步
    addVideoListener('enterpictureinpicture', () => store.setState({ isPip: true }))
    addVideoListener('leavepictureinpicture', () => store.setState({ isPip: false }))

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
            // 对容器全屏，保留自定义控制栏 / 字幕 / 弹幕层
            const target = containerEl ?? video
            if (document.fullscreenElement) {
                document.exitFullscreen()
            } else {
                target.requestFullscreen()
            }
        },
        setPlaybackRate: (rate) => {
            video.playbackRate = rate
            store.setState({ playbackRate: rate })
        },

        togglePip: async () => {
            try {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture()
                    return
                }
                // 进入 PiP 要求元数据已加载，否则抛 InvalidStateError
                if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
                    await new Promise<void>((resolve) => {
                        video.addEventListener('loadedmetadata', () => resolve(), { once: true })
                    })
                }
                await video.requestPictureInPicture()
            } catch (e) {
                console.error('PiP toggle failed', e)
            }
        },

        toggleLoop: () => {
            video.loop = !video.loop
            store.setState({ isLoop: video.loop })
        },

        playIndex: (index) => {
            if (index < 0 || index >= playlist.length) return
            loadItem(index)
        },

        next: () => {
            const { playlistIndex } = store.getState()
            if (playlistIndex < playlist.length - 1) loadItem(playlistIndex + 1)
        },

        prev: () => {
            const { playlistIndex } = store.getState()
            if (playlistIndex > 0) loadItem(playlistIndex - 1)
        },

        captureFrame: (opts) => {
            if (!video.videoWidth || !video.videoHeight) return null
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')
            if (!ctx) return null
            try {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                return canvas.toDataURL(opts?.type ?? 'image/png', opts?.quality)
            } catch (e) {
                // 跨域视频未设置 CORS 时 canvas 会被污染，toDataURL 抛 SecurityError
                console.error('captureFrame failed (可能为跨域未授权)', e)
                return null
            }
        },

        captureFrames: async (opts) => {
            const count = opts?.count ?? 10
            const intervalMs = opts?.intervalMs ?? 200
            const type = opts?.type ?? 'image/png'
            const frames: string[] = []
            for (let i = 0; i < count; i++) {
                const frame = instance.captureFrame({ type })
                if (frame) frames.push(frame)
                if (i < count - 1) await new Promise((r) => setTimeout(r, intervalMs))
            }
            return frames
        },

        mount: (container) => {
            containerEl = container
            container.appendChild(video)
        },

        destroy: () => {
            // 解绑所有原生监听器
            videoListeners.forEach(({ type, handler }) => video.removeEventListener(type, handler))
            videoListeners.length = 0
            document.removeEventListener('fullscreenchange', onFullscreenChange)
            // 清理事件总线
            listeners.clear()
            video.pause()
            video.removeAttribute('src')
            video.load()
            video.remove()
            containerEl = null
        },

        registerUI: (id, component, type, opts) => {
            store.setState((prev) => {
                if (type === 'layer') {
                    return {
                        uiRegistry: {
                            ...prev.uiRegistry,
                            layers: [...prev.uiRegistry.layers, { id, component, ...opts }]
                        }
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

        unregisterUI: (id) => {
            store.setState((prev) => ({
                uiRegistry: {
                    layers: prev.uiRegistry.layers.filter((l) => l.id !== id),
                    controls: prev.uiRegistry.controls.filter((c) => c.id !== id)
                }
            }))
        },

        on: (evt, fn) => {
            if (!listeners.has(evt)) listeners.set(evt, new Set())
            listeners.get(evt)!.add(fn)
        },

        off: (evt, fn) => {
            listeners.get(evt)?.delete(fn)
        },

        emit: (evt, ...args) => {
            emitEvent(evt, ...args)
        }
    }

    return instance
}
