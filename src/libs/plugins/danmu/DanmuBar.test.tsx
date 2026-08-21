import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createPlayerStore } from '../../core/store'
import type { PlayerInstance } from '../../core/types'
import { DanmuBar } from './DanmuBar'

const createPlayer = () => {
    const store = createPlayerStore()
    const danmu = {
        send: vi.fn(),
        setVisible: vi.fn(),
        toggleVisible: vi.fn(),
        setMode: vi.fn(),
        setColor: vi.fn()
    }
    const player = { store, danmu } as unknown as PlayerInstance
    return { player, danmu }
}

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

describe('DanmuBar 弹幕操作栏', () => {
    it('渲染输入框、模式按钮、颜色点与开关', () => {
        const { player } = createPlayer()
        render(<DanmuBar player={player} />)
        expect(screen.getByLabelText('弹幕内容')).toBeTruthy()
        expect(screen.getByRole('button', { name: '发送弹幕' })).toBeTruthy()
        expect(screen.getByRole('button', { name: '滚动' })).toBeTruthy()
        expect(screen.getByRole('button', { name: '顶部' })).toBeTruthy()
        expect(screen.getByRole('button', { name: '底部' })).toBeTruthy()
        expect(screen.getByLabelText('弹幕颜色 #fe0302')).toBeTruthy()
    })

    it('输入文本后点击发送调用 player.danmu.send 并清空输入', () => {
        const { player, danmu } = createPlayer()
        render(<DanmuBar player={player} />)
        const input = screen.getByLabelText('弹幕内容')
        fireEvent.change(input, { target: { value: '  测试弹幕  ' } })
        fireEvent.click(screen.getByRole('button', { name: '发送弹幕' }))
        expect(danmu.send).toHaveBeenCalledWith('测试弹幕')
        expect((input as HTMLInputElement).value).toBe('')
    })

    it('回车键发送弹幕', () => {
        const { player, danmu } = createPlayer()
        render(<DanmuBar player={player} />)
        fireEvent.change(screen.getByLabelText('弹幕内容'), { target: { value: '回车发送' } })
        fireEvent.keyDown(screen.getByLabelText('弹幕内容'), { key: 'Enter' })
        expect(danmu.send).toHaveBeenCalledWith('回车发送')
    })

    it('空文本不发送', () => {
        const { player, danmu } = createPlayer()
        render(<DanmuBar player={player} />)
        fireEvent.click(screen.getByRole('button', { name: '发送弹幕' }))
        expect(danmu.send).not.toHaveBeenCalled()
    })

    it('弹幕隐藏时输入框与发送按钮禁用', () => {
        const { player } = createPlayer()
        render(<DanmuBar player={player} />)
        fireEvent.change(screen.getByLabelText('弹幕内容'), { target: { value: 'x' } })
        expect((screen.getByRole('button', { name: '发送弹幕' }) as HTMLButtonElement).disabled).toBe(false)
        fireEvent.click(screen.getByRole('button', { name: /关闭弹幕|开启弹幕/ }))
        expect(player.store.getState().isDanmuVisible).toBe(false)
        expect((screen.getByLabelText('弹幕内容') as HTMLInputElement).disabled).toBe(true)
        expect((screen.getByRole('button', { name: '发送弹幕' }) as HTMLButtonElement).disabled).toBe(true)
    })

    it('点击模式按钮更新 danmuMode', () => {
        const { player } = createPlayer()
        render(<DanmuBar player={player} />)
        fireEvent.click(screen.getByRole('button', { name: '底部' }))
        expect(player.store.getState().danmuMode).toBe('bottom')
    })

    it('点击颜色点更新 danmuColor', () => {
        const { player } = createPlayer()
        render(<DanmuBar player={player} />)
        fireEvent.click(screen.getByLabelText('弹幕颜色 #fe0302'))
        expect(player.store.getState().danmuColor).toBe('#fe0302')
    })

    it('开关按钮切换 isDanmuVisible', () => {
        const { player } = createPlayer()
        render(<DanmuBar player={player} />)
        expect(player.store.getState().isDanmuVisible).toBe(true)
        fireEvent.click(screen.getByRole('button', { name: '关闭弹幕' }))
        expect(player.store.getState().isDanmuVisible).toBe(false)
        fireEvent.click(screen.getByRole('button', { name: '开启弹幕' }))
        expect(player.store.getState().isDanmuVisible).toBe(true)
    })
})
