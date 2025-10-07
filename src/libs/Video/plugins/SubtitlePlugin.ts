import {IPlayerCore, IPlayerPlugin} from '../core/IPlayerCore';

/**
 * 字幕插件
 */
export class SubtitlePlugin implements IPlayerPlugin {
  name = 'subtitle';

  install(player: IPlayerCore): void {
    // 字幕插件安装逻辑
  }

  /**
   * 切换字幕显示
   */
  toggleSubtitles(): void {
    // 切换字幕显示逻辑
  }

  /**
   * 设置字幕轨道
   * @param index 轨道索引
   */
  setSubtitleTrack(index: number): void {
    // 设置字幕轨道逻辑
  }

  /**
   * 设置字幕显示状态
   * @param show 是否显示
   */
  setShowSubtitles(show: boolean): void {
    // 设置字幕显示状态逻辑
  }

  destroy(): void {
    // 字幕插件销毁逻辑
  }
}