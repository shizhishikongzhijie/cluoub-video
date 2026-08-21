import type { IPlayerPlugin } from '../../core/types'
import { type CaptureConfig, CaptureControl } from './CaptureControl'

/**
 * 截图 / GIF 录制插件。
 * 通过 props 传入 `capture: CaptureConfig` 进行配置（与 subtitle 插件约定一致）。
 * 按钮以「右侧竖排工具栏」形式悬浮在视频右边缘中部（而非底部控制栏）。
 */
export const capturePlugin: IPlayerPlugin<CaptureConfig> = (player) => {
    const config: CaptureConfig = player.options.capture ?? {}

    player.registerUI('capture-toolbar', <CaptureControl player={player} config={config} />, 'layer', {
        zIndex: 20
    })

    return () => {
        player.unregisterUI('capture-toolbar')
    }
}
