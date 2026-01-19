import type {PlayerInstance} from '../../core/types'

export const dashPlugin = (player: PlayerInstance, dataPrefix: string = '') => {
    const { options } = player
    const { source } = options

    // 非 MPD 源，直接退出
    if (typeof source === 'string' && !source.endsWith('.mpd')) {
        return
    }

    let dash: any = null
    let isDestroyed = false

    // 安全处理 dataPrefix
    const safeDataPrefix = dataPrefix.endsWith('/') ? dataPrefix : dataPrefix + '/'

    // 异步加载 dashjs 并初始化
    const loadAndInitDash = async () => {
        try {
            // 动态导入 dashjs
            const dashjsModule = await import('dashjs')
            if (isDestroyed) return

            const dashInstance = dashjsModule.default.MediaPlayer().create()
            dash = dashInstance

            // 初始化播放器
            dash.initialize(player.video, source, false)

            // 扩展 RequestModifier
            dash.extend(
                'RequestModifier',
                () => ({
                    modifyRequestHeader: (xhr: XMLHttpRequest) => xhr,
                    modifyRequestURL: (url: string) => {
                        if (url && !/^https?:\/\//.test(url) && !url.startsWith('/')) {
                            return safeDataPrefix + url
                        }
                        return url
                    }
                }),
                true
            )

            // manifest 加载后更新画质列表
            dash.on('manifestLoaded', () => {
                if (isDestroyed) return
                const qualities = dash.getBitrateInfoListFor('video').map((q: any) => ({
                    key: String(q.qualityIndex),
                    label: `${q.height}P`
                }))
                player.store.setState({ qualities })
            })

            // 监听画质切换
            const onQualityChange = (q: string) => {
                if (!dash || isDestroyed) return
                if (q === 'auto') {
                    dash.updateSettings({
                        streaming: { abr: { autoSwitchBitrate: { video: true } } }
                    })
                } else {
                    dash.setQualityFor('video', parseInt(q, 10))
                }
            }

            player.on('request-quality-change', onQualityChange)

            // 更新 UI：替换为真实选择器（这里简化为文本）
            // 实际项目中应传入 QualitySelector 组件
            player.registerUI('quality-selector', <div>画质已加载</div>, 'control')
        } catch (error) {
            console.error('Failed to load dashjs or initialize DASH player:', error)
            player.registerUI('quality-selector', <div>画质不可用</div>, 'control')
        }
    }

    // 立即注册一个占位 UI（可选：显示“加载中”）
    player.registerUI('quality-selector', <div>加载画质...</div>, 'control')

    // 启动加载
    loadAndInitDash()

    // 清理函数
    return () => {
        isDestroyed = true
        if (dash) {
            dash.reset()
            dash = null
        }
        // 注意：无法取消 import()，但可通过 isDestroyed 标志避免后续操作
    }
}
