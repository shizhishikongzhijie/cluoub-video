import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createPlayerStore } from '../../core/store'
import type { PlayerInstance } from '../../core/types'
import { CaptureControl } from './CaptureControl'

const { captureContainerComposite } = vi.hoisted(() => ({
    captureContainerComposite: vi.fn()
}))
vi.mock('../../utils/captureContainer', () => ({ captureContainerComposite }))

const createPlayer = () => {
    const video = document.createElement('video')
    const store = createPlayerStore()
    const captureComposite = vi.fn()
    const player = {
        video,
        store,
        captureComposite,
        captureLayers: []
    } as unknown as PlayerInstance
    return { player, captureComposite }
}

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

describe('CaptureControl 右侧工具栏', () => {
    it('渲染为右侧竖排工具栏（截图 + GIF 两个按钮）', () => {
        const { player } = createPlayer()
        const { container } = render(<CaptureControl player={player} config={{}} />)
        const toolbar = container.querySelector('[class*="captureToolbar"]')
        expect(toolbar).not.toBeNull()
        expect(screen.getByLabelText('截图')).toBeDefined()
        expect(screen.getByLabelText('录制 GIF')).toBeDefined()
    })

    it('截图使用合成捕获（视频帧 + 弹幕 canvas + 字幕文本）', async () => {
        const { player, captureComposite } = createPlayer()
        captureComposite.mockResolvedValue('data:image/png;base64,Zm9v')
        render(<CaptureControl player={player} config={{}} />)
        fireEvent.click(screen.getByLabelText('截图'))
        expect(captureComposite).toHaveBeenCalledWith({ type: 'image/png' })
    })

    it('未播放时 GIF 按钮禁用，播放中可点击开始录制', async () => {
        const { player } = createPlayer()
        Object.defineProperty(player.video, 'videoWidth', { value: 1280, configurable: true })
        Object.defineProperty(player.video, 'videoHeight', { value: 720, configurable: true })
        render(<CaptureControl player={player} config={{}} />)
        const btn = screen.getByLabelText('录制 GIF') as HTMLButtonElement
        expect(btn.disabled).toBe(true)

        player.store.setState({ isPlaying: true })
        await waitFor(() => expect(btn.disabled).toBe(false))
        fireEvent.click(btn)
        await waitFor(() => expect(btn.getAttribute('aria-label')).toBe('结束 GIF 录制'))
        fireEvent.click(screen.getByLabelText('结束 GIF 录制'))
        await waitFor(() => expect(btn.getAttribute('aria-label')).toBe('录制 GIF'))
    })
})
