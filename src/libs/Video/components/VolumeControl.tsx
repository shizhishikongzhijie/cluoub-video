import React, {useEffect, useRef} from 'react';
import {Volume2, VolumeX} from 'lucide-react';

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
  const isVolumeChanging = useRef(false);

  // 获取图标，优先使用自定义图标，否则使用默认图标
  const getIcon = (iconType: keyof NonNullable<VolumeControlProps['customIcons']>, defaultIcon: React.ReactNode) => {
    return customIcons && customIcons[iconType] ? customIcons[iconType] : defaultIcon;
  };

  // 添加事件监听器处理音量拖拽
  useEffect(() => {
    const volumeContainer = volumeContainerRef.current;
    if (!volumeContainer) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isVolumeChanging.current || !volumeContainer) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const rect = volumeContainer.getBoundingClientRect();
      const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      
      onVolumeChange(position);
    };

    const handleMouseUp = () => {
      isVolumeChanging.current = false;
    };

    volumeContainer.addEventListener('mousemove', handleMouseMove);
    volumeContainer.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      volumeContainer.removeEventListener('mousemove', handleMouseMove);
      volumeContainer.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [onVolumeChange]);

  // 音量控制开始
  const handleVolumeStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    isVolumeChanging.current = true;
    handleVolumeMove(e);
  };

  // 音量控制移动
  const handleVolumeMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!volumeContainerRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const rect = volumeContainerRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    
    onVolumeChange(position);
  };

  // 处理音量条点击直接设置音量
  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeContainerRef.current) return;
    
    const rect = volumeContainerRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    onVolumeChange(position);
  };

  return (
    <>
      <button 
        className="control-button"
        onClick={onToggleMute}
      >
        {isMuted || volume === 0 ? 
          getIcon('muteIcon', <VolumeX size={20} />) : 
          getIcon('volumeIcon', <Volume2 size={20} />)}
      </button>
      
      <div 
        className="volume-container"
        ref={volumeContainerRef}
        onClick={handleVolumeClick}
        onMouseDown={handleVolumeStart}
        onTouchStart={handleVolumeStart}
      >
        <div
          className="volume-buffer"
          style={{ width: `${volume * 100}%` }}
        />
      </div>
    </>
  );
};

export default VolumeControl;