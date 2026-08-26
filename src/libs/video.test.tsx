import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { definePlugin } from './core/plugin'
import { CluoubVideo } from './video'

beforeEach(() => {
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve()) as typeof HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.pause = vi.fn() as typeof HTMLMediaElement.prototype.pause
    HTMLMediaElement.prototype.load = vi.fn() as typeof HTMLMediaElement.prototype.load
})

afterEach(cleanup)

describe('CluoubVideo default composition', () => {
    it('在播放器容器之后渲染 below Slot', async () => {
        const plugin = definePlugin({
            id: 'below-fixture',
            setup: ({ slots }) => {
                slots.register({ id: 'below-content', slot: 'below', content: <div>播放器下方内容</div> })
            }
        })

        render(<CluoubVideo source="test.mp4" plugins={[plugin]} />)

        expect(await screen.findByText('播放器下方内容')).toBeDefined()
    })
})
