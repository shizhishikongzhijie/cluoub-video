import {ControlButtonConfig, IPlayerPlugin, PlayerComponentConfig, PlayerComponentConfigType} from '../core'

// 示例插件
class DemoPlugin implements IPlayerPlugin {
    name = 'demo'
    private player: any = null
    private api: any = null

    install(player: any, options?: any): void {
        this.player = player
        console.log('DemoPlugin installed with options:', options)
        // 安装逻辑暂时在这里，但实际的注册逻辑会在setAPI中执行
    }

    // 接收插件API的方法
    setAPI(api: any): void {
        this.api = api
        console.log('Plugin API received')

        // 注册一个简单的控制按钮
        const simpleButtonConfig: ControlButtonConfig = {
            id: 'demo-simple-button',
            position: 'left',
            order: 5,
            icon: <span>🌟</span>,
            title: '示例按钮',
            onClick: () => {
                console.log('Demo button clicked!')
                alert('示例按钮被点击了！')
            }
        }

        // 注册一个自定义组件的控制按钮
        const customButtonConfig: ControlButtonConfig = {
            id: 'demo-custom-button',
            position: 'right',
            order: 10,
            customComponent: (
                <button
                    className="control-button demo-custom-button"
                    style={{ padding: '8px', marginRight: '4px' }}
                    onClick={(e) => {
                        e.stopPropagation()
                        console.log('Custom button clicked!')
                        alert('自定义按钮被点击了！')
                    }}
                    title="自定义示例按钮"
                >
                    <span style={{ fontSize: '16px' }}>🎬</span>
                </button>
            )
        }

        // 注册一个视频上层组件（类似弹幕容器）
        const overlayComponent: PlayerComponentConfig = {
            id: 'demo-overlay',
            order: 10,
            absolute: true,
            type: PlayerComponentConfigType.COVER,
            component: (
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        display: 'none', // 默认隐藏
                        zIndex: 1000
                    }}
                    id="demo-overlay-text"
                >
                    示例覆盖层
                </div>
            )
        }

        // 注册按钮和组件
        if (this.api) {
            this.api.registerControlButton(simpleButtonConfig)
            this.api.registerControlButton(customButtonConfig)
            this.api.registerComponent(overlayComponent)

            // 监听播放器事件
            if (this.player) {
                // 模拟监听播放事件
                const originalPlay = this.player.play
                this.player.play = function () {
                    console.log('Video is playing!')
                    // 显示覆盖层
                    const overlay = document.getElementById('demo-overlay-text')
                    if (overlay) {
                        overlay.style.display = 'block'
                        setTimeout(() => {
                            if (overlay) overlay.style.display = 'none'
                        }, 2000)
                    }
                    return originalPlay.apply(this, arguments)
                }
            }
        }
    }

    destroy(): void {
        console.log('DemoPlugin destroyed')
        // 清理资源
        if (this.api) {
            this.api.removeControlButton('demo-simple-button')
            this.api.removeControlButton('demo-custom-button')
            this.api.removeComponent('demo-overlay')
        }
    }
}

export default DemoPlugin
