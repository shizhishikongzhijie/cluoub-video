import type { SlotContribution, SlotRegistry } from './types'

interface StoredContribution extends SlotContribution {
    sequence: number
}

export const createSlotRegistry = (): SlotRegistry => {
    let sequence = 0
    let contributions: StoredContribution[] = []
    let snapshot: readonly SlotContribution[] = []
    const listeners = new Set<() => void>()

    const publish = () => {
        contributions.sort((a, b) => {
            if (a.slot !== b.slot) return a.slot.localeCompare(b.slot)
            return (a.order ?? 0) - (b.order ?? 0) || a.sequence - b.sequence
        })
        snapshot = contributions.map(({ sequence: _sequence, ...contribution }) => contribution)
        listeners.forEach((listener) => listener())
    }

    const unregister = (id: string) => {
        const next = contributions.filter((contribution) => contribution.id !== id)
        if (next.length === contributions.length) return
        contributions = next
        publish()
    }

    return {
        register: (contribution) => {
            if (contributions.some((item) => item.id === contribution.id)) {
                throw new Error(`Slot contribution id already exists: ${contribution.id}`)
            }
            contributions.push({ ...contribution, sequence: sequence++ })
            publish()
            let disposed = false
            return () => {
                if (disposed) return
                disposed = true
                unregister(contribution.id)
            }
        },
        unregister,
        getSnapshot: () => snapshot,
        subscribe: (listener) => {
            listeners.add(listener)
            return () => listeners.delete(listener)
        },
        clear: () => {
            if (!contributions.length) return
            contributions = []
            publish()
        }
    }
}
