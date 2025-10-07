import {IPlayerCore, IPlayerPlugin} from '../core/IPlayerCore';
import {SubtitlePluginOptions} from './PluginOptions';

/**
 * 字幕插件
 */
export class SubtitlePlugin implements IPlayerPlugin {
  name = 'subtitle';
  private player: IPlayerCore;
  private options: SubtitlePluginOptions;

  constructor(options?: SubtitlePluginOptions) {
    this.options = {
      enabled: true,
      defaultTrackIndex: 0,
      display: {
        fontSize: 20,
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        fontFamily: 'Arial, sans-serif'
      },
      timeOffset: 0,
      ...options
    };
  }

  install(player: IPlayerCore, options?: SubtitlePluginOptions): void {
    // 合并配置选项
    this.options = { ...this.options, ...options };
    
    if (!this.options.enabled) {
      return;
    }
    
    this.player = player;
    
    // 初始化字幕设置
    this.initSubtitles();
  }

  private initSubtitles(): void {
    // 设置默认字幕轨道
    if (this.options.defaultTrackIndex !== undefined) {
      this.player.setSubtitleTrack(this.options.defaultTrackIndex);
    }
  }

  /**
   * 切换字幕显示
   */
  toggleSubtitles(): void {
    this.player.toggleSubtitles();
  }

  /**
   * 设置字幕轨道
   * @param index 轨道索引
   */
  setSubtitleTrack(index: number): void {
    this.player.setSubtitleTrack(index);
  }

  /**
   * 设置字幕显示状态
   * @param show 是否显示
   */
  setShowSubtitles(show: boolean): void {
    this.player.setShowSubtitles(show);
  }

  /**
   * 获取字幕显示配置
   */
  getDisplayOptions(): any {
    return this.options.display;
  }

  /**
   * 设置字幕时间偏移
   * @param offset 偏移时间（秒）
   */
  setTimeOffset(offset: number): void {
    this.options.timeOffset = offset;
    // 通知播放器更新字幕时间偏移
    this.player.emit('subtitleTimeOffsetChange', offset);
  }

  destroy(): void {
    // 字幕插件销毁逻辑
  }
}