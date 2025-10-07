import {useEffect} from 'react';
import {PlayerCore} from '../core';
import {SubtitleTrack} from '../Video.types';

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
};