import React from 'react';
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

// 封装独立的封面组件
const CoverOverlay: React.FC<{ coverImage: string; isVisible: boolean }> = ({
  coverImage,
  isVisible
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url(${coverImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: isVisible ? 'block' : 'none',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        zIndex: 1000
      }}
    />
  );
};

export class CoverPlugin implements IPlayerPlugin {
  name = 'cover';
  private options: CoverPluginOptions;
  private player: IPlayerCore | null = null;
  private api: IPlayerPluginApi | null = null;
  private isVisible = true;

  constructor(options: CoverPluginOptions = {}) {
    this.options = {
      showCover: true,
      ...options
    };
  }

  install(player: IPlayerCore, _options?: CoverPluginOptions) {
    this.player = player;
  }

  setAPI(api: IPlayerPluginApi) {
    if (!this.options.showCover || !this.options.coverImage || !api || !api.player) return;
    this.api = api;

    const overlayComponent: PlayerComponentConfig = {
      id: 'cover-overlay',
      order: 10,
      absolute: true,
      type: PlayerComponentConfigType.COVER,
      component: (
        <CoverOverlay
          coverImage={this.options.coverImage}
          isVisible={this.isVisible}
        />
      )
    };

    this.api.registerComponent(overlayComponent);

    // 监听播放器事件
    if (this.player) {
      const originalPlay = this.player.play;
      this.player.play = (...args) => {
        this.hideCover();
        return originalPlay.apply(this.player!, args);
      };
    }
  }

  destroy() {
    this.api?.unregisterComponent('cover-overlay');
  }

  private hideCover() {
    if (this.isVisible && this.api) {
      this.isVisible = false;
      this.api.updateComponent('cover-overlay', {
        component: (
          <CoverOverlay
            coverImage={this.options.coverImage!}
            isVisible={false}
          />
        )
      });
    }
  }
}