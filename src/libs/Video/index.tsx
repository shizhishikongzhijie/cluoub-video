import React, {useEffect, useRef, useState} from 'react';
import {WebSocketManager} from './WebSocketManager';
import {BarrageFilter} from './BarrageFilter';
import './anime-player.css';
import {v4 as uuidv4} from 'uuid';
import PlayButton from './components/PlayButton';
import VolumeControl from './components/VolumeControl';
import TimeDisplay from './components/TimeDisplay';
import ProgressControl from './components/ProgressControl';
import SettingsButton from './components/SettingsButton';
import FullscreenButton from './components/FullscreenButton';
import BarrageInput from './components/BarrageInput';

interface Barrage {
  id: string;
  text: string;
  userId: string;
  username: string;
  timestamp: number;
  color?: string;
  size?: number;
  position?: number;
}

interface ControlConfig {
  play?: boolean;
  volume?: boolean;
  time?: boolean;
  progress?: boolean;
  settings?: boolean;
  fullscreen?: boolean;
  barrage?: boolean;
}

interface VideoProps {
  videoSrc: string;
  videoId: string;
  userId: string;
  username: string;
  width?: string | number;
  height?: string | number;
  aspectRatio?: string; // e.g., "16:9", "4:3"
  controls?: ControlConfig;
  customIcons?: {
    playIcon?: React.ReactNode;
    pauseIcon?: React.ReactNode;
    volumeIcon?: React.ReactNode;
    muteIcon?: React.ReactNode;
    fullscreenIcon?: React.ReactNode;
    settingsIcon?: React.ReactNode;
    sendIcon?: React.ReactNode;
    progressThumbIcon?: React.ReactNode;
  };
  // 缩略图相关属性
  thumbnailUrl?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
}

