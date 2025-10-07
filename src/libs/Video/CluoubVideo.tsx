import React, {useCallback, useEffect, useRef, useState} from "react";
import {Barrage, VideoProps} from "./Video.types";
import {BarrageFilter} from "./BarrageFilter";
import PlayButton from "./components/PlayButton";
import VolumeControl from "./components/VolumeControl";
import TimeDisplay from "./components/TimeDisplay";
import ProgressControl from "./components/ProgressControl";
import SettingsButton from "./components/SettingsButton";
import FullscreenButton from "./components/FullscreenButton";
import BarrageInput from "./components/BarrageInput";
import BarrageToggleButton from "./components/BarrageToggleButton";
import SubtitlesMenu from "./components/SubtitlesMenu";
import {useControlsManager, usePlayerCore, useThumbnailManager} from "./hooks";
import {useVideoEvents} from "./hooks/useVideoEvents";
import {useSubtitles} from "./hooks/useSubtitles";
import {useKeyboardShortcuts} from "./hooks/useKeyboardShortcuts";
import {useControlsVisibility} from "./hooks/useControlsVisibility";

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
    barrage: true,
    subtitles: true
  },
  customIcons,
  thumbnailUrl,
  thumbnailWidth = 120,
  thumbnailHeight = 80,
  tracks = [],
  enableShortcuts = true
}) => {
  // 使用播放器核心
  const playerCore = usePlayerCore({ videoSrc, videoId, userId, username });
  
  // 使用控制栏管理器
  const controlsManager = useControlsManager();
  
  // 使用缩略图管理器
  const thumbnailManager = useThumbnailManager(thumbnailUrl);
  
  // 状态管理
  const [barrages, setBarrages] = useState<Barrage[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showThumbnail, setShowThumbnail] = useState(false);
  const [thumbnailPosition, setThumbnailPosition] = useState({ x: 0, time: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filter = useRef<BarrageFilter>(new BarrageFilter());

  // 使用控制栏可见性Hook
  const { showControls, setShowControls } = useControlsVisibility(containerRef, controlsManager);

  // 监听播放器核心事件
  useEffect(() => {
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = (data: { isMuted: boolean; volume: number }) => {
      setIsMuted(data.isMuted);
      setVolume(data.volume);
    };
    const handleSeek = (data: { time: number; progress: number }) => {
      setCurrentTime(data.time);
      setProgress(data.progress);
      
      // 当视频跳转时，清理过期弹幕
      console.log('[CluoubVideo] 视频跳转到:', data.time);
    };
    const handleProgressChange = (progress: number) => {
      setProgress(progress);
    };
    const handleFullscreenChange = (fullscreen: boolean) => {
      setIsFullscreen(fullscreen);
      // 实际执行全屏操作
      handleFullscreenToggle(fullscreen);
    };
    const handleBarragesUpdate = (barrages: Barrage[]) => {
      console.log('[CluoubVideo] 弹幕更新，当前弹幕数量:', barrages.length);
      console.log('[CluoubVideo] 弹幕列表:', barrages);
      setBarrages(barrages);
    };
    const handleTimeUpdate = (data: { currentTime: number; progress: number }) => {
      setCurrentTime(data.currentTime);
      setProgress(data.progress);
      
      // 当时间更新时，也更新弹幕
      console.log('[CluoubVideo] 视频时间更新到:', data.currentTime);
    };
    const handleDurationChange = (duration: number) => {
      setDuration(duration);
    };
    
    // 字幕相关事件处理
    const handleSubtitleTrackChange = ({ trackIndex, showSubtitles }: { trackIndex: number, showSubtitles: boolean }) => {
      const video = videoRef.current;
      if (!video || !video.textTracks) return;
      
      console.log('PlayerCore字幕轨道变化:', { trackIndex, showSubtitles }, '轨道数量:', video.textTracks.length);
      
      if (showSubtitles && video.textTracks.length > 0) {
        const validIndex = Math.min(trackIndex, video.textTracks.length - 1);
        for (let i = 0; i < video.textTracks.length; i++) {
          video.textTracks[i].mode = i === validIndex ? 'showing' : 'hidden';
        }
      } else {
        for (let i = 0; i < video.textTracks.length; i++) {
          video.textTracks[i].mode = 'hidden';
        }
      }
    };

    const handleSubtitlesVisibilityChange = (show: boolean) => {
      const video = videoRef.current;
      if (!video || !video.textTracks) return;
      
      console.log('PlayerCore字幕可见性变化:', { show });
      
      const trackIndex = playerCore.currentTrackIndex;
      if (show && video.textTracks.length > 0) {
        const validIndex = Math.min(trackIndex, video.textTracks.length - 1);
        for (let i = 0; i < video.textTracks.length; i++) {
          video.textTracks[i].mode = i === validIndex ? 'showing' : 'hidden';
        }
      } else {
        for (let i = 0; i < video.textTracks.length; i++) {
          video.textTracks[i].mode = 'hidden';
        }
      }
    };

    playerCore.on('play', handlePlay);
    playerCore.on('pause', handlePause);
    playerCore.on('volumeChange', handleVolumeChange);
    playerCore.on('seek', handleSeek);
    playerCore.on('progressChange', handleProgressChange);
    playerCore.on('fullscreenChange', handleFullscreenChange);
    playerCore.on('barragesUpdate', handleBarragesUpdate);
    playerCore.on('timeUpdate', handleTimeUpdate);
    playerCore.on('durationChange', handleDurationChange);
    playerCore.on('subtitleTrackChange', handleSubtitleTrackChange);
    playerCore.on('subtitlesVisibilityChange', handleSubtitlesVisibilityChange);

    return () => {
      playerCore.removeListener('play', handlePlay);
      playerCore.removeListener('pause', handlePause);
      playerCore.removeListener('volumeChange', handleVolumeChange);
      playerCore.removeListener('seek', handleSeek);
      playerCore.removeListener('progressChange', handleProgressChange);
      playerCore.removeListener('fullscreenChange', handleFullscreenChange);
      playerCore.removeListener('barragesUpdate', handleBarragesUpdate);
      playerCore.removeListener('timeUpdate', handleTimeUpdate);
      playerCore.removeListener('durationChange', handleDurationChange);
      playerCore.removeListener('subtitleTrackChange', handleSubtitleTrackChange);
      playerCore.removeListener('subtitlesVisibilityChange', handleSubtitlesVisibilityChange);
    };
  }, [playerCore]);

  // 监听缩略图状态变化
  useEffect(() => {
    setShowThumbnail(thumbnailManager.isThumbnailVisible);
    setThumbnailPosition(thumbnailManager.thumbnailPosition);
  }, [thumbnailManager.isThumbnailVisible, thumbnailManager.thumbnailPosition]);

  // 使用视频事件Hook
  useVideoEvents(videoRef, playerCore, isMuted, volume, currentTime);

  // 使用字幕Hook
  useSubtitles(videoRef, playerCore, tracks);

  // 使用快捷键Hook
  useKeyboardShortcuts(containerRef, playerCore, enableShortcuts, currentTime, duration, volume);

  // 更新缩略图URL到管理器
  useEffect(() => {
    thumbnailManager.updateThumbnailUrl(thumbnailUrl);
  }, [thumbnailUrl, thumbnailManager]);

  // 监听视频播放状态变化（来自video元素）
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => playerCore.play();
    const handlePause = () => playerCore.pause();
    const handleMute = () => playerCore.setMuted(video.muted);
    const handleVolumeChange = () => {
      // 只有当音量真正改变时才通知PlayerCore
      if (video.volume !== volume || video.muted !== isMuted) {
        playerCore.setVolume(video.volume);
      }
    };
    const handleTimeUpdate = () => {
      playerCore.setTimeUpdate(video.currentTime);
    };
    const handleLoadedMetadata = () => {
      playerCore.setDuration(video.duration);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    const muteListener = () => handleMute();
    const volumeListener = () => handleVolumeChange();
    video.addEventListener('volumechange', muteListener);
    video.addEventListener('volumechange', volumeListener);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', muteListener);
      video.removeEventListener('volumechange', volumeListener);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [playerCore, volume, isMuted]);

  // 播放/暂停
  const togglePlay = () => {
    playerCore.togglePlay();
  };

  // 静音切换
  const toggleMute = () => {
    playerCore.toggleMute();
  };

  // 音量控制
  const handleVolumeChange = (newVolume: number) => {
    playerCore.setVolume(newVolume);
  };

  // 进度条控制
  const handleProgressChange = (newProgress: number, _newTime: number) => {
    playerCore.setProgress(newProgress);
  };

  // 跳转到指定时间
  const handleSeek = (time: number) => {
    playerCore.seek(time);
  };

  // 显示/隐藏缩略图
  const handleShowThumbnail = (show: boolean, position?: { x: number; time: number }) => {
    if (show && position) {
      thumbnailManager.showThumbnail(position);
    } else {
      thumbnailManager.hideThumbnail();
    }
  };

  // 全屏切换
  const toggleFullscreen = () => {
    playerCore.toggleFullscreen();
  };

  // 实际执行全屏操作
  const handleFullscreenToggle = (fullscreen: boolean) => {
    const container = containerRef.current;
    if (!container) return;

    if (fullscreen) {
      // 进入全屏
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(err => {
          console.error("无法进入全屏模式:", err);
        });
      }
    } else {
      // 退出全屏
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.error("无法退出全屏模式:", err);
        });
      }
    }
  };

  // 切换弹幕输入框显示/隐藏
  const toggleBarrageInput = () => {
    playerCore.toggleBarrageInput();
  };

  // 字幕菜单是否打开
  const [isSubtitlesMenuOpen, setIsSubtitlesMenuOpen] = useState(false);
  
  // 切换字幕菜单显示状态
  const toggleSubtitlesMenu = () => {
    setIsSubtitlesMenuOpen(!isSubtitlesMenuOpen);
  };
  
  // 选择字幕轨道
  const selectSubtitleTrack = (trackId: string) => {
    const trackIndex = tracks.findIndex(track => track.id === trackId);
    if (trackIndex !== -1) {
      playerCore.setSubtitleTrack(trackIndex);
      playerCore.setShowSubtitles(true);
    }
    setIsSubtitlesMenuOpen(false);
  };
  
  // 关闭字幕
  const closeSubtitles = () => {
    playerCore.setShowSubtitles(false);
    setIsSubtitlesMenuOpen(false);
  };

  // 发送弹幕
  const sendBarrage = useCallback((text: string) => {
    console.log('[CluoubVideo] 准备发送弹幕:', text);
    const filteredText = filter.current.filter(text);
    if (!filteredText) {
      console.log('[CluoubVideo] 弹幕文本被过滤器过滤');
      return; // 过滤后为空
    }

    // 防止重复发送相同弹幕
    const lastBarrage = barrages[barrages.length - 1];
    if (lastBarrage && lastBarrage.text === filteredText && 
        Date.now() - lastBarrage.timestamp < 100) {
      console.log('[CluoubVideo] 检测到重复弹幕，取消发送');
      return;
    }

    // 发送弹幕到播放器核心
    console.log('[CluoubVideo] 发送弹幕到PlayerCore:', { filteredText, userId, username });
    playerCore.sendBarrage(filteredText, userId, username);
  }, [barrages, playerCore, userId, username]);

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
              className={`barrage ${!isPlaying ? 'paused' : ''}`}
              style={{
                top: `${barrage.position || Math.random() * 80 + 10}%`,
                color: barrage.color || '#ffffff',
                fontSize: `${barrage.size || 16}px`,
                animationDuration: `${barrage.duration || 8}s`
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

          {/* 弹幕控制按钮 - 使用组件 */}
          {controls.barrage && (
            <BarrageToggleButton
              isActive={playerCore.showBarrageInput}
              onClick={toggleBarrageInput}
              title={playerCore.showBarrageInput ? "隐藏弹幕输入框" : "显示弹幕输入框"}
            />
          )}
          
          {/* 字幕控制按钮 - 使用SubtitlesMenu组件 */}
          {controls.subtitles && tracks.length > 0 && (
            <SubtitlesMenu
              options={tracks.map((track, index) => ({
                id: track.id,
                label: track.label,
                language: track.srclang,
                isActive: playerCore.showSubtitles && index === playerCore.currentTrackIndex
              }))}
              isOpen={isSubtitlesMenuOpen}
              onToggle={toggleSubtitlesMenu}
              onSelect={selectSubtitleTrack}
              onCloseSubtitles={closeSubtitles}
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

      {/* 弹幕输入框 - 现在由PlayerCore控制 */}
      {controls.barrage && playerCore.showBarrageInput && (
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