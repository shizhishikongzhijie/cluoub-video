import {
    type ControlButtonConfig,
    type IPlayerCore,
    type IPlayerPlugin,
    type IPlayerPluginApi,
    type PlayerComponentConfig,
} from "../libs/Video";
import {MessageSquare} from "lucide-react";

export class DanmuPlugin implements IPlayerPlugin{
    name = 'danmu';
    private player: IPlayerCore| null= null;
    private api: IPlayerPluginApi | null = null;
    install(player: IPlayerCore, options?: any): void {
        this.player = player;
        console.log('DemoPlugin installed with options:', options);
    }
    // 接收插件API的方法
    setAPI(api: IPlayerPluginApi): void {
        this.api = api;
        console.log('Plugin API received');

        const danmuToggleButtonConfig: ControlButtonConfig = {
            id: 'danmu-toggle-button',
            position: 'right',
            order: 5,
            icon: <MessageSquare size={20} />,
            title: '弹幕开关',
            onClick: () => {
                console.log('Demo button clicked!');
                alert('示例按钮被点击了！');
            }
        };

        // 注册一个视频上层组件（类似弹幕容器）
        const overlayComponent: PlayerComponentConfig = {
            id: 'demo-overlay',
            order: 10,
            absolute: true,
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
        };

        // 注册按钮和组件
        if (this.api) {
            this.api.registerControlButton(danmuToggleButtonConfig);
            this.api.registerComponent(overlayComponent);

            // 监听播放器事件
            if (this.player) {
                // 模拟监听播放事件
                const originalPlay = this.player.play;
                this.player.play = function() {
                    console.log('Video is playing!');
                    // 显示覆盖层
                    const overlay = document.getElementById('demo-overlay-text');
                    if (overlay) {
                        overlay.style.display = 'block';
                        setTimeout(() => {
                            if (overlay) overlay.style.display = 'none';
                        }, 2000);
                    }
                    return originalPlay.apply(this, []);
                };

                // 定期获取和显示播放器状态
                setInterval(() => {
                    const state = this.player?.isPlaying;
                    console.log('Player state:', state);
                }, 5000);
            }
        }
    }

    destroy(): void {
        console.log('DemoPlugin destroyed');
        // 清理资源
        if (this.api) {
            this.api.unregisterControlButton('danmu-toggle-button');
            this.api.unregisterComponent('demo-overlay');
        }
    }
}
