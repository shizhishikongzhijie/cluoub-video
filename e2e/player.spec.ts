import { expect, test } from '@playwright/test'

test('default UI keeps real keyboard controls and MP4 quality switching', async ({ page }) => {
    await page.goto('?quality=1#/default')
    const player = page.locator('[class*="videoContainer"]').first()
    const video = player.locator('video')
    await expect(video).toBeVisible()
    await expect(page.getByLabel('画质', { exact: true })).toContainText('原画')

    await video.evaluate((element: HTMLVideoElement) => {
        element.currentTime = 2
        element.volume = 0.4
        element.playbackRate = 1.5
    })
    await page.getByLabel('画质', { exact: true }).hover()
    await page.getByRole('menuitemradio', { name: '720P' }).click()
    await expect(page.getByLabel('画质', { exact: true })).toContainText('720P')
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.volume)).toBe(0.4)
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.playbackRate)).toBe(1.5)

    await player.focus()
    await page.keyboard.press('Space')
    await expect(page.getByLabel('暂停', { exact: true })).toBeVisible()
    await page.keyboard.press('Space')
    await expect(page.getByLabel('播放', { exact: true })).toBeVisible()
})

test('Headless demo uses live player state and custom controls', async ({ page }) => {
    await page.goto('./#/headless')
    await expect(page.getByText('同一个播放内核，自定义控制栏与主题')).toBeVisible()
    const video = page.locator('.headless-player video')
    await expect(video).toBeVisible()
    await page.getByRole('button', { name: '播放' }).click()
    await expect(page.getByRole('button', { name: '暂停' })).toBeVisible()
    await page.getByLabel('音量').fill('0.35')
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.volume)).toBeCloseTo(0.35)
})

test('plugin runtime isolates failures from the default UI', async ({ page }) => {
    await page.goto('?pluginError=1#/default')
    await expect(page.getByTestId('plugin-error')).toHaveText('demo-failure:runtime')
    await expect(page.getByLabel('播放', { exact: true })).toBeVisible()
})

test('390px viewport has no horizontal overflow and touch seeking stays active', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('#/default')
    const player = page.locator('[class*="videoContainer"]').first()
    const video = player.locator('video')
    await video.evaluate((element: HTMLVideoElement) => {
        Object.defineProperty(element, 'duration', { configurable: true, value: 120 })
        element.currentTime = 20
        element.dispatchEvent(new Event('timeupdate'))
    })
    await player.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        const touch = (x: number, y: number) => new Touch({ identifier: 1, target: element, clientX: x, clientY: y })
        element.dispatchEvent(
            new TouchEvent('touchstart', { bubbles: true, touches: [touch(rect.left + 80, rect.top + 80)] })
        )
        element.dispatchEvent(
            new TouchEvent('touchmove', {
                bubbles: true,
                cancelable: true,
                touches: [touch(rect.left + 180, rect.top + 80)]
            })
        )
        element.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [] }))
    })
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(20)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