const CluoubVideo: React.FC<VideoProps> = ({ 
  videoSrc, 
  videoId, 
  userId, 
  username, 
  width = '100%', 
  height = 'auto',
  aspectRatio = '16:9',
  controls = {
    play: true,
    volume: true,
    time: true,
    progress: true,
    settings: true,
    fullscreen: true,
    barrage: true
  },
  customIcons,
  thumbnailUrl,
  thumbnailWidth = 120,
  thumbnailHeight = 80
}) => {
  const [barrages, setBarrages] = useState<Barrage[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showThumbnail, setShowThumbnail] = useState(false);
  const [thumbnailPosition, setThumbnailPosition] = useState({ x: 0, time: 0 });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wsManager = useRef<WebSocketManager | null>(null);
  const filter = useRef<BarrageFilter>(new BarrageFilter());
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const thumbnailPreloadRef = useRef<HTMLImageElement | null>(null);

  // 初始化WebSocket
  useEffect(() => {
    wsManager.current = new WebSocketManager(videoId);
    
    // 连接WebSocket
    wsManager.current.connect();
    
    // 处理新弹幕
    wsManager.current.onBarrage((newBarrage: Barrage) => {
      setBarrages(prev => [...prev, newBarrage]);
    });
    
    // 获取历史弹幕
    wsManager.current.onHistory((historyBarrages: Barrage[]) => {
      setBarrages(historyBarrages);
    });
    
    return () => {
      // 组件卸载时清理
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [videoId]);

  // 预加载缩略图
  useEffect(() => {
    if (thumbnailUrl) {
      thumbnailPreloadRef.current = new Image();
      thumbnailPreloadRef.current.src = thumbnailUrl;
    }
  }, [thumbnailUrl]);

  // 监听视频播放状态
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleMute = () => setIsMuted(video.muted);
    const handleVolumeChange = () => setVolume(video.volume);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };
    
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleMute);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleMute);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  // 清理过期弹幕以提高性能
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setBarrages(prev => prev.filter(barrage => now - barrage.timestamp < 10000)); // 只保留10秒内的弹幕
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 播放/暂停
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  // 静音切换
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isMuted) {
      // 如果当前是静音状态，取消静音并恢复之前的音量
      video.muted = false;
      setIsMuted(false);
      video.volume = volume > 0 ? volume : 0.5; // 如果之前音量为0，则设置为0.5
      setVolume(video.volume);
    } else {
      // 如果当前不是静音状态，设置为静音
      video.muted = true;
      setIsMuted(true);
    }
  };

  // 音量控制
  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // 进度条控制
  const handleProgressChange = (newProgress: number, newTime: number) => {
    setProgress(newProgress);
    setCurrentTime(newTime);
  };

  // 跳转到指定时间
  const handleSeek = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = time;
    setCurrentTime(time);
    setProgress((time / (duration || 1)) * 100);
  };

  // 显示/隐藏缩略图
  const handleShowThumbnail = (show: boolean, position?: { x: number; time: number }) => {
    setShowThumbnail(show);
    if (position) {
      setThumbnailPosition(position);
    }
  };

  // 全屏切换
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    
    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // 发送弹幕
  const sendBarrage = (text: string) => {
    const filteredText = filter.current.filter(text);
    if (!filteredText) return; // 过滤后为空
    
    // 发送至服务器
    if (wsManager.current) {
      wsManager.current.sendBarrage(filteredText, userId, username);
    }
    
    // 本地立即显示（避免等待服务器响应）
    const newBarrage: Barrage = {
      id: uuidv4(),
      text: filteredText,
      userId,
      username,
      timestamp: Date.now(),
      color: `hsl(${Math.floor(Math.random() * 360)}, 100%, 70%)`, // 使用HSL色彩空间获得更鲜艳的颜色
      size: Math.floor(Math.random() * 8 + 10), // 调整字体大小范围
      position: Math.floor(Math.random() * 7) * 10 + 5 // 增加更多位置选项 (5%, 15%, 25%, ..., 65%)
    };
    
    setBarrages(prev => [...prev, newBarrage]);
  };

  // 计算容器样式
  const getContainerStyle = () => {
    let style: React.CSSProperties = {
      width: width,
      height: height
    };

    if (aspectRatio) {
      const [w, h] = aspectRatio.split(':').map(Number);
      style = {
        ...style,
        aspectRatio: `${w}/${h}`
      };
    }

    return style;
  };

  return (
    <div 
      className="anime-player-container" 
      ref={containerRef}
      style={getContainerStyle()}
    >
      <div className="video-wrapper">
        <video
          ref={videoRef}
          src={videoSrc}
          playsInline
          muted={isMuted}
          className="video-element"
        />
        
        {/* 弹幕渲染层 */}
        <div className="barrage-container">
          {barrages.map(barrage => (
            <div
              key={barrage.id}
              className="barrage"
              style={{
                top: `${barrage.position}%`,
                color: barrage.color,
                fontSize: `${barrage.size}px`,
                animationDuration: `${Math.random() * 10 + 8}s`
              }}
            >
              {barrage.text}
            </div>
          ))}
        </div>
        
        {/* 视频控制栏 */}
        <div className={`video-controls ${showControls ? 'visible' : 'hidden'}`}>
          {/* 播放按钮 */}
          {controls.play && (
            <PlayButton 
              isPlaying={isPlaying}
              onToggle={togglePlay}
              customIcons={customIcons ? { 
                playIcon: customIcons.playIcon, 
                pauseIcon: customIcons.pauseIcon 
              } : undefined}
            />
          )}
          
          {/* 音量控制 */}
          {controls.volume && (
            <VolumeControl
              isMuted={isMuted}
              volume={volume}
              onToggleMute={toggleMute}
              onVolumeChange={handleVolumeChange}
              customIcons={customIcons ? { 
                volumeIcon: customIcons.volumeIcon, 
                muteIcon: customIcons.muteIcon 
              } : undefined}
            />
          )}
          
          {/* 时间显示 */}
          {controls.time && (
            <TimeDisplay 
              currentTime={currentTime}
              duration={duration}
            />
          )}
          
          {/* 进度条 */}
          {controls.progress && (
            <ProgressControl
              progress={progress}
              duration={duration}
              currentTime={currentTime}
              showThumbnail={showThumbnail}
              thumbnailPosition={thumbnailPosition}
              thumbnailUrl={thumbnailUrl}
              thumbnailWidth={thumbnailWidth}
              thumbnailHeight={thumbnailHeight}
              customIcons={customIcons ? { 
                progressThumbIcon: customIcons.progressThumbIcon 
              } : undefined}
              onProgressChange={handleProgressChange}
              onSeek={handleSeek}
              onShowThumbnail={handleShowThumbnail}
            />
          )}
          
          {/* 设置按钮 */}
          {controls.settings && (
            <SettingsButton 
              customIcons={customIcons ? { 
                settingsIcon: customIcons.settingsIcon 
              } : undefined}
            />
          )}
          
          {/* 全屏按钮 */}
          {controls.fullscreen && (
            <FullscreenButton 
              isFullscreen={isFullscreen}
              onToggle={toggleFullscreen}
              customIcons={customIcons ? { 
                fullscreenIcon: customIcons.fullscreenIcon 
              } : undefined}
            />
          )}
        </div>
      </div>
      
      {/* 弹幕输入框 */}
      {controls.barrage && (
        <BarrageInput 
          isPlaying={isPlaying}
          onSend={sendBarrage}
          customIcons={customIcons ? { 
            sendIcon: customIcons.sendIcon 
          } : undefined}
        />
      )}
    </div>
  );
};

export default CluoubVideo;