import {useEffect, useState} from 'react';
import {ControlsManager} from '../managers';

/**
 * 自定义Hook，用于处理控制栏显示/隐藏
 * @param containerRef 容器元素的引用
 * @param controlsManager 控制栏管理器实例
 */
export const useControlsVisibility = (
  containerRef: React.RefObject<HTMLDivElement>,
  controlsManager: ControlsManager
) => {
  const [showControls, setShowControls] = useState(true);

  // 控制栏显示/隐藏
  useEffect(() => {
    const handleMouseMove = () => {
      controlsManager.handleMouseMove(setShowControls);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [controlsManager]);

  // 更新播放状态到控制管理器
  useEffect(() => {
    controlsManager.updatePlayingState(controlsManager.showControls);
  }, [controlsManager.showControls, controlsManager]);

  return { showControls, setShowControls };
};