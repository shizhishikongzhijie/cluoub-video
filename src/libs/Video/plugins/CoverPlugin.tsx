import {
    IPlayerCore,
    IPlayerPlugin,
    type IPlayerPluginApi,
    type PlayerComponentConfig,
    PlayerComponentConfigType
} from '../core';

interface CoverPluginOptions {
  coverImage?: string;
  showCover?: boolean;
}

export class CoverPlugin implements IPlayerPlugin {
  name = 'cover';
  private options: CoverPluginOptions;
  private isVisible: boolean = true;
  private player: IPlayerCore | null = null;
  private api: IPlayerPluginApi | null = null;
  constructor(options: CoverPluginOptions = {}) {
    this.options = {
      showCover: true,
      ...options
    };
  }
  
  install(player: IPlayerCore, options?: CoverPluginOptions) {
    this.player = player;
  }
  
  setAPI(api: IPlayerPluginApi) {
    if (!this.options.showCover || !this.options.coverImage || !api || !api.player) return;
    this.api = api;
      // eslint-disable-next-line @typescript-eslint/no-this-alias
    const pluginInstance = this;
    const overlayComponent: PlayerComponentConfig = {
      id: 'cover-overlay',
      order: 10,
      absolute: true,
      type: PlayerComponentConfigType.COVER,
      component: (
          <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${pluginInstance.options.coverImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'block',
                zIndex: 1000
              }}
          />
      )
    };

    // 注册按钮和组件
    if (this.api) {
      this.api.registerComponent(overlayComponent);

      // 监听播放器事件
      if (this.player) {
        // 模拟监听播放事件
        const originalPlay = this.player.play;
        this.player.play = function() {
          if (pluginInstance.isVisible) {
              pluginInstance.isVisible = false;
              const element = document.getElementById('cover-overlay');
              if (element && element.children[0]) {
                (element.children[0] as HTMLElement).style.opacity = '0';
              }
          }
          return originalPlay.apply(this, []);
        };
      }
    }
  }
  
  destroy() {
    // 清理工作
      this.api?.unregisterComponent('cover-overlay');
  }
}