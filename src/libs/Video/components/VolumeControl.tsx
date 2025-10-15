import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Volume2, VolumeX} from 'lucide-react';
import './VolumeControl.css';
import Popover from "../common/popover";

interface VolumeControlProps {
  isMuted: boolean;
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  customIcons?: {
    volumeIcon?: React.ReactNode;
    muteIcon?: React.ReactNode;
  };
}

const VolumeControl: React.FC<VolumeControlProps> = ({ 
  isMuted, 
  volume, 
  onToggleMute, 
  onVolumeChange,
  customIcons 
}) => {
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const volumeBufferRef = useRef<HTMLDivElement>(null);
  const isVolumeChanging = useRef(false);
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);

  // 获取图标，优先使用自定义图标，否则使用默认图标
  const getIcon = (iconType: keyof NonNullable<VolumeControlProps['customIcons']>, defaultIcon: React.ReactNode) => {
    return customIcons && customIcons[iconType] ? customIcons[iconType] : defaultIcon;
  };

  // 更新音量条显示
  const updateVolumeBuffer = useCallback(() => {
    if (volumeBufferRef.current) {
      volumeBufferRef.current.style.transform = `scaleY(${volume})`;
    }
  }, [volume]);

  // 当volume变化时更新音量条显示
  useEffect(() => {
    updateVolumeBuffer();
  }, [updateVolumeBuffer]);

  // 音量控制移动
  const handleVolumeMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isVolumeChanging.current || !volumeContainerRef.current) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = volumeContainerRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, 1- ( clientY -rect.top ) / rect.height));
    onVolumeChange(position);
  }, [onVolumeChange]);

  // 音量控制结束
  const handleVolumeEnd = useCallback(() => {
    isVolumeChanging.current = false;
    setTimeout(() => {
      setIsPopoverVisible(false);
    }, 500)

  }, []);

  // 添加事件监听器处理音量拖拽
  useEffect(() => {
    // 只有在开始拖拽时才添加全局事件监听器
    if (!isVolumeChanging.current) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      handleVolumeMove(e);
    };

    const handleMouseUp = () => {
      handleVolumeEnd();
    };

    // 添加全局事件监听器，确保即使鼠标移出音量条区域也能正常工作
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      // 清理全局事件监听器
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isVolumeChanging.current, handleVolumeMove, handleVolumeEnd]); // 依赖于拖拽状态

  // 音量控制开始
  const handleVolumeStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    isVolumeChanging.current = true;
    setIsPopoverVisible(true);
    handleVolumeMove(e as any);
  };

  // 处理音量条点击直接设置音量
  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeContainerRef.current) return;

    const rect = volumeContainerRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, 1- (e.clientY -rect.top ) / rect.height));
    onVolumeChange(position);
  };

  return (
    <>
      <Popover visible={isPopoverVisible} content={<div
          className="volume-container"
          ref={volumeContainerRef}
          onClick={handleVolumeClick}
          onMouseDown={handleVolumeStart}
          onTouchStart={handleVolumeStart}
      >
        <div
            className="volume-buffer"
            ref={volumeBufferRef}
        />
      </div>} trigger="custom" >
        <button
          className="control-button"
          onClick={onToggleMute}
          onMouseEnter={() => setIsPopoverVisible(true)}
      >
        {isMuted || volume === 0 ?
            getIcon('muteIcon', <VolumeX size={20} />) :
            getIcon('volumeIcon', <Volume2 size={20} />)}
      </button>
      </Popover>
    </>
  );
};

export default VolumeControl;