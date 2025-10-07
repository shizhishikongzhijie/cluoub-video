import React, {useEffect, useRef, useState} from "react";
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
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showThumbnail, setShowThumbnail] = useState(false);
  const [thumbnailPosition, setThumbnailPosition] = useState({ x: 0, time: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filter = useRef<BarrageFilter>(new BarrageFilter());

  // 初始化控制管理器
  useEffect(() => {
    controlsManager.init(isPlaying);
  }, [controlsManager, isPlaying]);

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
      setBarrages(barrages);
    };
    const handleControlsVisibilityChange = (show: boolean) => {
      setShowControls(show);
    };
    const handleTimeUpdate = (data: { currentTime: number; progress: number }) => {
      setCurrentTime(data.currentTime);
      setProgress(data.progress);
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
    playerCore.on('controlsVisibilityChange', handleControlsVisibilityChange);
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
      playerCore.removeListener('controlsVisibilityChange', handleControlsVisibilityChange);
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

  // 监听视频播放状态并同步到video元素
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 同步播放状态
    if (isPlaying) {
      video.play().catch(e => console.error("播放失败:", e));
    } else {
      video.pause();
    }
  }, [isPlaying]);

  // 监听音量状态并同步到video元素
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;
    video.volume = volume;
  }, [isMuted, volume]);

  // 监听时间跳转并同步到video元素
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 只有当差异较大时才跳转，避免频繁更新
    if (Math.abs(video.currentTime - currentTime) > 0.1) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);



  // 添加字幕轨道
  useEffect(() => {
    const video = videoRef.current;
    if (!video || tracks.length === 0) return;

    console.log('添加字幕轨道:', tracks);

    // 清除现有的字幕轨道（仅移除track元素）
    const existingTracks = Array.from(video.children).filter(child => child.tagName === 'TRACK');
    existingTracks.forEach(track => video.removeChild(track));

    // 添加新的字幕轨道
    tracks.forEach(track => {
      const trackElement = document.createElement('track');
      trackElement.kind = track.kind;
      trackElement.label = track.label;
      trackElement.srclang = track.srclang; // 使用srclang而不是language
      trackElement.src = track.src;
      if (track.default) {
        trackElement.default = true;
        console.log('设置默认轨道:', track.label, track.src);
      }
      
        // 添加轨道就绪事件监听
      trackElement.addEventListener('load', () => {
        console.log('轨道加载完成:', track.label, track.src);
        // 尝试重新设置轨道
        setupTextTracks();
      });
      
      trackElement.addEventListener('error', (e) => {
        console.error('轨道加载错误:', track.label, track.src, e);
        // 即使轨道加载失败，也尝试设置其他轨道
        setupTextTracks();
      });
      
      video.appendChild(trackElement);
    });

    // 立即尝试设置轨道（不等待loadedmetadata）
    const setupTextTracks = () => {
      setTimeout(() => {
        if (video && video.textTracks && video.textTracks.length > 0) {
          console.log('找到的文本轨道数量:', video.textTracks.length);
          
          // 打印所有轨道信息
          for (let i = 0; i < video.textTracks.length; i++) {
            const track = video.textTracks[i];
            console.log(`轨道 ${i}:`, track.label || '无标签', track.language || '无语言', track.mode);
          }
          
          // 查找默认轨道或第一个轨道
          let targetTrackIndex = -1;
          
          // 1. 先查找标记为default的轨道
          for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].default) {
              targetTrackIndex = i;
              break;
            }
          }
          
          // 2. 如果没有default轨道，使用第一个轨道
          if (targetTrackIndex === -1 && video.textTracks.length > 0) {
            targetTrackIndex = 0;
          }
          
          // 3. 设置轨道模式
          if (targetTrackIndex !== -1 && playerCore.showSubtitles) {
            console.log('显示轨道索引:', targetTrackIndex);
            // 更新PlayerCore中的字幕轨道索引
            playerCore.setSubtitleTrack(targetTrackIndex);
            // 设置轨道模式
            for (let i = 0; i < video.textTracks.length; i++) {
              video.textTracks[i].mode = i === targetTrackIndex ? 'showing' : 'hidden';
            }
          }
        } else {
          console.log('未找到文本轨道');
        }
      }, 500); // 给更多时间让轨道加载
    };
    
    // 调用设置函数
    setupTextTracks();
    
    // 同时监听loadedmetadata事件作为后备
    const handleLoadedMetadata = () => {
      console.log('视频元数据加载完成，重新设置字幕轨道');
      setupTextTracks();
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [tracks]);

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
    controlsManager.updatePlayingState(isPlaying);
  }, [isPlaying, controlsManager]);

  // 更新缩略图URL到管理器
  useEffect(() => {
    thumbnailManager.updateThumbnailUrl(thumbnailUrl);
  }, [thumbnailUrl, thumbnailManager]);

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
  const sendBarrage = (text: string) => {
    const filteredText = filter.current.filter(text);
    if (!filteredText) return; // 过滤后为空

    // 发送弹幕到播放器核心
    playerCore.sendBarrage(filteredText, userId, username);
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