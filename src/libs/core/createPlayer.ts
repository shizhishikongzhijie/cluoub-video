import { captureContainerComposite } from '../utils/captureContainer'
import { isStreamingSource, resolveSource, resolveSources } from '../utils/source'
import { createPersistence } from './persistence'
import { createPluginManager } from './plugin'
import { createSlotRegistry } from './slots'
import { createPlayerStore } from './store'
import type {
    PlayerInstance,
    PlayerOptions,
    PlayerPluginEntry,
    PlayerSource,
    PluginManager,
    SlotContribution,
    VideoSource
} from './types'

type InternalEventHandler = (...args: unknown[]) => void

const qualityLabel = (source: VideoSource, index: number) => source.quality || `画质 ${index + 1}`

export function createPlayer(options: PlayerOptions): PlayerInstance {
    let currentOptions: PlayerOptions = { ...options, playlist: options.playlist ?? [], plugins: options.plugins ?? [] }
    const store = createPlayerStore()
    const video = document.createElement('video')
    const slots = createSlotRegistry()
    const listeners = new Map<string, Set<InternalEventHandler>>()
    const videoListeners: { type: string; handler: EventListener }[] = []
    const captureLayers: { id: string; getCanvas: () => HTMLCanvasElement | null }[] = []
    let containerElement: HTMLElement | null = null
    let destroyed = false
    let playlist = currentOptions.playlist ?? []
    let currentSourceInput: PlayerSource = currentOptions.source
    let staticSources = resolveSources(currentSourceInput)
    let currentSourceIndex = 0
    let currentSrc = resolveSource(currentSourceInput)
    let sourceLoadGeneration = 0
    let removePendingResume: (() => void) | undefined
    let readyEmitted = false

    const emitEvent = <TArgs extends unknown[]>(event: string, ...args: TArgs) => {
        listeners.get(event)?.forEach((handler) => handler(...args))
    }

    const addVideoListener = (type: string, handler: EventListener) => {
        video.addEventListener(type, handler)
        videoListeners.push({ type, handler })
    }

    video.autoplay = currentOptions.autoPlay ?? false
    video.loop = currentOptions.loop ?? false
    video.muted = currentOptions.muted ?? false
    video.playsInline = true
    if (currentOptions.poster) video.poster = currentOptions.poster
    store.setState({ isMuted: video.muted, isLoop: video.loop, playlistLength: playlist.length })

    const persistence = createPersistence(video, store, currentOptions.persist, () => currentSrc)

    const reportError = (error: unknown) => {
        currentOptions.onError?.(error)
        emitEvent('error', error)
    }

    const syncStaticQualities = (source: PlayerSource) => {
        staticSources = resolveSources(source)
        currentSourceIndex = Math.max(
            0,
            staticSources.findIndex((candidate) => candidate.src === currentSrc)
        )
        if (staticSources.length <= 1) {
            if (!isStreamingSource(currentSrc)) {
                store.setState({ qualities: [], quality: 'auto', activeQuality: 'auto' })
            }
            return
        }
        const qualities = staticSources.map((candidate, index) => ({
            key: String(index),
            label: qualityLabel(candidate, index)
        }))
        const key = String(currentSourceIndex)
        store.setState({ qualities, quality: key, activeQuality: key })
    }

    const loadResolvedSource = (
        source: string,
        playlistIndex: number,
        behavior: { resetTime: boolean; resume: boolean; restorePersistence: boolean; preserveSettings?: boolean }
    ) => {
        const generation = ++sourceLoadGeneration
        removePendingResume?.()
        removePendingResume = undefined
        const resumeAt = behavior.resetTime ? 0 : video.currentTime
        const previousVolume = video.volume
        const previousMuted = video.muted
        const previousPlaybackRate = video.playbackRate
        currentSrc = source
        store.setState({
            playlistIndex,
            ...(behavior.resetTime ? { currentTime: 0 } : {}),
            buffered: 0,
            bufferedRanges: [],
            isWaiting: true
        })

        const onMetadata = () => {
            if (generation !== sourceLoadGeneration) return
            if (resumeAt > 0 && resumeAt < video.duration) {
                video.currentTime = resumeAt
                store.setState({ currentTime: resumeAt })
            }
            if (behavior.preserveSettings) {
                video.volume = previousVolume
                video.muted = previousMuted
                video.playbackRate = previousPlaybackRate
                store.setState({
                    volume: previousVolume,
                    isMuted: previousMuted,
                    playbackRate: previousPlaybackRate
                })
            }
            if (behavior.resume) void instance.play()
            removePendingResume = undefined
        }
        video.addEventListener('loadedmetadata', onMetadata, { once: true })
        removePendingResume = () => video.removeEventListener('loadedmetadata', onMetadata)

        if (isStreamingSource(source)) {
            video.pause()
            video.removeAttribute('src')
            if (behavior.restorePersistence) persistence.restore()
            emitEvent('source-change', source)
            return
        }

        video.src = source
        if (behavior.restorePersistence) persistence.restore()
        video.load()
    }

    const loadSourceInput = (
        source: PlayerSource,
        playlistIndex: number,
        behavior: { resetTime: boolean; resume: boolean; restorePersistence: boolean }
    ) => {
        currentSourceInput = source
        currentSrc = resolveSource(source)
        currentSourceIndex = 0
        syncStaticQualities(source)
        loadResolvedSource(currentSrc, playlistIndex, behavior)
    }

    const loadItem = (index: number) => {
        const item = playlist[index]
        if (!item) return
        if (item.poster !== undefined) video.poster = item.poster
        loadSourceInput(item.source, index, { resetTime: true, resume: true, restorePersistence: true })
        currentOptions.onPlaylistChange?.({ index, item })
    }

    addVideoListener('play', () => {
        store.setState({ isPlaying: true })
        currentOptions.onPlay?.()
    })
    addVideoListener('pause', () => {
        store.setState({ isPlaying: false })
        currentOptions.onPause?.()
    })
    addVideoListener('ended', () => {
        currentOptions.onEnded?.()
        if (!currentOptions.autoNext) return
        const { playlistIndex } = store.getState()
        if (playlistIndex < playlist.length - 1) loadItem(playlistIndex + 1)
    })
    addVideoListener('error', () => reportError(video.error))

    let lastTimeUpdate = 0
    addVideoListener('timeupdate', () => {
        const now = performance.now()
        if (now - lastTimeUpdate < 250) return
        lastTimeUpdate = now
        store.setState({ currentTime: video.currentTime })
        persistence.onTimeUpdate(now, video.currentTime)
    })
    addVideoListener('durationchange', () => store.setState({ duration: video.duration }))
    addVideoListener('waiting', () => store.setState({ isWaiting: true }))
    addVideoListener('canplay', () => store.setState({ isWaiting: false }))
    addVideoListener('playing', () => store.setState({ isWaiting: false }))
    addVideoListener('progress', () => {
        const { buffered, duration } = video
        if (!buffered.length || !duration) return
        const ranges: { start: number; end: number }[] = []
        for (let index = 0; index < buffered.length; index++) {
            ranges.push({
                start: (buffered.start(index) / duration) * 100,
                end: (buffered.end(index) / duration) * 100
            })
        }
        store.setState({ buffered: (buffered.end(buffered.length - 1) / duration) * 100, bufferedRanges: ranges })
    })
    addVideoListener('ratechange', () => {
        store.setState({ playbackRate: video.playbackRate })
        persistence.onRateChange(video.playbackRate)
    })
    addVideoListener('volumechange', () => {
        store.setState({ volume: video.volume, isMuted: video.muted })
        persistence.onVolumeChange(video.volume, video.muted)
    })
    addVideoListener('enterpictureinpicture', () => store.setState({ isPip: true }))
    addVideoListener('leavepictureinpicture', () => store.setState({ isPip: false }))

    const onFullscreenChange = () => {
        store.setState({ isFullscreen: document.fullscreenElement === containerElement })
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)

    const pluginManagerRef: { current?: PluginManager } = {}
    const instance: PlayerInstance = {
        video,
        store,
        get options() {
            return currentOptions
        },
        slots,
        get plugins() {
            return pluginManagerRef.current!
        },
        play: async () => {
            try {
                await video.play()
            } catch (error) {
                reportError(error)
            }
        },
        pause: () => video.pause(),
        togglePlay: () => {
            if (video.paused) void instance.play()
            else instance.pause()
        },
        seek: (time) => {
            const bounded = Number.isFinite(video.duration)
                ? Math.max(0, Math.min(time, video.duration))
                : Math.max(0, time)
            video.currentTime = bounded
            store.setState({ currentTime: bounded })
        },
        setVolume: (volume) => {
            const bounded = Math.max(0, Math.min(volume, 1))
            video.volume = bounded
            video.muted = bounded === 0
            store.setState({ volume: bounded, isMuted: video.muted })
        },
        toggleMute: () => {
            video.muted = !video.muted
            store.setState({ isMuted: video.muted })
        },
        toggleFullscreen: () => {
            const target = containerElement ?? video
            const request = document.fullscreenElement ? document.exitFullscreen() : target.requestFullscreen()
            void request.catch(reportError)
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
                if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
                    await new Promise<void>((resolve) =>
                        video.addEventListener('loadedmetadata', () => resolve(), { once: true })
                    )
                }
                await video.requestPictureInPicture()
            } catch (error) {
                reportError(error)
            }
        },
        toggleLoop: () => {
            video.loop = !video.loop
            currentOptions = { ...currentOptions, loop: video.loop }
            store.setState({ isLoop: video.loop })
        },
        playIndex: (index) => {
            if (index >= 0 && index < playlist.length) loadItem(index)
        },
        next: () => {
            const index = store.getState().playlistIndex
            if (index < playlist.length - 1) loadItem(index + 1)
        },
        prev: () => {
            const index = store.getState().playlistIndex
            if (index > 0) loadItem(index - 1)
        },
        selectQuality: (key) => {
            if (staticSources.length <= 1) {
                store.setState({ quality: key })
                emitEvent('request-quality-change', key)
                return
            }
            const index = Number(key)
            const source = staticSources[index]
            if (!source || index === currentSourceIndex) return
            const resume = !video.paused
            currentSourceIndex = index
            currentSrc = source.src
            const label = qualityLabel(source, index)
            store.setState({ quality: key, activeQuality: key })
            loadResolvedSource(source.src, store.getState().playlistIndex, {
                resetTime: false,
                resume,
                restorePersistence: false,
                preserveSettings: true
            })
            currentOptions.onQualityChange?.({ mode: key, activeKey: key, label })
        },
        captureFrame: (captureOptions) => {
            if (!video.videoWidth || !video.videoHeight) return null
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const context = canvas.getContext('2d')
            if (!context) return null
            try {
                context.drawImage(video, 0, 0, canvas.width, canvas.height)
                return canvas.toDataURL(captureOptions?.type ?? 'image/png', captureOptions?.quality)
            } catch (error) {
                reportError(error)
                return null
            }
        },
        captureFrames: async (captureOptions) => {
            const count = captureOptions?.count ?? 10
            const intervalMs = captureOptions?.intervalMs ?? 200
            const frames: string[] = []
            for (let index = 0; index < count; index++) {
                const frame = instance.captureFrame({ type: captureOptions?.type })
                if (frame) frames.push(frame)
                if (index < count - 1) await new Promise((resolve) => setTimeout(resolve, intervalMs))
            }
            return frames
        },
        captureComposite: async (captureOptions) => {
            if (!containerElement) return null
            const canvas = captureContainerComposite(containerElement, video, { captureLayers: [...captureLayers] })
            if (!canvas) return null
            try {
                return canvas.toDataURL(captureOptions?.type ?? 'image/png', captureOptions?.quality)
            } catch (error) {
                reportError(error)
                return null
            }
        },
        updateSource: (source) => {
            const next = resolveSource(source)
            if (!next || source === currentSourceInput) return
            const resume = !video.paused
            currentOptions = { ...currentOptions, source }
            if (next === currentSrc) {
                currentSourceInput = source
                syncStaticQualities(source)
                return
            }
            loadSourceInput(source, 0, { resetTime: true, resume, restorePersistence: true })
        },
        updatePlaylist: (nextPlaylist) => {
            playlist = nextPlaylist
            currentOptions = { ...currentOptions, playlist: nextPlaylist }
            const current = store.getState().playlistIndex
            const clamped = Math.max(0, Math.min(current, Math.max(0, playlist.length - 1)))
            store.setState({ playlistLength: playlist.length, playlistIndex: clamped })
            const item = playlist[clamped]
            if (item && resolveSource(item.source) !== currentSrc) loadItem(clamped)
        },
        updateOptions: (nextOptions) => {
            const persistChanged = 'persist' in nextOptions && nextOptions.persist !== currentOptions.persist
            currentOptions = { ...currentOptions, ...nextOptions }
            if ('loop' in nextOptions) video.loop = nextOptions.loop ?? false
            if ('muted' in nextOptions) video.muted = nextOptions.muted ?? false
            if ('autoPlay' in nextOptions) video.autoplay = nextOptions.autoPlay ?? false
            if ('poster' in nextOptions) {
                if (nextOptions.poster) video.poster = nextOptions.poster
                else video.removeAttribute('poster')
            }
            store.setState({ isMuted: video.muted, isLoop: video.loop })
            if (persistChanged) persistence.updateConfig(nextOptions.persist)
        },
        mount: (container) => {
            if (destroyed) throw new Error('Cannot mount a destroyed player')
            if (containerElement === container && video.parentElement === container) return
            containerElement = container
            container.prepend(video)
            if (!readyEmitted) {
                readyEmitted = true
                currentOptions.onReady?.(instance)
            }
        },
        destroy: () => {
            if (destroyed) return
            destroyed = true
            pluginManagerRef.current?.destroy()
            persistence.destroy()
            sourceLoadGeneration++
            removePendingResume?.()
            removePendingResume = undefined
            slots.clear()
            videoListeners.forEach(({ type, handler }) => video.removeEventListener(type, handler))
            videoListeners.length = 0
            document.removeEventListener('fullscreenchange', onFullscreenChange)
            listeners.clear()
            video.pause()
            video.removeAttribute('src')
            video.load()
            video.remove()
            containerElement = null
        },
        registerSlot: (contribution: SlotContribution) => slots.register(contribution),
        registerUI: (id, component, type, uiOptions) => {
            slots.register({
                id,
                content: component,
                slot:
                    type === 'layer'
                        ? 'overlay'
                        : uiOptions?.position === 'left'
                          ? 'controls.leading'
                          : 'controls.trailing',
                order: uiOptions?.order,
                zIndex: uiOptions?.zIndex,
                controlId: uiOptions?.controlKey
            })
        },
        unregisterUI: (id) => slots.unregister(id),
        on: (event, handler) => {
            if (!listeners.has(event)) listeners.set(event, new Set())
            listeners.get(event)!.add(handler as InternalEventHandler)
        },
        off: (event, handler) => listeners.get(event)?.delete(handler as InternalEventHandler),
        emit: (event, ...args) => emitEvent(event, ...args),
        captureLayers,
        registerCaptureLayer: (id, getCanvas) => {
            if (!captureLayers.some((layer) => layer.id === id)) captureLayers.push({ id, getCanvas })
        },
        unregisterCaptureLayer: (id) => {
            const index = captureLayers.findIndex((layer) => layer.id === id)
            if (index >= 0) captureLayers.splice(index, 1)
        }
    }

    const runtimePluginManager = createPluginManager(instance, (pluginError) => {
        currentOptions.onPluginError?.(pluginError)
        emitEvent('plugin:error', pluginError)
    })
    pluginManagerRef.current = {
        set: (entries) => {
            currentOptions = { ...currentOptions, plugins: entries ? [...entries] : [] }
            runtimePluginManager.set(entries)
        },
        get: runtimePluginManager.get,
        has: runtimePluginManager.has,
        subscribe: runtimePluginManager.subscribe,
        destroy: runtimePluginManager.destroy
    }

    if (isStreamingSource(currentSrc)) video.removeAttribute('src')
    else video.src = currentSrc
    syncStaticQualities(currentSourceInput)
    persistence.restore()
    pluginManagerRef.current.set(currentOptions.plugins)

    return instance
}

export type { PlayerPluginEntry }
