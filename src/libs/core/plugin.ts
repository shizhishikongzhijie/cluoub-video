import type {
    LegacyPlayerPlugin,
    PlayerInstance,
    PlayerPlugin,
    PlayerPluginEntry,
    PluginContext,
    PluginErrorPhase,
    PluginManager,
    PluginSetupResult
} from './types'
import { PluginError } from './types'

interface PluginDefinition<TConfig, TApi> {
    id: string
    schema?: { parse: (input: unknown) => TConfig }
    setup: PlayerPlugin<TConfig, TApi>['setup']
}

export const definePlugin = <TConfig = undefined, TApi = undefined>(
    definition: PluginDefinition<TConfig, TApi>
): PlayerPlugin<TConfig, TApi> => {
    if (!definition.id.trim()) throw new Error('Plugin id must not be empty')
    const plugin: PlayerPlugin<TConfig, TApi> = {
        kind: 'cluoub-player-plugin',
        id: definition.id,
        schema: definition.schema,
        setup: definition.setup,
        configure: (config) => ({ kind: 'cluoub-configured-plugin', plugin, config })
    }
    return plugin
}

const isConfiguredPlugin = (
    entry: PlayerPluginEntry
): entry is Extract<PlayerPluginEntry, { kind: 'cluoub-configured-plugin' }> =>
    typeof entry === 'object' && entry !== null && entry.kind === 'cluoub-configured-plugin'

const isPlayerPlugin = (
    entry: PlayerPluginEntry
): entry is Extract<PlayerPluginEntry, { kind: 'cluoub-player-plugin' }> =>
    typeof entry === 'object' && entry !== null && entry.kind === 'cluoub-player-plugin'

interface NormalizedPlugin {
    id: string
    definition?: PlayerPlugin<unknown, unknown>
    legacy?: LegacyPlayerPlugin<never>
    config: unknown
    identity: unknown
}

interface ActivePlugin extends NormalizedPlugin {
    abortController: AbortController
    disposers: (() => void)[]
    api?: unknown
    disposed: boolean
}

const legacyIds = new WeakMap<LegacyPlayerPlugin<never>, string>()
let legacySequence = 0

const getLegacyId = (plugin: LegacyPlayerPlugin<never>) => {
    const existing = legacyIds.get(plugin)
    if (existing) return existing
    const id = `legacy:${plugin.name || 'anonymous'}:${legacySequence++}`
    legacyIds.set(plugin, id)
    return id
}

const normalize = (entry: PlayerPluginEntry): NormalizedPlugin => {
    if (isConfiguredPlugin(entry)) {
        return {
            id: entry.plugin.id,
            definition: entry.plugin as unknown as PlayerPlugin<unknown, unknown>,
            config: entry.config,
            identity: entry.plugin
        }
    }
    if (isPlayerPlugin(entry)) {
        return {
            id: entry.id,
            definition: entry as unknown as PlayerPlugin<unknown, unknown>,
            config: undefined,
            identity: entry
        }
    }
    return { id: getLegacyId(entry), legacy: entry, config: undefined, identity: entry }
}

const cleanupResult = (result: void | (() => void) | PluginSetupResult): (() => void) | undefined => {
    if (typeof result === 'function') return result
    return result?.cleanup
}

