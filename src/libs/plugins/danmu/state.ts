import type { StoreApi } from 'zustand/vanilla'
import { createStore } from 'zustand/vanilla'

import type { LegacyDanmuAPI, PlayerInstance } from '../../core/types'

export type DanmuMode = 'scroll' | 'top' | 'bottom'

export interface SendDanmuOptions {
    mode?: DanmuMode
    color?: string
}

export interface DanmuState {
    isVisible: boolean
    mode: DanmuMode
    color: string
}

export interface DanmuAPI extends LegacyDanmuAPI {
    readonly store: StoreApi<DanmuState>
}

export const createDanmuStore = (initial?: Partial<DanmuState>) =>
    createStore<DanmuState>(() => ({
        isVisible: true,
        mode: 'scroll',
        color: '#ffffff',
        ...initial
    }))

/** 0.3 beta 兼容读取；正式调用应使用 player.plugins.get(danmuPlugin)。 */
export const getLegacyDanmuApi = (player: PlayerInstance): DanmuAPI | undefined => player.danmu as DanmuAPI | undefined
