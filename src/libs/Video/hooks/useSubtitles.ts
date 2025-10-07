import {useEffect, useRef} from 'react';
import {PlayerCore} from '../core';
import {Track as SubtitleTrack} from '../Video.types';
import Logger from "../utils/Logger";

/**
 * 自定义Hook，用于处理字幕轨道
 * @param videoRef 视频元素的引用
 * @param playerCore 播放器核心实例
 * @param tracks 字幕轨道列表
 */
export const useSubtitles = (
  videoRef: React.RefObject<HTMLVideoElement>,
  playerCore: PlayerCore,
  tracks: SubtitleTrack[]
) => {
  const loggerRef = useRef(Logger.getInstance())
  const tracksRef = useRef<SubtitleTrack[]>([]);
  const isInitializedRef = useRef(false);
  
  // 使用useRef存储tracks，避免引用变化导致的重复执行
  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  // 只在初始化时添加字幕轨道，避免外部渲染导致重复创建
  useEffect(() => {
    const video = videoRef.current;
    const logger = loggerRef.current;
    
    if (!video || tracksRef.current.length === 0 || isInitializedRef.current) return;

    logger.debug('初始化添加字幕轨道:', tracksRef.current);
    
    // 存储添加的track元素引用，用于清理
    const addedTracks: HTMLTrackElement[] = [];

    // 添加新的字幕轨道
    tracksRef.current.forEach(track => {
      const trackElement = document.createElement('track');
      trackElement.kind = track.kind;
      trackElement.label = track.label;
      trackElement.srclang = track.srclang; // 使用srclang而不是language
      trackElement.src = track.src;
      
      if (track.default) {
        trackElement.default = true;
        logger.debug('设置默认轨道:', track.label, track.src);
      }
      
      // 添加轨道就绪事件监听
      trackElement.addEventListener('load', () => {
        logger.debug('轨道加载完成:', track.label, track.src);
      });
      
      // 简化错误处理
      trackElement.addEventListener('error', () => {
        logger.debug('轨道加载过程中的临时事件:', track.label, track.src);
      });
      
      video.appendChild(trackElement);
      addedTracks.push(trackElement);
    });

    // 设置轨道函数
    const setupTextTracks = () => {
      if (video && video.textTracks && video.textTracks.length > 0) {
        logger.debug('找到的文本轨道数量:', video.textTracks.length);
        
        // 查找默认轨道或第一个轨道
        let targetTrackIndex = -1;
        
        // 1. 先查找标记为default的轨道
        for (let i = 0; i < tracksRef.current.length; i++) {
          if (tracksRef.current[i].default) {
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
          logger.debug('显示轨道索引:', targetTrackIndex);
          // 更新PlayerCore中的字幕轨道索引
          playerCore.setSubtitleTrack(targetTrackIndex);
          // 设置轨道模式
          for (let i = 0; i < video.textTracks.length; i++) {
            video.textTracks[i].mode = i === targetTrackIndex ? 'showing' : 'hidden';
          }
        }
      } else {
        logger.debug('未找到文本轨道');
      }
    };
    
    // 延迟设置，确保轨道已加载
    setTimeout(() => {
      setupTextTracks();
    }, 300);
    
    // 监听loadedmetadata事件作为后备
    const handleLoadedMetadata = () => {
      logger.debug('视频元数据加载完成，设置字幕轨道');
      setupTextTracks();
    };
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    // 标记为已初始化
    isInitializedRef.current = true;
    
    // 清理函数
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      // 移除添加的track元素
      addedTracks.forEach(track => {
        if (track.parentNode === video) {
          video.removeChild(track);
        }
      });
      // 重置初始化状态
      isInitializedRef.current = false;
    };
  }, [videoRef, playerCore]);
  
  // 单独处理字幕显示状态变化
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.textTracks) return;
    
    const updateSubtitleVisibility = () => {
      if (video.textTracks.length > 0) {
        const trackIndex = playerCore.currentTrackIndex;
        const validIndex = Math.min(trackIndex, video.textTracks.length - 1);
        
        for (let i = 0; i < video.textTracks.length; i++) {
          video.textTracks[i].mode = (playerCore.showSubtitles && i === validIndex) ? 'showing' : 'hidden';
        }
      }
    };
    
    // 监听PlayerCore中的字幕状态变化
    playerCore.on('subtitlesVisibilityChange', updateSubtitleVisibility);
    playerCore.on('subtitleTrackChange', updateSubtitleVisibility);
    
    // 由于playerCore.on()不返回取消订阅函数，这里暂时不进行事件移除
    // 在实际使用中，建议PlayerCore提供完善的事件订阅/取消订阅机制
    return () => {
      // 暂时留空，等待PlayerCore实现完善的事件系统
    };
  }, [videoRef, playerCore]);
};