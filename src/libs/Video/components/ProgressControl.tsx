import React, {useEffect, useRef} from 'react';
import {Circle} from 'lucide-react';

interface ProgressControlProps {
  progress: number;
  duration: number;
  currentTime: number;
  showThumbnail: boolean;
  thumbnailPosition: { x: number; time: number };
  thumbnailUrl?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  customIcons?: {
    progressThumbIcon?: React.ReactNode;
  };
  onProgressChange: (progress: number, time: number) => void;
  onSeek: (time: number) => void;
  onShowThumbnail: (show: boolean, position?: { x: number; time: number }) => void;
}

const ProgressControl: React.FC<ProgressControlProps> = ({ 
  progress,
  duration,
  currentTime,
  showThumbnail,
  thumbnailPosition,
  thumbnailUrl,
  thumbnailWidth = 120,
  thumbnailHeight = 80,
  customIcons,
  onProgressChange,
  onSeek,
  onShowThumbnail
}) => {
  const progressContainerRef = useRef<HTMLDivElement>(null);
  const isSeeking = useRef(false);

  // 获取图标，优先使用自定义图标，否则使用默认图标
  const getIcon = (iconType: keyof NonNullable<ProgressControlProps['customIcons']>, defaultIcon: React.ReactNode) => {
    return customIcons && customIcons[iconType] ? customIcons[iconType] : defaultIcon;
  };

  // 格式化时间
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // 添加事件监听器处理拖拽
  useEffect(() => {
    const progressContainer = progressContainerRef.current;
    if (!progressContainer) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      handleProgressMove(e as any);
    };

    const handleMouseUp = () => {
      if (isSeeking.current) {
        // 执行实际的视频跳转
        const newTime = (progress / 100) * duration;
        onSeek(newTime);
        handleProgressEnd();
      }
    };

    progressContainer.addEventListener('mousemove', handleMouseMove);
    progressContainer.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      progressContainer.removeEventListener('mousemove', handleMouseMove);
      progressContainer.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [duration, progress, onSeek]);

  // 进度条控制开始
  const handleProgressStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    isSeeking.current = true;
    handleProgressMove(e);
  };

  // 进度条控制移动
  const handleProgressMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isSeeking.current || !progressContainerRef.current || !duration) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const rect = progressContainerRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = position * duration;
    
    // 只更新UI，不实际跳转视频时间
    onProgressChange(position * 100, newTime);
    
    // 更新缩略图位置
    onShowThumbnail(true, {
      x: clientX - rect.left,
      time: newTime
    });
  };

  // 进度条控制结束
  const handleProgressEnd = () => {
    if (!isSeeking.current || !progressContainerRef.current || !duration) return;
    
    isSeeking.current = false;
    onShowThumbnail(false);
  };

  // 处理进度条点击直接跳转
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressContainerRef.current || !duration) return;
    
    const rect = progressContainerRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = position * duration;
    
    onSeek(newTime);
    onProgressChange(position * 100, newTime);
  };

  // 处理进度条鼠标移动事件以显示缩略图
  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isSeeking.current) return; // 如果正在拖拽，则不处理鼠标移动
    
    if (!progressContainerRef.current || !duration) return;
    
    const rect = progressContainerRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = position * duration;
    
    onShowThumbnail(true, {
      x: e.clientX - rect.left,
      time
    });
  };

  // 处理进度条鼠标离开事件
  const handleProgressMouseLeave = () => {
    if (!isSeeking.current) { // 只有在非拖拽状态下才隐藏缩略图
      onShowThumbnail(false);
    }
  };

  return (
    <div 
      className="progress-container"
      ref={progressContainerRef}
      onMouseMove={handleProgressMouseMove}
      onMouseLeave={handleProgressMouseLeave}
      onClick={handleProgressClick}
      onMouseDown={handleProgressStart}
      onTouchStart={handleProgressStart}
    >
      <div 
        className="progress-buffer"
        style={{ width: `${progress}%` }}
      />
      <div 
        className="progress-thumb"
        style={{ 
          left: `${progress}%`,
        }}
      >
        {customIcons?.progressThumbIcon || <Circle size={12} fill="white" />}
      </div>
      
      {/* 缩略图预览 */}
      {showThumbnail && thumbnailUrl && (
        <div 
          className="thumbnail-preview"
          style={{
            left: `${thumbnailPosition.x}px`,
            bottom: '30px',
            transform: 'translateX(-50%)'
          }}
        >
          <img 
            src={thumbnailUrl} 
            alt="Thumbnail" 
            width={thumbnailWidth}
            height={thumbnailHeight}
          />
          <div className="thumbnail-time">
            {formatTime(thumbnailPosition.time)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressControl;