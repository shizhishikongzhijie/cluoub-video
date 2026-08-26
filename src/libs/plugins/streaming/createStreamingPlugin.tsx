import type { PlayerInstance, PluginContext } from '../../core/types'
import { resolveSource } from '../../utils/source'

export interface StreamingSourceEngine {
    setQuality: (key: string) => void
    dispose: () => void
}

export interface StreamingSourceHandler {
    isStreamSrc: (src: string) => boolean
    nativeLoad?: (src: string, player: PlayerInstance) => boolean
    createEngine: (src: string, player: PlayerInstance, signal: AbortSignal) => Promise<StreamingSourceEngine>
}

/** DASH/HLS 共用接管层；每次切源都有独立取消信号和代际校验。 */
export const createStreamingPlugin = (context: PluginContext, handler: StreamingSourceHandler): (() => void) => {
    const { player, signal } = context
    let engine: StreamingSourceEngine | null = null
    let loadController: AbortController | null = null
    let generation = 0
    let active = false
    let destroyed = false

    const cancelCurrentLoad = () => {
        generation++
        loadController?.abort()
        loadController = null
        engine?.dispose()
        engine = null
    }

    const load = (src: string) => {
        if (!handler.isStreamSrc(src) || destroyed) return
        active = true
        cancelCurrentLoad()
        const loadGeneration = generation

        if (handler.nativeLoad?.(src, player)) return

        const controller = new AbortController()
        loadController = controller
        const abortFromPlugin = () => controller.abort()
        signal.addEventListener('abort', abortFromPlugin, { once: true })

        void handler
            .createEngine(src, player, controller.signal)
            .then((next) => {
                if (destroyed || controller.signal.aborted || loadGeneration !== generation) {
                    next.dispose()
                    return
                }
                engine = next
                loadController = null
            })
            .catch((cause) => {
                if (!controller.signal.aborted) context.reportError(cause, 'runtime')
            })
            .finally(() => signal.removeEventListener('abort', abortFromPlugin))
    }

    const teardown = () => {
        if (!active) return
        active = false
        cancelCurrentLoad()
        player.store.setState({ qualities: [], quality: 'auto', activeQuality: 'auto' })
    }

    context.on('source-change', (src: string) => {
        if (handler.isStreamSrc(src)) load(src)
        else teardown()
    })
    context.on('request-quality-change', (quality: string) => engine?.setQuality(quality))

    const initialSrc = resolveSource(player.options.source)
    if (handler.isStreamSrc(initialSrc)) load(initialSrc)

    return () => {
        if (destroyed) return
        destroyed = true
        teardown()
    }
}
