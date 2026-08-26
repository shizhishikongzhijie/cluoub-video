import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { SubtitleTrack } from './index'
import { createSubtitleApi } from './state'
import { SubtitleMenu } from './SubtitleMenu'

const TRACKS: SubtitleTrack[] = [
    { id: '1', label: '简体中文', lang: 'zh', type: 'vtt', src: '' },
    { id: '2', label: 'English', lang: 'en', type: 'srt', src: '' },
    { id: '3', label: '日本語', lang: 'ja', type: 'vtt', src: '' }
]

afterEach(cleanup)

describe('SubtitleMenu 轨道选择', () => {
    it('点击触发按钮展开自定义下拉，点击选项切换轨道并自动关闭', () => {
        const api = createSubtitleApi({ isVisible: true })
        render(<SubtitleMenu api={api} tracks={TRACKS} />)

        expect(screen.queryAllByRole('option')).toHaveLength(0)
        fireEvent.click(screen.getByLabelText('选择字幕语言'))
        expect(screen.getAllByRole('option')).toHaveLength(3)

        fireEvent.click(screen.getByText('English'))
        expect(api.store.getState().track).toBe(1)
        expect(screen.queryByRole('option')).toBeNull()
    })

    it('点击下拉外部区域关闭下拉', () => {
        const api = createSubtitleApi({ isVisible: true })
        render(<SubtitleMenu api={api} tracks={TRACKS} />)

        fireEvent.click(screen.getByLabelText('选择字幕语言'))
        expect(screen.getAllByRole('option')).toHaveLength(3)
        fireEvent.mouseDown(document.body)
        expect(screen.queryByRole('option')).toBeNull()
    })

    it('字幕关闭时隐藏轨道选择与同步设置', () => {
        const api = createSubtitleApi({ isVisible: false })
        render(<SubtitleMenu api={api} tracks={TRACKS} />)
        expect(screen.queryByLabelText('选择字幕语言')).toBeNull()
        expect(screen.queryByText('同步')).toBeNull()
    })
})
