/* eslint-disable react-refresh/only-export-components */
import type { HTMLAttributes, ReactNode } from 'react'
import {
    Component,
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore
} from 'react'
import type { StoreApi } from 'zustand/vanilla'
import { createStore } from 'zustand/vanilla'

import type { PlayerInstance, PlayerPlugin, PlayerSlotName, SlotContribution } from '../core/types'
import { PluginError } from '../core/types'

const PlayerContext = createContext<PlayerInstance | null>(null)

export type PlayerScreenMode = 'normal' | 'wide' | 'small'

export interface PlayerViewState {
    controlsVisible: boolean
    screenMode: PlayerScreenMode
}

export type PlayerViewStore = StoreApi<PlayerViewState>

const DEFAULT_PLAYER_VIEW_STATE: PlayerViewState = {
    controlsVisible: true,
    screenMode: 'normal'
}

export const createPlayerViewStore = (): PlayerViewStore =>
    createStore<PlayerViewState>(() => ({ ...DEFAULT_PLAYER_VIEW_STATE }))

const PlayerViewContext = createContext<PlayerViewStore | null>(null)

export const PlayerProvider = ({
    player,
    viewStore,
    children
}: {
    player: PlayerInstance
    viewStore?: PlayerViewStore
    children: ReactNode
}) => {
    const [ownedViewStore] = useState(createPlayerViewStore)
    return (
        <PlayerContext.Provider value={player}>
            <PlayerViewContext.Provider value={viewStore ?? ownedViewStore}>{children}</PlayerViewContext.Provider>
        </PlayerContext.Provider>
    )
}

export const usePlayerInstance = () => {
    const player = useContext(PlayerContext)
    if (!player) throw new Error('Player hooks must be used inside PlayerProvider')
    return player
}

export const usePlayerState = <T,>(selector: (state: ReturnType<PlayerInstance['store']['getState']>) => T): T => {
    const player = usePlayerInstance()
    const state = useSyncExternalStore(player.store.subscribe, player.store.getState, player.store.getInitialState)
    return selector(state)
}

export const usePlayerViewState = <T,>(selector: (state: PlayerViewState) => T): T => {
    const store = useContext(PlayerViewContext)
    if (!store) throw new Error('Player view hooks must be used inside PlayerProvider')
    const state = useSyncExternalStore(store.subscribe, store.getState, store.getInitialState)
    return selector(state)
}

export const useOptionalPlayerViewState = <T,>(selector: (state: PlayerViewState) => T): T => {
    const store = useContext(PlayerViewContext)
    const subscribe = useCallback((listener: () => void) => store?.subscribe(listener) ?? (() => undefined), [store])
    const getSnapshot = useCallback(() => store?.getState() ?? DEFAULT_PLAYER_VIEW_STATE, [store])
    return selector(useSyncExternalStore(subscribe, getSnapshot, getSnapshot))
}

export const usePlayerViewStore = (): PlayerViewStore => {
    const store = useContext(PlayerViewContext)
    if (!store) throw new Error('Player view hooks must be used inside PlayerProvider')
    return store
}

export const usePluginApi = <TConfig, TApi>(plugin: PlayerPlugin<TConfig, TApi>): TApi | undefined => {
    const player = usePlayerInstance()
    const getSnapshot = useCallback(() => player.plugins.get(plugin), [player, plugin])
    return useSyncExternalStore(player.plugins.subscribe, getSnapshot, getSnapshot)
}

export const useSlotContributions = (slot: PlayerSlotName): readonly SlotContribution<ReactNode>[] => {
    const player = usePlayerInstance()
    const contributions = useSyncExternalStore(
        player.slots.subscribe,
        player.slots.getSnapshot,
        player.slots.getSnapshot
    )
    return contributions.filter((contribution) => contribution.slot === slot) as readonly SlotContribution<ReactNode>[]
}

interface SlotErrorBoundaryProps {
    contribution: SlotContribution<ReactNode>
    player: PlayerInstance
    children: ReactNode
}

class SlotErrorBoundary extends Component<SlotErrorBoundaryProps, { failed: boolean }> {
    state = { failed: false }

    static getDerivedStateFromError() {
        return { failed: true }
    }

    componentDidCatch(cause: unknown) {
        const error = new PluginError(this.props.contribution.pluginId ?? this.props.contribution.id, 'render', cause)
        this.props.player.options.onPluginError?.(error)
        this.props.player.emit('plugin:error', error)
    }

    render() {
        return this.state.failed ? null : this.props.children
    }
}

export const PlayerSlotContribution = ({ contribution }: { contribution: SlotContribution<ReactNode> }) => {
    const player = usePlayerInstance()
    return (
        <SlotErrorBoundary contribution={contribution} player={player}>
            {contribution.content}
        </SlotErrorBoundary>
    )
}

export const PlayerSlot = ({ name }: { name: PlayerSlotName }) => {
    const contributions = useSlotContributions(name)
    return contributions.map((contribution) => (
        <PlayerSlotContribution key={contribution.id} contribution={contribution} />
    ))
}

export interface PlayerRootProps extends HTMLAttributes<HTMLDivElement> {
    onPlayerMounted?: (player: PlayerInstance) => void
}

export const PlayerRoot = forwardRef<HTMLDivElement, PlayerRootProps>(
    ({ children, onPlayerMounted, ...props }, forwardedRef) => {
        const player = usePlayerInstance()
        const mountedCallback = useRef(onPlayerMounted)
        mountedCallback.current = onPlayerMounted
        const setRootRef = useCallback(
            (element: HTMLDivElement | null) => {
                if (typeof forwardedRef === 'function') forwardedRef(element)
                else if (forwardedRef) forwardedRef.current = element
                if (!element) return
                player.mount(element)
                mountedCallback.current?.(player)
            },
            [forwardedRef, player]
        )

        return (
            <div {...props} ref={setRootRef}>
                {children}
            </div>
        )
    }
)

PlayerRoot.displayName = 'PlayerRoot'

export const usePlayerEvent = <TArgs extends unknown[]>(event: string, handler: (...args: TArgs) => void) => {
    const player = usePlayerInstance()
    useEffect(() => {
        player.on(event, handler)
        return () => player.off(event, handler)
    }, [event, handler, player])
}