export const createPluginManager = (player: PlayerInstance, report: (error: PluginError) => void): PluginManager => {
    let order: string[] = []
    const active = new Map<string, ActivePlugin>()
    const listeners = new Set<() => void>()
    let destroyed = false

    const publish = () => listeners.forEach((listener) => listener())

    const reportError = (pluginId: string, cause: unknown, phase: PluginErrorPhase, recoverable = true) => {
        report(new PluginError(pluginId, phase, cause, recoverable))
    }

    const dispose = (plugin: ActivePlugin) => {
        if (plugin.disposed) return
        plugin.disposed = true
        plugin.abortController.abort()
        for (const disposer of [...plugin.disposers].reverse()) {
            try {
                disposer()
            } catch (cause) {
                reportError(plugin.id, cause, 'cleanup')
            }
        }
        plugin.disposers = []
        if (active.delete(plugin.id)) publish()
    }

    const install = (plugin: NormalizedPlugin, setupPhase: 'setup' | 'update' = 'setup') => {
        const activation: ActivePlugin = {
            ...plugin,
            abortController: new AbortController(),
            disposers: [],
            disposed: false
        }
        active.set(plugin.id, activation)

        if (plugin.legacy) {
            try {
                const cleanup = plugin.legacy(player)
                if (cleanup) activation.disposers.push(cleanup)
            } catch (cause) {
                reportError(plugin.id, cause, setupPhase)
                dispose(activation)
            }
            return
        }

        const definition = plugin.definition!
        let config = plugin.config
        try {
            if (definition.schema) config = definition.schema.parse(plugin.config)
        } catch (cause) {
            reportError(plugin.id, cause, 'config')
            dispose(activation)
            return
        }

        const context: PluginContext = {
            player,
            signal: activation.abortController.signal,
            slots: {
                register: (contribution) => {
                    const unregister = player.registerSlot({ ...contribution, pluginId: plugin.id })
                    activation.disposers.push(unregister)
                    return unregister
                }
            },
            on: (event, handler) => {
                player.on(event, handler)
                const off = () => player.off(event, handler)
                activation.disposers.push(off)
                return off
            },
            registerCaptureLayer: (id, getCanvas) => {
                player.registerCaptureLayer(id, getCanvas)
                const unregister = () => player.unregisterCaptureLayer(id)
                activation.disposers.push(unregister)
                return unregister
            },
            reportError: (cause, phase = 'runtime', recoverable = true) => {
                reportError(plugin.id, cause, phase, recoverable)
                if (phase === 'runtime') dispose(activation)
            }
        }

        const applyResult = (result: void | (() => void) | PluginSetupResult) => {
            const cleanup = cleanupResult(result)
            if (activation.disposed) {
                if (cleanup) {
                    try {
                        cleanup()
                    } catch (cause) {
                        reportError(plugin.id, cause, 'cleanup')
                    }
                }
                return
            }
            if (cleanup) activation.disposers.push(cleanup)
            if (result && typeof result === 'object') {
                activation.api = result.api
                publish()
            }
        }

        try {
            const result = definition.setup(context, config)
            if (result instanceof Promise) {
                result.then(applyResult).catch((cause) => {
                    reportError(plugin.id, cause, setupPhase)
                    dispose(activation)
                })
            } else {
                applyResult(result)
            }
        } catch (cause) {
            reportError(plugin.id, cause, setupPhase)
            dispose(activation)
        }
    }

    return {
        set: (entries = []) => {
            if (destroyed) return
            const normalized: NormalizedPlugin[] = []
            const seen = new Set<string>()
            for (const entry of entries) {
                const plugin = normalize(entry)
                if (seen.has(plugin.id)) {
                    reportError(plugin.id, new Error(`Duplicate plugin id: ${plugin.id}`), 'config')
                    continue
                }
                seen.add(plugin.id)
                normalized.push(plugin)
            }

            const nextById = new Map(normalized.map((plugin) => [plugin.id, plugin]))
            const updatedIds = new Set<string>()
            for (const id of [...order].reverse()) {
                const current = active.get(id)
                const next = nextById.get(id)
                if (!current) continue
                if (!next || current.identity !== next.identity || !Object.is(current.config, next.config)) {
                    if (next) updatedIds.add(id)
                    dispose(current)
                }
            }

            for (const plugin of normalized) {
                if (!active.has(plugin.id)) install(plugin, updatedIds.has(plugin.id) ? 'update' : 'setup')
            }
            order = normalized.map((plugin) => plugin.id)
        },
        get: <TConfig, TApi>(plugin: PlayerPlugin<TConfig, TApi>): TApi | undefined =>
            active.get(plugin.id)?.api as TApi | undefined,
        has: (pluginOrId) => active.has(typeof pluginOrId === 'string' ? pluginOrId : pluginOrId.id),
        subscribe: (listener) => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        destroy: () => {
            if (destroyed) return
            destroyed = true
            for (const id of [...order].reverse()) {
                const plugin = active.get(id)
                if (plugin) dispose(plugin)
            }
            order = []
            listeners.clear()
        }
    }
}
