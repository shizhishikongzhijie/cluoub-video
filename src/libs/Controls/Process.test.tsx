import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Progress from './Process'

// 打桩视频抽帧 grabber，避免真实创建 video 元素 / 依赖 canvas
const { getFrame, dispose } = vi.hoisted(() => ({
    getFrame: vi.fn<() => Promise<string | null>>(),
    dispose: vi.fn()
}))
vi.mock('../thumbnail/videoThumbnails', () => ({
    createVideoThumbnailGrabber: () => ({ getFrame, dispose })
}))

// 模拟进度条宽 800px，clientX 与进度百分比换算：percent = clientX / 8
const mockBarRect = (el: HTMLElement) => {
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        right: 800,
        width: 800,
        top: 0,
        bottom: 20,
        height: 20,
        x: 0,
        y: 0,
        toJSON: () => ({})
    } as DOMRect)
}

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

describe('Progress 缩略图', () => {
    beforeEach(() => {
        getFrame.mockResolvedValue('data:image/jpeg;base64,ZmFrZQ==')
    })

    it('雪碧图模式：悬停时显示对应背景定位的缩略图', () => {
        const { container } = render(
            <Progress
                progress={0}
                duration={100}
                thumbnail={{ url: 'sprite.jpg', cols: 5, rows: 4, interval: 10 }}
                onSeek={vi.fn()}
            />
        )
        const bar = screen.getByLabelText('进度条')
        mockBarRect(bar)
        fireEvent.mouseEnter(bar)
        fireEvent.mouseMove(bar, { clientX: 400 }) // 50s → 第 5 张（col 0, row 1）

        const box = container.querySelector('[style*="background-image"]')
        expect(box).not.toBeNull()
        expect((box as HTMLElement).style.backgroundImage).toContain('sprite.jpg')
        expect((box as HTMLElement).style.backgroundPosition).toBe('0px -90px')
        expect(screen.getByText('00:50')).toBeDefined()
    })

    it('视频抽帧模式：悬停时从视频源取帧并显示 img', async () => {
        const { container } = render(
            <Progress progress={0} duration={100} thumbnail={{ type: 'video' }} source="demo.mp4" onSeek={vi.fn()} />
        )
        const bar = screen.getByLabelText('进度条')
        mockBarRect(bar)
        fireEvent.mouseEnter(bar)
        fireEvent.mouseMove(bar, { clientX: 400 })

        await waitFor(() => {
            const img = container.querySelector('img')
            expect(img).not.toBeNull()
            expect(img!.getAttribute('src')).toBe('data:image/jpeg;base64,ZmFrZQ==')
        })
        expect(getFrame).toHaveBeenCalledWith(50)
    })

    it('视频抽帧失败时不渲染图片', async () => {
        getFrame.mockResolvedValue(null)
        const { container } = render(
            <Progress progress={0} duration={100} thumbnail={{ type: 'video' }} source="demo.mp4" onSeek={vi.fn()} />
        )
        const bar = screen.getByLabelText('进度条')
        mockBarRect(bar)
        fireEvent.mouseEnter(bar)
        fireEvent.mouseMove(bar, { clientX: 200 })
        await act(async () => {})
        expect(container.querySelector('img')).toBeNull()
    })

    it('无缩略图配置时不渲染预览图', () => {
        const { container } = render(<Progress progress={0} duration={100} onSeek={vi.fn()} />)
        const bar = screen.getByLabelText('进度条')
        mockBarRect(bar)
        fireEvent.mouseEnter(bar)
        fireEvent.mouseMove(bar, { clientX: 400 })
        expect(container.querySelector('img')).toBeNull()
        expect(container.querySelector('[style*="background-image"]')).toBeNull()
    })

    it('浮窗被钳位在容器内，且三角箭头指向实际悬停位置', () => {
        render(
            <Progress
                progress={0}
                duration={100}
                thumbnail={{ url: 'sprite.jpg', cols: 5, rows: 4, interval: 10 }}
                onSeek={vi.fn()}
            />
        )
        const bar = screen.getByLabelText('进度条')
        mockBarRect(bar)
        fireEvent.mouseEnter(bar)

        // 靠近左边缘：hoverX=10 → 钳位后 left=0，箭头钳位在圆角平直区起点(13)
        fireEvent.mouseMove(bar, { clientX: 10 })
        const tooltip = screen.getByText('00:01').parentElement!
        expect(tooltip.style.left).toBe('0px')
        const arrow = tooltip.children[tooltip.children.length - 1] as HTMLElement
        expect(parseFloat(arrow.style.left)).toBeCloseTo(13, 0)

        // 靠近右边缘：hoverX=790 → 钳位后 left=626，箭头钳位在圆角平直区终点(161)
        fireEvent.mouseMove(bar, { clientX: 790 })
        expect(tooltip.style.left).toBe('626px')
        expect(parseFloat(arrow.style.left)).toBeCloseTo(161, 0)
    })
})
