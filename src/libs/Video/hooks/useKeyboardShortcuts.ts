import {useEffect} from 'react';
import {PlayerCore} from '../core';

/**
 * 自定义Hook，用于处理键盘快捷键
 * @param containerRef 容器元素的引用
 * @param playerCore 播放器核心实例
 * @param enableShortcuts 是否启用快捷键
 * @param currentTime 当前播放时间
 * @param duration 视频总时长
 * @param volume 当前音量
 */
export const useKeyboardShortcuts = (
  containerRef: React.RefObject<HTMLDivElement>,
  playerCore: PlayerCore,
  enableShortcuts: boolean,
  currentTime: number,
  duration: number,
  volume: number
) => {
  // 快捷键支持
  useEffect(() => {
    if (!enableShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 防止在输入框中触发快捷键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          playerCore.togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          playerCore.seek(Math.min(currentTime + 5, duration));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          playerCore.seek(Math.max(currentTime - 5, 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          playerCore.setVolume(Math.min(volume + 0.1, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          playerCore.setVolume(Math.max(volume - 0.1, 0));
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          playerCore.toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          playerCore.toggleMute();
          break;
        default:
          break;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      container.setAttribute('tabindex', '0'); // 使容器可获得焦点
      return () => {
        container.removeEventListener('keydown', handleKeyDown);
        container.removeAttribute('tabindex');
      };
    }
  }, [enableShortcuts, playerCore, currentTime, duration, volume]);
};