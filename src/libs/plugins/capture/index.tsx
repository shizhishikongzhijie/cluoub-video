import { optionalBoolean, optionalNumber, optionalString, parseConfigObject } from '../../core/config'
import { definePlugin } from '../../core/plugin'
import { type CaptureConfig, CaptureControl } from './CaptureControl'

/**
 * 截图 / GIF 录制插件。
 * 通过 props 传入 `capture: CaptureConfig` 进行配置（与 subtitle 插件约定一致）。
 * 按钮以「右侧竖排工具栏」形式悬浮在视频右边缘中部（而非底部控制栏）。
 */
const parseCaptureConfig = (input: unknown): CaptureConfig => {
    const config = parseConfigObject(input, 'capture', [
        'screenshot',
        'gif',
        'gifFps',
        'gifDuration',
        'filename',
        'onGifReady'
    ])
    if (config.onGifReady !== undefined && typeof config.onGifReady !== 'function') {
        throw new TypeError('onGifReady must be a function')
    }
    const gifFps = optionalNumber(config, 'gifFps', 10)
    const gifDuration = optionalNumber(config, 'gifDuration', 3)
    if (gifFps <= 0 || gifDuration <= 0) throw new TypeError('gifFps and gifDuration must be greater than zero')
    return {
        screenshot: optionalBoolean(config, 'screenshot', true),
        gif: optionalBoolean(config, 'gif', true),
        gifFps,
        gifDuration,
        filename: optionalString(config, 'filename', '') || undefined,
        onGifReady: config.onGifReady as CaptureConfig['onGifReady']
    }
}

export const capturePlugin = definePlugin<CaptureConfig>({
    id: 'capture',
    schema: { parse: parseCaptureConfig },
    setup: ({ player, slots }, config) => {
        slots.register({
            id: 'capture-toolbar',
            slot: 'overlay',
            content: <CaptureControl player={player} config={config} />,
            zIndex: 20
        })
    }
})
