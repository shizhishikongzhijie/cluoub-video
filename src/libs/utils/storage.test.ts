import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearPersisted, loadPersisted, savePersisted } from './storage'

describe('storage 持久化', () => {
    const src = 'https://example.com/video.mp4'

    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        localStorage.clear()
    })

    it('未存储时 loadPersisted 返回 null', () => {
        expect(loadPersisted(src)).toBeNull()
    })

    it('保存后能读取，并带上 updatedAt', () => {
        savePersisted(src, { time: 42 })
        const got = loadPersisted(src)
        expect(got?.time).toBe(42)
        expect(typeof got?.updatedAt).toBe('number')
    })

    it('多次保存做字段合并而非覆盖', () => {
        savePersisted(src, { time: 10 })
        savePersisted(src, { volume: 0.5 })
        const got = loadPersisted(src)
        expect(got?.time).toBe(10)
        expect(got?.volume).toBe(0.5)
    })

    it('不同源相互隔离', () => {
        savePersisted(src, { time: 10 })
        savePersisted('https://example.com/other.mp4', { time: 99 })
        expect(loadPersisted(src)?.time).toBe(10)
        expect(loadPersisted('https://example.com/other.mp4')?.time).toBe(99)
    })

    it('clearPersisted 删除后读取为 null', () => {
        savePersisted(src, { time: 10 })
        clearPersisted(src)
        expect(loadPersisted(src)).toBeNull()
    })

    it('空 src 不写入也不报错', () => {
        expect(() => savePersisted('', { time: 1 })).not.toThrow()
        expect(loadPersisted('')).toBeNull()
    })

    it('损坏的 JSON 安全返回 null', () => {
        localStorage.setItem('cluoub-video:' + src, '{bad json')
        expect(loadPersisted(src)).toBeNull()
    })
})
