import { describe, expect, it, vi } from 'vitest'

import { createSlotRegistry } from './slots'

describe('Slot registry', () => {
    it('按 order 和注册顺序稳定排序', () => {
        const slots = createSlotRegistry()
        slots.register({ id: 'late', slot: 'overlay', content: null, order: 10 })
        slots.register({ id: 'first', slot: 'overlay', content: null, order: 1 })
        slots.register({ id: 'same-a', slot: 'overlay', content: null, order: 5 })
        slots.register({ id: 'same-b', slot: 'overlay', content: null, order: 5 })
        expect(slots.getSnapshot().map((slot) => slot.id)).toEqual(['first', 'same-a', 'same-b', 'late'])
    })

    it('disposer 幂等，并通知订阅者', () => {
        const slots = createSlotRegistry()
        const listener = vi.fn()
        slots.subscribe(listener)
        const dispose = slots.register({ id: 'item', slot: 'below', content: 'content' })
        dispose()
        dispose()
        expect(slots.getSnapshot()).toEqual([])
        expect(listener).toHaveBeenCalledTimes(2)
    })

    it('拒绝重复 contribution id', () => {
        const slots = createSlotRegistry()
        slots.register({ id: 'same', slot: 'overlay', content: null })
        expect(() => slots.register({ id: 'same', slot: 'below', content: null })).toThrow(/already exists/)
    })
})
